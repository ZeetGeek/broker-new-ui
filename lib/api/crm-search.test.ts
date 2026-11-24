import { QueryClient } from "@tanstack/react-query";
import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { contactsApi } from "@/lib/api/contacts";
import { myListingsApi } from "@/lib/api/my-listings";
import { propertiesApi, type PropertyListing } from "@/lib/api/properties";
import { siteVisitsApi, type VisitListQuery } from "@/lib/api/site-visits";

import { DEFAULT_CONTACTS_FILTERS } from "@/features/contacts/types";

test("client search is sent to the API and pages normally", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const requests: URL[] = [];
    api.defaults.adapter = async (config) => {
        const url = new URL(config.url!, "https://test.invalid");
        requests.push(url);
        const page = Number(url.searchParams.get("page"));
        return {
            data: {
                items: [{ id: `c${page}`, name: "Ravi Patel", phone: "9876543210", leads: [] }],
                page,
                totalPages: 2,
                total: 21,
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    const filters = { ...DEFAULT_CONTACTS_FILTERS, q: " Ravi Orchid ", sort: "name" as const };
    const first = await contactsApi.listBuyersPage(filters, null);
    assert.deepEqual(
        first.items.map((item) => item.id),
        ["c1"],
    );
    assert.equal(first.total, 21);
    assert.equal(first.nextCursor, "2");
    const next = await contactsApi.listBuyersPage(filters, first.nextCursor);
    assert.equal(next.nextCursor, null);
    assert.equal(requests.length, 2);
    for (const url of requests) {
        assert.equal(url.pathname, "/clients");
        assert.equal(url.searchParams.get("search"), "Ravi Orchid");
        assert.equal(url.searchParams.get("sort"), "name");
        assert.equal(url.searchParams.get("limit"), "20");
    }
});

test("owner search finds a linked property on a later owner page", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    api.defaults.adapter = async (config) => {
        const url = new URL(config.url!, "https://test.invalid");
        assert.equal(url.pathname, "/exclusive-owners");
        assert.equal(url.searchParams.has("search"), false);
        const page = Number(url.searchParams.get("page"));
        return {
            data: {
                items: [
                    {
                        id: `o${page}`,
                        fullName: page === 2 ? "Meera Shah" : "Other owner",
                        phone: "+919876543210",
                        ownerType: "individual",
                        society: "",
                        city: "Mumbai",
                        propertyCount: 1,
                        properties: [
                            {
                                id: `p${page}`,
                                title: page === 2 ? "Orchid Heights" : "Other property",
                                photos: ["/cover.jpg"],
                            },
                        ],
                    },
                ],
                page,
                totalPages: 2,
                total: 2,
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    const result = await contactsApi.listOwnersPage(
        { ...DEFAULT_CONTACTS_FILTERS, ownerOrigin: "custom", q: "Meera Orchid" },
        null,
    );
    assert.deepEqual(
        result.items.map((item) => item.id),
        ["o2"],
    );
    assert.equal(result.total, 1);
});

test("listing search is sent to the API and pages normally instead of collecting every page", async (t) => {
    const previous = propertiesApi.list;
    t.after(() => {
        propertiesApi.list = previous;
    });
    const requests: { search?: string; page?: number }[] = [];
    propertiesApi.list = async (query) => {
        assert.equal(query?.publishStatus, "published");
        requests.push({ search: query?.search, page: query?.page });
        const listing: PropertyListing = {
            id: "p2",
            title: "Orchid Heights",
            subtype: "apartment",
            city: "Mumbai",
            publishStatus: "published",
            status: "available",
            exclusiveOwner: { id: "o1", fullName: "Meera Shah", phone: "+919876543210" },
        };
        return { items: [listing], page: 1, total: 25, totalPages: 2, limit: 20 };
    };
    const result = await myListingsApi.list(
        { q: "  Ravi Orchid Meera ", status: "published" },
        undefined,
        { attachedClients: async () => new Map([["p2", [{ id: "c1", name: "Ravi Patel" }]]]) },
    );
    // One request for the page asked for; the server does the matching.
    assert.deepEqual(requests, [{ search: "Ravi Orchid Meera", page: 1 }]);
    assert.deepEqual(
        result.items.map((item) => item.id),
        ["p2"],
    );
    assert.equal(result.total, 25);
    assert.equal(result.totalPages, 2);
    assert.deepEqual(result.items[0].attachedClients, [{ id: "c1", name: "Ravi Patel" }]);
});

test("listing search still applies with local-only filters", async (t) => {
    const previous = propertiesApi.list;
    t.after(() => {
        propertiesApi.list = previous;
    });
    const searches: (string | undefined)[] = [];
    propertiesApi.list = async (query) => {
        searches.push(query?.search);
        const page = query?.page ?? 1;
        const listing: PropertyListing = {
            id: `p${page}`,
            title: "Orchid Heights",
            subtype: "apartment",
            city: "Mumbai",
            publishStatus: "published",
            status: "available",
        };
        return { items: [listing], page, total: 2, totalPages: 2, limit: 20 };
    };
    const result = await myListingsApi.list(
        { q: "Orchid", status: "published", clientId: "c1" },
        undefined,
        { attachedClients: async () => new Map([["p2", [{ id: "c1", name: "Ravi Patel" }]]]) },
    );
    // The client filter is still local, so every page is checked — each one searched.
    assert.deepEqual(searches, ["Orchid", "Orchid"]);
    assert.deepEqual(
        result.items.map((item) => item.id),
        ["p2"],
    );
});

test("visit search retains status/date/person filters, searches later pages and paginates matches", async (t) => {
    const previous = api.defaults.adapter;
    const cache = new QueryClient();
    t.after(() => {
        api.defaults.adapter = previous;
        cache.clear();
    });
    let calls = 0;
    api.defaults.adapter = async (config) => {
        calls++;
        const url = new URL(config.url!, "https://test.invalid");
        assert.equal(url.searchParams.has("search"), false);
        assert.equal(url.searchParams.get("tab"), "completed");
        assert.equal(url.searchParams.get("from"), "2026-11-01");
        assert.equal(url.searchParams.get("clientId"), "c1");
        const page = Number(url.searchParams.get("page"));
        return {
            data: {
                items: [
                    {
                        id: `v${page}`,
                        leadId: "l1",
                        propertyId: "p1",
                        scheduledDate: "2026-11-19T04:30:00Z",
                        status: "completed",
                        client: { id: "c1", name: "Ravi Patel", phone: "9876543210" },
                        owner: { id: "o1", fullName: page === 2 ? "Meera Shah" : "Other owner" },
                        property: {
                            id: "p1",
                            title: "Orchid Heights",
                            city: "Mumbai",
                            address: "Andheri",
                        },
                        notes: "Bring keys",
                    },
                ],
                page,
                total: 2,
                totalPages: 2,
                counts: { completed: 2 },
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    const base: VisitListQuery = { tab: "completed", from: "2026-11-01", clientId: "c1", limit: 1 };
    const source = () =>
        cache.fetchQuery({
            queryKey: ["visits-search"],
            queryFn: () => siteVisitsApi.searchSource(base),
            staleTime: Infinity,
        });
    const found = await siteVisitsApi.list({ ...base, search: "Meera keys" }, undefined, source);
    assert.deepEqual(
        found.items.map((visit) => visit.id),
        ["v2"],
    );
    assert.equal(found.counts.completed, 2);
    const paged = await siteVisitsApi.list({ ...base, search: "Ravi", page: 2 }, undefined, source);
    assert.deepEqual(
        paged.items.map((visit) => visit.id),
        ["v2"],
    );
    assert.equal(paged.total, 2);
    assert.equal(paged.totalPages, 2);
    assert.equal(calls, 2);
});

test("a cancelled visit scan stops before fetching another page", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const controller = new AbortController();
    let calls = 0;
    api.defaults.adapter = async (config) => {
        calls++;
        controller.abort();
        return {
            data: { items: [], totalPages: 5 },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    await assert.rejects(siteVisitsApi.searchSource({ tab: "upcoming" }, controller.signal));
    assert.equal(calls, 1);
});
