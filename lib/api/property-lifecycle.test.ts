import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { myListingsApi } from "@/lib/api/my-listings";

import {
    clearMyListingsFilters,
    normalizeMyListingsStoredFilters,
    parseMyListingsFilters,
    serializeMyListingsFilters,
} from "@/features/properties/your-listings/filter-my-listings";

test("clearing filters preserves the selected inventory status and sorting", () => {
    for (const status of ["published", "draft", "sold", "deleted"]) {
        const cleared = clearMyListingsFilters(
            parseMyListingsFilters({
                status,
                q: "Mumbai",
                ownerId: "owner-1",
                clientId: "client-1",
                sort: "price_desc",
                bhk: "2",
            }),
        );
        assert.equal(cleared.status, status);
        assert.equal(cleared.sort, "price_desc");
        assert.equal(cleared.q, "");
        assert.equal(cleared.ownerId, undefined);
        assert.equal(cleared.clientId, undefined);
        assert.deepEqual(cleared.bhk, []);
        assert.equal(cleared.page, 1);
    }
});

test("inventory tabs accept sold and recently deleted", () => {
    assert.equal(parseMyListingsFilters({ status: "sold" }).status, "sold");
    assert.equal(parseMyListingsFilters({ status: "deleted" }).status, "deleted");
});

test("recoverable deletion never calls the legacy permanent DELETE", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const calls: { url: string | undefined; method: string | undefined }[] = [];
    api.defaults.adapter = async (config) => {
        calls.push({ url: config.url, method: config.method });
        return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };
    await myListingsApi.remove("property-1");
    await myListingsApi.restore("property-1");
    await myListingsApi.removePermanently("property-1");
    assert.deepEqual(calls, [
        { url: "/properties/property-1/delete", method: "post" },
        { url: "/properties/property-1/restore", method: "post" },
        { url: "/properties/property-1/permanent", method: "delete" },
    ]);
});

test("inventory tabs separate published, sold, and deleted properties", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const urls: string[] = [];
    api.defaults.adapter = async (config) => {
        urls.push(config.url ?? "");
        return {
            data: { items: [], total: 0, page: 1, limit: 20, totalPages: 1 },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    await myListingsApi.list({ status: "published" }, undefined, { withAttachedClients: false });
    await myListingsApi.list({ status: "deleted" }, undefined, { withAttachedClients: false });
    assert.ok(urls[0].includes("publishStatus=published"));
    assert.ok(urls[0].includes("excludeSold=true"));
    assert.ok(urls[1].startsWith("/properties/deleted?"));
    await myListingsApi.list({ status: "sold" }, undefined, { withAttachedClients: false });
    assert.ok(urls[2].includes("status=sold"));
    assert.ok(!urls[2].includes("publishStatus"));
    assert.ok(!urls[2].includes("excludeSold"));
});

test("failed deletion and restoration propagate errors without reporting success", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    api.defaults.adapter = async () => {
        throw new Error("Lifecycle API unavailable");
    };
    await assert.rejects(myListingsApi.remove("property-1"));
    await assert.rejects(myListingsApi.restore("property-1"));
    await assert.rejects(myListingsApi.removePermanently("property-1"));
});

test("inventory summary counts sold separately from published and drafts", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    api.defaults.adapter = async (config) => {
        const url = new URL(config.url!, "https://qa.local");
        const q = url.searchParams;
        const total =
            q.get("status") === "sold"
                ? 2
                : q.get("publishStatus") === "published"
                  ? 5
                  : q.get("publishStatus") === "draft"
                    ? 1
                    : 0;
        if (q.has("publishStatus")) assert.equal(q.get("excludeSold"), "true");
        return {
            data: { items: [], total, page: 1, limit: 1, totalPages: 1 },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    const summary = await myListingsApi.summary();
    assert.equal(summary.sold, 2);
    assert.equal(summary.published, 5);
    assert.equal(summary.draft, 1);
    assert.equal(summary.total, 8);
});

test("sold selection survives storage normalization and URL serialization", () => {
    for (const status of ["published", "draft", "sold", "deleted"] as const) {
        const filters = parseMyListingsFilters({ status, page: "3" });
        const stored = normalizeMyListingsStoredFilters(filters);
        assert.equal(stored.status, status);
        assert.equal(stored.page, 1);
        const query = serializeMyListingsFilters(stored);
        assert.equal(query.get("status"), status);
        assert.equal(parseMyListingsFilters(Object.fromEntries(query)).status, status);
    }
});

test("listing client summaries retain each property's pipeline stage", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    api.defaults.adapter = async (config) => ({
        data: {
            items: [{ id: "property-1", publishStatus: "published" }],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });
    const result = await myListingsApi.list({ status: "published" }, undefined, {
        attachedClients: async () =>
            new Map([
                [
                    "property-1",
                    [
                        { id: "client-1", name: "Rohan", stage: "contacted" },
                        { id: "client-2", name: "Aarav", stage: "negotiation" },
                    ],
                ],
            ]),
    });
    assert.deepEqual(
        result.items[0].attachedClients?.map(({ name, stage }) => ({ name, stage })),
        [
            { name: "Rohan", stage: "contacted" },
            { name: "Aarav", stage: "negotiation" },
        ],
    );
});
