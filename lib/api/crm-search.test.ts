import { QueryClient } from "@tanstack/react-query";
import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { contactsApi } from "@/lib/api/contacts";
import { myListingsApi } from "@/lib/api/my-listings";
import { propertiesApi, type PropertyListing } from "@/lib/api/properties";
import { siteVisitsApi, type VisitListQuery } from "@/lib/api/site-visits";

import { DEFAULT_CONTACTS_FILTERS } from "@/features/contacts/types";

test("client search checks later API pages and reuses its collection for another search", async (t) => {
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
        assert.equal(url.pathname, "/clients");
        assert.equal(url.searchParams.has("search"), false);
        const page = Number(url.searchParams.get("page"));
        return {
            data: {
                items: [
                    {
                        id: `c${page}`,
                        name: page === 2 ? "Ravi Patel" : "Other client",
                        phone: "9876543210",
                        leads:
                            page === 2
                                ? [
                                      {
                                          id: "l1",
                                          propertyId: "p1",
                                          stage: "new",
                                          property: {
                                              id: "p1",
                                              title: "Orchid Heights",
                                              photos: ["/cover.jpg"],
                                          },
                                      },
                                  ]
                                : [],
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
    const source = () =>
        cache.fetchQuery({
            queryKey: ["clients-search"],
            queryFn: () => contactsApi.buyerSearchSource(),
            staleTime: Infinity,
        });
    const first = await contactsApi.listBuyersPage(
        { ...DEFAULT_CONTACTS_FILTERS, q: "Ravi Orchid" },
        null,
        undefined,
        source,
    );
    assert.deepEqual(
        first.items.map((item) => item.id),
        ["c2"],
    );
    assert.equal(first.total, 1);
    const next = await contactsApi.listBuyersPage(
        { ...DEFAULT_CONTACTS_FILTERS, q: "+91 98765 43210" },
        null,
        undefined,
        source,
    );
    assert.equal(next.total, 2);
    assert.equal(calls, 2);
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

test("listing search joins people and checks every filtered property page before pagination", async (t) => {
    const previous = propertiesApi.list;
    t.after(() => {
        propertiesApi.list = previous;
    });
    const requests: number[] = [];
    propertiesApi.list = async (query) => {
        assert.equal(query?.search, undefined);
        assert.equal(query?.publishStatus, "published");
        requests.push(query!.page!);
        const page = query?.page ?? 1;
        const listing: PropertyListing = {
            id: `p${page}`,
            title: page === 2 ? "Orchid Heights" : "Other property",
            subtype: "apartment",
            city: "Mumbai",
            publishStatus: "published",
            status: "available",
            exclusiveOwner: { id: "o1", fullName: "Meera Shah", phone: "+919876543210" },
        };
        return { items: [listing], page, total: 2, totalPages: 2, limit: 20 };
    };
    const result = await myListingsApi.list(
        { q: "Ravi Orchid Meera", status: "published" },
        undefined,
        { attachedClients: async () => new Map([["p2", [{ id: "c1", name: "Ravi Patel" }]]]) },
    );
    assert.deepEqual(requests, [1, 2]);
    assert.deepEqual(
        result.items.map((item) => item.id),
        ["p2"],
    );
    assert.equal(result.total, 1);
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

test("cancelled client and visit scans stop before fetching another page", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    for (const kind of ["clients", "visits"] as const) {
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
        await assert.rejects(
            kind === "clients"
                ? contactsApi.buyerSearchSource(controller.signal)
                : siteVisitsApi.searchSource({ tab: "upcoming" }, controller.signal),
        );
        assert.equal(calls, 1);
    }
});
