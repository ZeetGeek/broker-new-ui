import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query";
import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { exclusiveOwnerPickerOptions } from "@/lib/contacts/exclusive-owner-picker-query";

test("owner selection can page beyond 100 contacts and searches the full server collection", async (t) => {
    const original = api.defaults.adapter;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    t.after(() => {
        api.defaults.adapter = original;
        client.clear();
    });
    const pages: number[] = [];
    api.defaults.adapter = async (config) => {
        const url = new URL(config.url!, "https://qa.local");
        assert.equal(url.pathname, "/exclusive-owners");
        assert.equal(url.searchParams.get("sort"), "name");
        const search = url.searchParams.get("search");
        const page = Number(url.searchParams.get("page"));
        pages.push(page);
        const items = search
            ? [{ id: "owner-121", fullName: "Zoya" }]
            : Array.from({ length: 20 }, (_, index) => ({
                  id: `owner-${(page - 1) * 20 + index + 1}`,
              }));
        return {
            data: { items, page, limit: 20, total: search ? 1 : 120, totalPages: search ? 1 : 6 },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    const observer = new InfiniteQueryObserver(client, exclusiveOwnerPickerOptions("", true));
    await observer.refetch();
    while (observer.getCurrentResult().hasNextPage) await observer.fetchNextPage();
    assert.deepEqual(pages, [1, 2, 3, 4, 5, 6]);
    assert.equal(observer.getCurrentResult().data?.pages[5].items[19].id, "owner-120");
    const search = new InfiniteQueryObserver(client, exclusiveOwnerPickerOptions("  Zoya  ", true));
    const result = await search.refetch();
    assert.equal(result.data?.pages[0].items[0].id, "owner-121");
    assert.equal(search.getCurrentResult().hasNextPage, false);
    assert.equal(observer.getCurrentResult().data?.pages.length, 6);
});
