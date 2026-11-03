import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { myListingsApi } from "@/lib/api/my-listings";

import { parseMyListingsFilters } from "@/features/properties/your-listings/filter-my-listings";

test("inventory tabs migrate old sold links and accept recently deleted", () => {
    assert.equal(parseMyListingsFilters({ status: "sold" }).status, "published");
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

test("inventory publish state does not exclude sold properties", async (t) => {
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
    assert.ok(!urls[0].includes("excludeSold"));
    assert.ok(urls[1].startsWith("/properties/deleted?"));
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
