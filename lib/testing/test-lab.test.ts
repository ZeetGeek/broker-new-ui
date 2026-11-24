import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import { authApi } from "@/lib/api/auth";

import { cloneTestRecord, testData, testSnapshot } from "./test-data";
import {
    DEFAULT_TEST_LAB,
    getTestLabSettings,
    parseTestLabSettings,
    saveTestLabSettings,
    TEST_LAB_KEY,
    type TestLabSettings,
} from "./test-lab";
import { simulateTestRequest, withTestNetwork } from "./test-network";

function storage(): Storage {
    const entries: Record<string, string> = {};
    return new Proxy(
        {
            getItem: (key: string) => entries[key] ?? null,
            setItem: (key: string, value: string) => {
                entries[key] = String(value);
            },
            removeItem: (key: string) => {
                delete entries[key];
            },
            clear: () => {
                for (const key of Object.keys(entries)) delete entries[key];
            },
            key: (index: number) => Object.keys(entries)[index] ?? null,
            get length() {
                return Object.keys(entries).length;
            },
        },
        {
            ownKeys: () => Object.keys(entries),
            getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
        },
    );
}

function browser(settings: Partial<TestLabSettings> = {}) {
    const session = storage(),
        local = storage();
    session.setItem(
        TEST_LAB_KEY,
        JSON.stringify({ ...DEFAULT_TEST_LAB, source: "sample", ...settings }),
    );
    const original = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: { sessionStorage: session, localStorage: local },
    });
    return {
        session,
        local,
        restore: () =>
            original
                ? Object.defineProperty(globalThis, "window", original)
                : Reflect.deleteProperty(globalThis, "window"),
    };
}

test("corrupt or unsupported settings fall back to safe defaults", () => {
    assert.deepEqual(parseTestLabSettings(null), DEFAULT_TEST_LAB);
    const settings = parseTestLabSettings({
        source: "whatever",
        volume: "infinite",
        network: "invalid",
        account: "admin",
        revision: -2,
    });
    assert.deepEqual(settings, DEFAULT_TEST_LAB);
    const state = browser();
    try {
        state.session.setItem(TEST_LAB_KEY, "broken JSON");
        assert.deepEqual(getTestLabSettings(), DEFAULT_TEST_LAB);
    } finally {
        state.restore();
    }
});

test("changing scenarios resets only the dedicated sample namespace", () => {
    const state = browser();
    try {
        for (const store of [state.session, state.local]) {
            store.setItem("broker_access_token", "real-token");
            store.setItem("crm.private-tasks.mock.v4.real-account", "saved-work");
            store.setItem("crm.test-lab.data.some-samples", "samples");
        }
        saveTestLabSettings({ ...DEFAULT_TEST_LAB, source: "sample", volume: "empty" });
        for (const store of [state.session, state.local]) {
            assert.equal(store.getItem("broker_access_token"), "real-token");
            assert.equal(store.getItem("crm.private-tasks.mock.v4.real-account"), "saved-work");
            assert.equal(store.getItem("crm.test-lab.data.some-samples"), null);
        }
        assert.equal(getTestLabSettings().volume, "empty");
    } finally {
        state.restore();
    }
});

test("data volumes apply to the full collection and expanded foreign keys remain consistent", () => {
    const seed = [
        { id: "one", clientId: "client-one", property: { id: "property-one", title: "Home" } },
        { id: "two", clientId: "client-two", property: { id: "property-two", title: "Office" } },
    ];
    const state = browser({ volume: "stress" });
    try {
        const items = testData(seed);
        assert.equal(items.length, 300);
        assert.equal(new Set(items.map((item) => item.id)).size, 300);
        assert.equal(items[2].id, "one__test1");
        assert.equal(items[2].clientId, "client-one__test1");
        assert.equal(items[2].property.id, "property-one__test1");
        assert.equal(seed[0].property.title, "Home");
        state.session.setItem(
            TEST_LAB_KEY,
            JSON.stringify({ ...DEFAULT_TEST_LAB, source: "sample", volume: "less" }),
        );
        assert.equal(testData(seed).length, 2);
    } finally {
        state.restore();
    }
});

test("new accounts respect the chosen data volume, while Empty all clears records and dashboard aggregates", () => {
    const state = browser({ account: "new" });
    try {
        assert.equal(testData([{ id: "client" }]).length, 30);
        assert.ok(testData([{ id: "property" }], "marketplace").length > 0);
        const snapshot = testSnapshot({
            total: 18,
            items: [{ id: "a" }],
            stages: [{ key: "new", count: 8 }],
            nextShowing: { id: "visit" },
        });
        assert.equal(snapshot.total, 18);
        assert.deepEqual(snapshot.items, [{ id: "a" }]);
        assert.equal(snapshot.stages[0].count, 8);
        assert.deepEqual(snapshot.nextShowing, { id: "visit" });
        state.session.setItem(
            TEST_LAB_KEY,
            JSON.stringify({
                ...DEFAULT_TEST_LAB,
                source: "sample",
                account: "new",
                volume: "empty",
            }),
        );
        assert.deepEqual(testData([{ id: "property" }], "marketplace"), []);
        assert.deepEqual(testData([{ id: "client" }]), []);
        const empty = testSnapshot(snapshot);
        assert.equal(empty.total, 0);
        assert.deepEqual(empty.items, []);
        assert.equal(empty.stages[0].count, 0);
        assert.equal(empty.nextShowing, null);
    } finally {
        state.restore();
    }
});

test("awkward content includes missing images and valid task-length titles", () => {
    const result = cloneTestRecord(
        {
            id: "a",
            title: "A long title ".repeat(8),
            imageSrcs: ["photo.jpg"],
            avatarUrl: "avatar.jpg",
        },
        0,
        true,
    );
    assert.ok(result.title.length <= 160);
    assert.deepEqual(result.imageSrcs, []);
    assert.equal(result.avatarUrl, "");
});

test("expanding full-length task titles never exceeds the task schema limit", () => {
    const state = browser({ volume: "stress" });
    try {
        const records = testData([
            {
                id: "task-at-title-limit",
                title: "x".repeat(160),
                clientId: null,
                propertyId: null,
                ownerId: null,
                listId: null,
                deliveredReminderKeys: [],
            },
        ]);
        assert.equal(records.length, 300);
        assert.equal(new Set(records.map((record) => record.id)).size, 300);
        assert.ok(records.every((record) => record.title.length <= 160));
        assert.equal(cloneTestRecord({ title: "x".repeat(160) }, 1).title.length, 160);
    } finally {
        state.restore();
    }
});

test("offline, error, access denied, and rate limits reject reads and writes without invoking them", async () => {
    for (const [network, status] of [
        ["offline", 0],
        ["error", 500],
        ["unauthorized", 401],
        ["forbidden", 403],
        ["rate-limited", 429],
    ] as const) {
        const state = browser({ network });
        let invoked = false;
        try {
            const api = withTestNetwork({
                save: async () => {
                    invoked = true;
                    return "saved";
                },
            });
            await assert.rejects(
                api.save(),
                (error: unknown) =>
                    error instanceof Error && "status" in error && error.status === status,
            );
            assert.equal(invoked, false);
        } finally {
            state.restore();
        }
    }
});

test("adapter method replacement remains visible to callers and internal lookups", async () => {
    const api = withTestNetwork({
        read: async () => "first",
        async current() {
            return this.read();
        },
    });
    assert.equal(await api.current(), "first");
    api.read = async () => "replacement";
    assert.equal(await api.current(), "replacement");
});

test("sample Google sign-in cannot escape into real backend OAuth", () => {
    const state = browser({ account: "signed-out" });
    try {
        assert.throws(() => authApi.googleStartUrl(), /unavailable with sample data/);
    } finally {
        state.restore();
    }
});

test("pending requests respect cancellation and live data ignores simulated failures", async () => {
    const state = browser({ network: "loading" });
    try {
        const controller = new AbortController();
        const pending = simulateTestRequest(controller.signal);
        controller.abort();
        await assert.rejects(pending, { name: "AbortError" });
        state.session.setItem(
            TEST_LAB_KEY,
            JSON.stringify({ ...DEFAULT_TEST_LAB, source: "live", network: "offline" }),
        );
        await simulateTestRequest();
    } finally {
        state.restore();
    }
});

test(
    "sample sessions and delayed writes cannot cross into the real account",
    { timeout: 30_000 },
    () => {
        const script = `
        const assert = await import('node:assert/strict');
        const storage = () => { const entries = new Map(); return { getItem: key => entries.get(key) ?? null, setItem: (key,value) => entries.set(key,String(value)), removeItem: key => entries.delete(key) }; };
        globalThis.sessionStorage = storage(); globalThis.localStorage = storage(); globalThis.window = { sessionStorage, localStorage };
        const real = { id: 'real-user', role: 'broker' };
        localStorage.setItem('broker_access_token', 'real-token'); localStorage.setItem('broker_auth_user', JSON.stringify(real));
        const session = await import('./lib/auth/session.ts');
        assert.equal(session.getAccessToken(), 'real-token');
        const lab = await import('./lib/testing/test-lab.ts');
        sessionStorage.setItem(lab.TEST_LAB_KEY, JSON.stringify({ ...lab.DEFAULT_TEST_LAB, source: 'sample', network: 'slow' }));
        session.setSession({ accessToken: 'sample-token', user: { id: 'sample-user', role: 'broker' } });
        assert.equal(session.getAccessToken(), 'sample-token');
        assert.equal(localStorage.getItem('broker_access_token'), 'real-token');
        session.clearSession(); assert.equal(localStorage.getItem('broker_access_token'), 'real-token');
        session.setSession({ accessToken: 'sample-token', user: { id: 'sample-user', role: 'broker' } });
        const { withTestNetwork } = await import('./lib/testing/test-network.ts');
        let wrote = false;
        const api = withTestNetwork({ save: async () => { wrote = true; } });
        const pending = api.save();
        sessionStorage.setItem(lab.TEST_LAB_KEY, JSON.stringify({ ...lab.DEFAULT_TEST_LAB, source: 'live' }));
        lab.beginTestLabReload();
        assert.equal(session.getAccessToken(), 'real-token'); assert.equal(session.getStoredUser().id, 'real-user');
        await assert.rejects(pending, /Test setup is changing/); assert.equal(wrote, false);
        const { apiFetch } = await import('./lib/api/client.ts');
        await assert.rejects(apiFetch('/clients', { method: 'POST' }), /Test setup is changing/);
        console.log('Isolation passed');
    `;
        const output = execFileSync(
            process.execPath,
            ["--import", "tsx", "--input-type=module", "-e", script],
            {
                cwd: process.cwd(),
                encoding: "utf8",
                timeout: 25_000,
                env: { ...process.env, NODE_ENV: "test", NEXT_PUBLIC_USE_MOCK_DATA: "false" },
            },
        );
        assert.match(output, /Isolation passed/);
    },
);

test(
    "normal production ignores saved lab state and never enables the test login",
    { timeout: 30_000 },
    () => {
        const script = `
        const assert = await import('node:assert/strict');
        globalThis.window = { sessionStorage: { getItem: () => JSON.stringify({ source: 'sample', volume: 'stress' }) } };
        const lab = await import('./lib/testing/test-lab.ts');
        assert.equal(lab.TEST_LAB_AVAILABLE, false); assert.equal(lab.isTestSampleMode(), false); assert.equal(lab.isSampleDataEnabled(), false);
        console.log('Production passed');
    `;
        const output = execFileSync(
            process.execPath,
            ["--import", "tsx", "--input-type=module", "-e", script],
            {
                cwd: process.cwd(),
                encoding: "utf8",
                timeout: 25_000,
                env: {
                    ...process.env,
                    NODE_ENV: "production",
                    NEXT_PUBLIC_ENABLE_TEST_LAB: "false",
                    NEXT_PUBLIC_USE_MOCK_DATA: "false",
                },
            },
        );
        assert.match(output, /Production passed/);
    },
);

for (const scenario of [
    "less",
    "more",
    "stress",
    "empty",
    "new",
    "new-less",
    "new-stress",
    "new-empty",
    "awkward",
] as const) {
    test(`app fixtures boot together in a fresh ${scenario} scenario`, { timeout: 60_000 }, () => {
        const settings = {
            ...DEFAULT_TEST_LAB,
            source: "sample",
            volume:
                scenario === "new-less"
                    ? "less"
                    : scenario === "new-stress"
                      ? "stress"
                      : scenario === "new-empty"
                        ? "empty"
                        : ["new", "awkward"].includes(scenario)
                          ? "more"
                          : scenario,
            account: scenario.startsWith("new") ? "new" : "existing",
            edgeCases: scenario === "awkward",
        };
        const script = `
            const assert = await import('node:assert/strict');
            const values = new Map([['${TEST_LAB_KEY}', ${JSON.stringify(JSON.stringify(settings))}]]);
            globalThis.sessionStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
            globalThis.localStorage = globalThis.sessionStorage;
            globalThis.window = { sessionStorage, localStorage };
            const { myListingsApi } = await import('./lib/api/my-listings.ts');
            const { clientsApi } = await import('./lib/api/clients.ts');
            const { contactsApi } = await import('./lib/api/contacts.ts');
            const { DEFAULT_CONTACTS_FILTERS } = await import('./features/contacts/types.ts');
            const { pipelineApi } = await import('./lib/api/pipeline.ts');
            const { propertiesApi } = await import('./lib/api/properties.ts');
            const { siteVisitsApi } = await import('./lib/api/site-visits.ts');
            const { taskPreviewStore } = await import('./features/tasks/preview-store.ts');
            const { DEFAULT_DEALS_FILTERS } = await import('./features/pipeline/types.ts');
            const { DEFAULT_MY_LISTINGS_FILTERS } = await import('./features/properties/your-listings/types.ts');
            const { taskSchema } = await import('./features/tasks/model.ts');
            const { MOCK_OWNER_LISTINGS } = await import('./features/properties/owner-listings/mock-owner-listings.ts');
            const { dashboardMock } = await import('./features/dashboard/mock-data.ts');
            const { earningsApi } = await import('./lib/api/earnings.ts');
            const deals = await pipelineApi.list(DEFAULT_DEALS_FILTERS);
            const listings = await myListingsApi.list(DEFAULT_MY_LISTINGS_FILTERS);
            const visits = await siteVisitsApi.list({ tab: 'upcoming' });
            const tasks = await taskPreviewStore.list('lab-scenario');
            assert.deepEqual(await taskPreviewStore.list('lab-scenario'), tasks, 'dashboard and reminder listeners can read the same stored tasks');
            const inventory = await propertiesApi.list({ limit: 100 });
            assert.ok(Array.isArray(inventory.items));
            const empty = ${JSON.stringify(scenario === "empty" || scenario === "new-empty")};
            assert.equal(deals.items.length === 0, empty);
            assert.equal(listings.total === 0, empty);
            assert.equal(visits.total === 0, empty);
            assert.equal(tasks.length === 0, empty);
            const expectedOwners = ${JSON.stringify(settings.volume === "empty" ? 0 : settings.volume === "less" ? 3 : settings.volume === "stress" ? 300 : 30)};
            const owners = await contactsApi.listOwnersPage({ ...DEFAULT_CONTACTS_FILTERS, tab: 'owners', ownerOrigin: 'custom' }, null);
            assert.equal(owners.total, expectedOwners, 'Contacts includes exclusive owners at the selected sample volume');
            assert.equal((await contactsApi.summary()).ownerCount, expectedOwners, 'owner counts agree with the owner list');
            assert.ok(owners.items.every(owner => owner.origin === 'custom'), 'broker-added owners stay distinct from platform owners');
            if (owners.items.length) {
                const owner = owners.items[0];
                assert.ok(owner.name && owner.phoneDigits && owner.details.city, 'sample owners include card and preview details');
                assert.equal((await propertiesApi.get(owner.properties[0].id)).id, owner.properties[0].id, 'sample owner properties resolve to the shared inventory');
            }
            if (${JSON.stringify(scenario === "stress" || scenario === "new-stress")}) {
                assert.equal(tasks.length, 300, 'stress mode supplies 300 valid tasks');
                assert.equal(deals.items.length, 300, 'stress mode supplies 300 pipeline records across stages');
            }
            assert.equal(dashboardMock.pipelineCard.activeTotal === 0, empty);
            const earnings = await earningsApi.report({ preset: 'all_time' });
            assert.equal(earnings.live.count === 0, empty);
            const { visitDateBounds } = await import('./features/new-site-visits/model.ts');
            const todayVisits = await siteVisitsApi.list({ tab: 'active', ...visitDateBounds('today', Date.now()), limit: 50 });
            assert.equal(todayVisits.total === 0, empty, 'today filter must include sample visits on the current India date');
            const { groupDashboardVisits } = await import('./features/new-dashboard/dashboard-visit.ts');
            const groups = groupDashboardVisits(todayVisits.items, [], Date.now());
            if (!empty) assert.ok(groups.upcoming.length + groups.running.length + groups.needs_update.length > 0, 'dashboard visit groups must display sample records');
            if (!empty) {
                const exact = visits.items[0];
                const instant = await siteVisitsApi.list({ tab: 'active', from: exact.startsAt, to: exact.startsAt, limit: 300 });
                assert.ok(instant.items.some(item => item.id === exact.id), 'instant range bounds remain inclusive');
            }
            for (const task of tasks) taskSchema.parse(task);
            if (deals.items.length) assert.equal((await pipelineApi.get(deals.items.at(-1).id)).id, deals.items.at(-1).id);
            if (listings.items.length) assert.equal((await propertiesApi.get(listings.items[0].id)).id, listings.items[0].id);
            assert.equal(MOCK_OWNER_LISTINGS.length === 0, empty);
            console.log('Scenario passed');
        `;
        const result = execFileSync(
            process.execPath,
            ["--import", "tsx", "--input-type=module", "-e", script],
            {
                cwd: process.cwd(),
                encoding: "utf8",
                timeout: 55_000,
                env: { ...process.env, NEXT_PUBLIC_USE_MOCK_DATA: "false", NODE_ENV: "test" },
            },
        );
        assert.match(result, /Scenario passed/);
    });
}
