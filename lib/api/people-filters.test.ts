import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { myListingsApi } from "@/lib/api/my-listings";
import { pipelineApi } from "@/lib/api/pipeline";
import { collectPeopleFilterOptions } from "@/lib/properties/people-filters";

import { DEFAULT_DEALS_FILTERS, hasActiveDealsFilters } from "@/features/pipeline/types";
import {
    hasActiveMyListingsFilters,
    normalizeMyListingsStoredFilters,
    parseMyListingsFilters,
    serializeMyListingsFilters,
} from "@/features/properties/your-listings/filter-my-listings";

const property = (id: string, ownerId: string) => ({
    id,
    title: id,
    publishStatus: "published",
    transactionType: "sale",
    salePrice: "1000000",
    exclusiveOwnerId: ownerId,
    exclusiveOwner: { id: ownerId, fullName: "Same owner name" },
});

test("listing people filters search every API page and combine owner and client IDs", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const pages = [
        [property("unrelated", "other-owner")],
        [property("match", "owner-1"), property("owner-only", "owner-1")],
        [property("same-name", "owner-2")],
    ];
    const requested: number[] = [];
    api.defaults.adapter = async (config) => {
        const q = new URL(config.url!, "https://qa.local").searchParams;
        assert.equal(q.has("ownerId"), false, "no unsupported backend filter is sent");
        assert.equal(q.has("clientId"), false);
        const page = Number(q.get("page") ?? 1);
        requested.push(page);
        return {
            data: { items: pages[page - 1], total: 4, page, totalPages: 3 },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    const attachedClients = async () =>
        new Map([
            ["match", [{ id: "client-1", name: "Client one", stage: "new" }]],
            ["owner-only", [{ id: "client-2", name: "Client two", stage: "contacted" }]],
            ["same-name", [{ id: "client-1", name: "Client one", stage: "negotiation" }]],
        ]);
    const both = await myListingsApi.list({ ownerId: "owner-1", clientId: "client-1" }, undefined, {
        attachedClients,
    });
    assert.deepEqual(requested, [1, 2, 3]);
    assert.deepEqual(
        both.items.map((item) => item.id),
        ["match"],
    );
    assert.equal(both.total, 1);
    assert.equal(both.totalPages, 1);
    assert.equal(both.items[0].attachedClients?.[0].stage, "new");
    const owner = await myListingsApi.list({ ownerId: "owner-1" }, undefined, { attachedClients });
    assert.deepEqual(
        owner.items.map((item) => item.id),
        ["match", "owner-only"],
    );
    const client = await myListingsApi.list({ clientId: "client-1" }, undefined, {
        attachedClients,
    });
    assert.deepEqual(
        client.items.map((item) => item.id),
        ["match", "same-name"],
    );
    const empty = await myListingsApi.list({ ownerId: "missing" }, undefined, { attachedClients });
    assert.equal(empty.total, 0);
});

test("listing pagination and totals are computed after people filtering", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const items = Array.from({ length: 25 }, (_, i) => property(`match-${i}`, "owner-1"));
    api.defaults.adapter = async (config) => {
        const page = Number(new URL(config.url!, "https://qa.local").searchParams.get("page") ?? 1);
        return {
            data: {
                items: items.slice((page - 1) * 20, page * 20),
                total: 25,
                page,
                totalPages: 2,
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    const first = await myListingsApi.list({ ownerId: "owner-1" }, undefined, {
        withAttachedClients: false,
    });
    const second = await myListingsApi.list({ ownerId: "owner-1", page: 2 }, undefined, {
        withAttachedClients: false,
    });
    assert.equal(first.total, 25);
    assert.equal(first.totalPages, 2);
    assert.equal(first.items.length, 20);
    assert.equal(second.items.length, 5);
    assert.equal(second.page, 2);
    assert.equal(second.items[0].id, "match-20");
});

const lead = (id: string, ownerId: string, clientId: string, stage: string) => ({
    id,
    propertyId: `property-${id}`,
    stage,
    property: { ...property(`property-${id}`, ownerId), city: "Surat", address: "Adajan" },
    exclusiveOwner: { id: ownerId, fullName: "Same owner name" },
    client: { id: clientId, name: clientId },
});

test("pipeline filters people across all lead pages and recalculates stage counts", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const pages = [
        [lead("one", "owner-1", "client-1", "new")],
        [
            lead("two", "owner-2", "client-1", "contacted"),
            lead("three", "owner-1", "client-2", "negotiation"),
        ],
    ];
    api.defaults.adapter = async (config) => {
        const page = Number(new URL(config.url!, "https://qa.local").searchParams.get("page") ?? 1);
        return {
            data: { items: pages[page - 1], totalPages: 2 },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    const both = await pipelineApi.list({
        ...DEFAULT_DEALS_FILTERS,
        ownerId: "owner-1",
        clientId: "client-1",
    });
    assert.deepEqual(
        both.items.map((item) => item.id),
        ["one"],
    );
    assert.equal(both.summary.liveTotal, 1);
    assert.equal(both.summary.counts.new, 1);
    assert.equal(both.summary.counts.contacted, 0);
    const owner = await pipelineApi.list({ ...DEFAULT_DEALS_FILTERS, ownerId: "owner-1" });
    assert.equal(owner.items.length, 2);
    const client = await pipelineApi.list({ ...DEFAULT_DEALS_FILTERS, clientId: "client-1" });
    assert.equal(client.items.length, 2);
    const options = await pipelineApi.peopleOptions();
    assert.deepEqual(options.owners.map((item) => item.id).sort(), ["owner-1", "owner-2"]);
    assert.deepEqual(options.clients.map((item) => item.id).sort(), ["client-1", "client-2"]);
});

test("people filters survive listing URLs and old saved preferences remain compatible", () => {
    const filters = parseMyListingsFilters({
        ownerId: "owner-1",
        clientId: "client-1",
        status: "sold",
    });
    assert.equal(hasActiveMyListingsFilters(filters), true);
    const stored = normalizeMyListingsStoredFilters(filters);
    const restored = parseMyListingsFilters(Object.fromEntries(serializeMyListingsFilters(stored)));
    assert.equal(restored.ownerId, "owner-1");
    assert.equal(restored.clientId, "client-1");
    assert.equal(restored.status, "sold");
    const cleared = serializeMyListingsFilters({ ...restored, ownerId: "", clientId: "" });
    assert.equal(cleared.has("ownerId"), false);
    assert.equal(cleared.has("clientId"), false);
    assert.equal(hasActiveMyListingsFilters(parseMyListingsFilters({})), false);
    assert.equal(hasActiveDealsFilters({ ...DEFAULT_DEALS_FILTERS, ownerId: "owner-1" }), true);
    assert.equal(hasActiveDealsFilters({ ...DEFAULT_DEALS_FILTERS, clientId: "client-1" }), true);
});

test("people options deduplicate by ID without merging people who share names", () => {
    const row = {
        owner: { id: "owner-1", name: "Ramesh" },
        clients: [{ id: "client-1", name: "Jeet" }],
    };
    const options = collectPeopleFilterOptions([
        row,
        row,
        { owner: { id: "owner-2", name: "Ramesh" }, clients: [] },
    ]);
    assert.equal(options.owners.length, 2);
    assert.equal(options.clients.length, 1);
});

test("listing people choices include later pages and deleted properties", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    api.defaults.adapter = async (config) => {
        const url = new URL(config.url!, "https://qa.local");
        const page = Number(url.searchParams.get("page") ?? 1);
        const data =
            url.pathname === "/clients/leads"
                ? {
                      items: [
                          {
                              id: "lead",
                              propertyId: "late",
                              client: { id: "client-1", name: "Client one" },
                          },
                      ],
                      totalPages: 1,
                  }
                : url.pathname === "/properties/deleted"
                  ? { items: [property("deleted", "deleted-owner")], totalPages: 1 }
                  : {
                        items: [property(page === 1 ? "early" : "late", `owner-${page}`)],
                        totalPages: 2,
                    };
        return { data, status: 200, statusText: "OK", headers: {}, config };
    };
    const choices = await myListingsApi.peopleOptions();
    assert.deepEqual(choices.owners.map((owner) => owner.id).sort(), [
        "deleted-owner",
        "owner-1",
        "owner-2",
    ]);
    assert.deepEqual(choices.clients, [{ id: "client-1", name: "Client one", stage: null }]);
});
