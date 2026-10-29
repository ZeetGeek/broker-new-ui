import assert from "node:assert/strict";
import test from "node:test";

import { authApi } from "@/lib/api/auth";
import { api } from "@/lib/api/client";
import { isOwnerUnavailable, OWNER_UNAVAILABLE_HREF, signupPortal } from "@/lib/auth/launch-policy";
import {
    type AuthUser,
    clearSession,
    destinationForRole,
    getStoredUser,
    portalHomeForRole,
    setSession,
} from "@/lib/auth/session";

import { FEATURE_PLATFORM_OWNER } from "@/config";

test("broker-only signup normalizes every role choice while full launch preserves both roles", () => {
    for (const requested of [undefined, "owner", "broker"] as const) {
        assert.equal(signupPortal(requested, false), "broker");
        assert.equal(signupPortal(requested, true), requested ?? "owner");
    }
    assert.equal(isOwnerUnavailable("owner", false), true);
    assert.equal(isOwnerUnavailable("owner", true), false);
    assert.equal(isOwnerUnavailable("broker", false), false);
});

test("post-login destinations keep disabled owners out of both portals without a redirect loop", () => {
    const ownerHome = FEATURE_PLATFORM_OWNER ? "/owner" : OWNER_UNAVAILABLE_HREF;
    assert.equal(portalHomeForRole("owner"), ownerHome);
    assert.equal(destinationForRole("owner", null), ownerHome);
    assert.equal(destinationForRole("owner", "/broker/dashboard"), ownerHome);
    assert.equal(
        destinationForRole("owner", "/owner/properties"),
        FEATURE_PLATFORM_OWNER ? "/owner/properties" : OWNER_UNAVAILABLE_HREF,
    );
    assert.equal(destinationForRole("owner", OWNER_UNAVAILABLE_HREF), OWNER_UNAVAILABLE_HREF);
    assert.equal(destinationForRole("broker", "/owner/properties"), "/broker/dashboard");
    assert.equal(
        destinationForRole("broker", "/broker/contacts?contact=qa"),
        "/broker/contacts?contact=qa",
    );
    assert.equal(destinationForRole("broker", "//example.test"), "/broker/dashboard");
});

test("registration and Google OAuth requests cannot carry an Owner signup in broker-only mode", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    let submittedRole: string | undefined;
    api.defaults.adapter = async (config) => {
        submittedRole = JSON.parse(config.data).role;
        return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };
    await authApi.register({
        email: "qa@example.test",
        password: "test1234",
        role: "owner",
        countryIso2: "IN",
    });
    const expectedRole = FEATURE_PLATFORM_OWNER ? "owner" : "broker";
    assert.equal(submittedRole, expectedRole);
    const googleUrl = new URL(
        authApi.googleStartUrl({
            role: "owner",
            roleChosen: true,
            countryIso2: "IN",
            referralCode: "QA",
        }),
    );
    assert.equal(googleUrl.searchParams.get("role"), expectedRole);
    assert.equal(googleUrl.searchParams.get("countryIso2"), "IN");
    assert.equal(googleUrl.searchParams.get("referralCode"), "QA");
});

test(
    "disabled Google onboarding blocks Owner completion and preserves existing Owner accounts",
    { skip: FEATURE_PLATFORM_OWNER },
    async (t) => {
        const previous = api.defaults.adapter;
        t.after(() => {
            api.defaults.adapter = previous;
            clearSession();
        });
        let requests = 0;
        api.defaults.adapter = async () => {
            requests++;
            throw new Error("Unexpected API request");
        };
        await assert.rejects(authApi.completeGoogleRole("owner", "IN"), /not available/);
        setSession({
            accessToken: "qa-token",
            user: { id: "qa-owner", role: "owner" } as AuthUser,
        });
        await assert.rejects(authApi.completeGoogleRole("broker", "IN"), /not available/);
        assert.equal(requests, 0);
        assert.equal(getStoredUser()?.role, "owner");
    },
);
