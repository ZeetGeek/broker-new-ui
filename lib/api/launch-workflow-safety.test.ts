import assert from "node:assert/strict";
import test from "node:test";

import { brokerVisitsApi } from "@/lib/api/broker-visits";
import { api, ApiError } from "@/lib/api/client";
import { myListingsApi } from "@/lib/api/my-listings";
import type { UserProfile } from "@/lib/api/profile";
import { type AuthUser, clearSession, getSessionVersion, setSession } from "@/lib/auth/session";

import type {
    PersonSummary,
    PropertyWithSlots,
    VisitSlot,
} from "@/features/site-visits/broker/model";
import { USE_MOCK_VISITS } from "@/mocks/visits";
import { bookingSchema } from "@/schemas/visits";
import { makeStore } from "@/store";
import { clearAuth, establishSession } from "@/store/slices/auth-slice";
import { fetchBrokerDashboard, setProfile } from "@/store/slices/dashboard-slice";

test(
    "booking schema and live adapter reject multiple attendees before any lead or booking writes",
    { skip: USE_MOCK_VISITS },
    async (t) => {
        assert.equal(
            bookingSchema.safeParse({ buyerIds: ["one"], acceptTight: false }).success,
            true,
        );
        assert.equal(
            bookingSchema.safeParse({ buyerIds: ["one", "two"], acceptTight: false }).success,
            false,
        );
        const previous = api.defaults.adapter;
        t.after(() => {
            api.defaults.adapter = previous;
        });
        let requests = 0;
        api.defaults.adapter = async () => {
            requests++;
            throw new Error("Unexpected request");
        };
        await assert.rejects(
            brokerVisitsApi.book({
                item: {} as PropertyWithSlots,
                slot: {} as VisitSlot,
                buyers: [{ id: "one" }, { id: "two" }] as PersonSummary[],
            }),
            /exactly one client/,
        );
        assert.equal(requests, 0);
        await assert.rejects(
            brokerVisitsApi.reschedule("visit", "2026-11-01T05:00:00Z", "2026-11-01T06:00:00Z"),
            /Cancel this visit/,
        );
        assert.equal(requests, 0);
    },
);

test("property missing is reserved for HTTP 404; offline and permission failures reject", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    for (const status of [0, 403, 500, 404]) {
        api.defaults.adapter = async () => {
            throw new ApiError("Failed", status);
        };
        if (status === 404) assert.equal(await myListingsApi.get("qa-property"), null);
        else
            await assert.rejects(
                myListingsApi.get("qa-property"),
                (error: unknown) => error instanceof ApiError && error.status === status,
            );
    }
});

test("account changes and forced signout reset dashboard; old dashboard completions are discarded", () => {
    const store = makeStore();
    const userA = { id: "account-a", role: "broker" } as AuthUser;
    const userB = { id: "account-b", role: "broker" } as AuthUser;
    try {
        store.dispatch(establishSession({ accessToken: "token-a", user: userA }));
        store.dispatch(setProfile({ fullName: "Account A" } as UserProfile));
        store.dispatch(fetchBrokerDashboard.pending("old-request", undefined));
        const epoch = store.getState().auth.sessionEpoch;
        store.dispatch(establishSession({ accessToken: "token-b", user: userB }));
        assert.equal(store.getState().dashboard.profile, null);
        assert.ok(store.getState().auth.sessionEpoch > epoch);
        store.dispatch(
            fetchBrokerDashboard.fulfilled(
                { data: null, profile: { fullName: "Account A" } as UserProfile },
                "old-request",
                undefined,
            ),
        );
        assert.equal(store.getState().dashboard.profile, null);
        store.dispatch(setProfile({ fullName: "Account B" } as UserProfile));
        store.dispatch(clearAuth());
        assert.equal(store.getState().dashboard.profile, null);
        assert.equal(store.getState().dashboard.data, null);
    } finally {
        clearSession();
    }
});

test("old HTTP responses cannot cross a session boundary, while same-account token refresh preserves the session version", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
        clearSession();
    });
    const userA = { id: "account-a", role: "broker" } as AuthUser;
    setSession({ accessToken: "token-a", user: userA });
    const version = getSessionVersion();
    setSession({ accessToken: "token-a-refreshed", user: userA });
    assert.equal(getSessionVersion(), version);
    let release!: () => void;
    const ready = new Promise<void>((resolve) => {
        api.defaults.adapter = async (config) => {
            resolve();
            await new Promise<void>((done) => {
                release = done;
            });
            return {
                data: { private: "account-a" },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };
    });
    const request = api.get("/qa-private");
    await ready;
    clearSession();
    setSession({ accessToken: "token-b", user: { id: "account-b", role: "broker" } as AuthUser });
    const rejection = assert.rejects(request, /Session changed/);
    release();
    await rejection;
});
