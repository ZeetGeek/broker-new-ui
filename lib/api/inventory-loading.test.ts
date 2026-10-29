import { QueryClient } from "@tanstack/react-query";
import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { myListingsApi } from "@/lib/api/my-listings";
import { pipelineApi } from "@/lib/api/pipeline";
import type { PropertyListing, PropertyListQuery } from "@/lib/api/properties";
import { EMPTY_PROPERTY_CRITERIA } from "@/lib/properties/list-criteria";

import { DEFAULT_DEALS_FILTERS } from "@/features/pipeline/types";

test("inventory pages share collection/lead scans, refresh invalidates them, and a second session gets its own cache", async () => {
    let leadScans = 0;
    let collectionScans = 0;
    const clients = [new QueryClient(), new QueryClient()];
    const inventory: PropertyListing[] = Array.from({ length: 40 }, (_, index) => ({
        id: `property-${index}`,
        title: `Property ${index}`,
        subtype: "apartment",
        areaSqft: 1200,
        salePrice: "7500000",
        transactionType: "sale",
        publishStatus: "published",
        status: "available",
    }));
    const options = (client: QueryClient, userId: string) => ({
        attachedClients: () =>
            client.fetchQuery({
                queryKey: ["inventory-lead-summary", userId],
                queryFn: async () => {
                    leadScans++;
                    return new Map([["property-0", [{ id: "buyer", name: "Buyer" }]]]);
                },
                staleTime: 30_000,
            }),
        propertyCollection: (query: PropertyListQuery) =>
            client.fetchQuery({
                queryKey: ["inventory-filter-collection", userId, query],
                queryFn: async () => {
                    collectionScans++;
                    return inventory;
                },
                staleTime: 30_000,
            }),
    });
    const filters = { propertyFilters: { ...EMPTY_PROPERTY_CRITERIA, minAreaSqft: "500" } };
    try {
        const first = await myListingsApi.list(
            { ...filters, page: 1 },
            undefined,
            options(clients[0], "account-a"),
        );
        const second = await myListingsApi.list(
            { ...filters, page: 2 },
            undefined,
            options(clients[0], "account-a"),
        );
        assert.equal(first.total, 40);
        assert.ok(second.items.length > 0);
        assert.ok(!first.items.some((item) => second.items.some((later) => later.id === item.id)));
        assert.equal(first.items[0].attachedClients?.[0]?.name, "Buyer");
        assert.equal(leadScans, 1);
        assert.equal(collectionScans, 1);
        await clients[0].invalidateQueries();
        await myListingsApi.list(
            { ...filters, page: 1 },
            undefined,
            options(clients[0], "account-a"),
        );
        assert.equal(leadScans, 2);
        assert.equal(collectionScans, 2);
        await myListingsApi.list(
            { ...filters, page: 1 },
            undefined,
            options(clients[1], "account-b"),
        );
        assert.equal(leadScans, 3);
        assert.equal(collectionScans, 3);
    } finally {
        clients.forEach((client) => client.clear());
    }
});

test("cancelled Pipeline searches stop before reading later lead pages", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const controller = new AbortController();
    let pages = 0;
    api.defaults.adapter = async (config) => {
        pages++;
        assert.ok(config.signal);
        controller.abort();
        return {
            data: { items: [], totalPages: 10 },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    await assert.rejects(
        pipelineApi.list({ ...DEFAULT_DEALS_FILTERS, q: "Office" }, controller.signal),
    );
    assert.equal(pages, 1);
});
