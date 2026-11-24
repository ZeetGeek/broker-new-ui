import assert from "node:assert/strict";
import test from "node:test";

import { EMPTY_PROPERTY_CRITERIA } from "@/lib/properties/list-criteria";

import { ApiError } from "./client";
import { myListingsApi } from "./my-listings";
import { propertiesApi, type PropertyListing } from "./properties";

test("pins from later API pages reach page one, respect filters, and paginate without duplicates", async (t) => {
    const previous = propertiesApi.list;
    const previousGet = propertiesApi.get;
    t.after(() => {
        propertiesApi.list = previous;
        propertiesApi.get = previousGet;
    });
    const inventory: PropertyListing[] = Array.from({ length: 25 }, (_, index) => ({
        id: `property-${index}`,
        propertyType: "residential",
        subtype: "apartment",
        title: `Property ${index}`,
        city: index === 24 ? "Surat" : "Mumbai",
        status: "available",
        publishStatus: "published",
        createdAt: new Date(Date.UTC(2026, 0, 31 - index)).toISOString(),
        salePrice: (index + 1) * 100_000,
    }));
    const requestedPages: number[] = [];
    const requestedPins: string[] = [];
    propertiesApi.get = async (id) => {
        requestedPins.push(id);
        const item = inventory.find((item) => item.id === id);
        if (!item) throw new ApiError("Property not found", 404);
        return item;
    };
    propertiesApi.list = async (query) => {
        const page = query?.page ?? 1;
        requestedPages.push(page);
        return {
            items: inventory.slice((page - 1) * 20, page * 20),
            total: inventory.length,
            page,
            totalPages: 2,
            limit: 20,
        };
    };
    const options = { withAttachedClients: false, pinnedIds: ["property-24", "property-22"] };
    const first = await myListingsApi.list({}, undefined, options);
    assert.deepEqual(requestedPages, [1]);
    assert.deepEqual(requestedPins, ["property-24", "property-22"]);
    assert.deepEqual(
        first.items.slice(0, 2).map((item) => item.id),
        ["property-22", "property-24"],
    );
    assert.equal(first.items.length, 22);
    assert.equal(first.total, 25);
    const second = await myListingsApi.list({ page: 2 }, undefined, options);
    assert.deepEqual(
        second.items.map((item) => item.id),
        ["property-20", "property-21", "property-23"],
    );
    assert.equal(new Set([...first.items, ...second.items].map((item) => item.id)).size, 25);
    const filtered = await myListingsApi.list(
        { propertyFilters: { ...EMPTY_PROPERTY_CRITERIA, where: "Mumbai" } },
        undefined,
        options,
    );
    assert.equal(filtered.items[0].id, "property-22");
    assert.equal(filtered.total, 24);
    assert.ok(!filtered.items.some((item) => item.id === "property-24"));
    requestedPages.length = 0;
    const unpinned = await myListingsApi.list({}, undefined, { withAttachedClients: false });
    assert.equal(unpinned.items[0].id, "property-0");
    assert.deepEqual(requestedPages, [1]);
    requestedPages.length = 0;
    const stalePin = await myListingsApi.list({}, undefined, {
        withAttachedClients: false,
        pinnedIds: ["removed-property"],
    });
    assert.deepEqual(requestedPages, [1], "a stale pin must not scan later inventory pages");
    assert.equal(stalePin.items.length, 20);
    assert.equal(stalePin.pinsUnavailable, false);

    propertiesApi.get = async () => {
        throw new Error("Pin details unavailable");
    };
    const unavailable = await myListingsApi.list({}, undefined, options);
    assert.equal(unavailable.items[0].id, "property-0");
    assert.equal(unavailable.pinsUnavailable, true);
});

test("client enrichment failures preserve inventory but never fabricate client-filter results", async (t) => {
    const previous = propertiesApi.list;
    t.after(() => {
        propertiesApi.list = previous;
    });
    propertiesApi.list = async () => ({
        items: [{ id: "property", publishStatus: "published" }],
        total: 1,
        page: 1,
        totalPages: 1,
        limit: 20,
    });
    const attachedClients = async () => {
        throw new Error("Client details unavailable");
    };
    const result = await myListingsApi.list({}, undefined, { attachedClients });
    assert.equal(result.items[0].id, "property");
    assert.equal(result.total, 1);
    assert.equal(result.clientsUnavailable, true);
    await assert.rejects(
        myListingsApi.list({ clientId: "client-1" }, undefined, { attachedClients }),
        /Client details unavailable/,
    );
});
