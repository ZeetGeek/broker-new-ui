import assert from "node:assert/strict";
import test from "node:test";

import { myListingsApi } from "@/lib/api/my-listings";
import type { PropertyListing } from "@/lib/api/properties";
import { EMPTY_PROPERTY_CRITERIA } from "@/lib/properties/list-criteria";

import { mapPropertyListingToMyItem } from "@/features/properties/your-listings/map-my-listing";

test("Listed filters use publication time and fall back to creation for unpublished listings", async () => {
    const today = new Date().toISOString();
    const fortyDaysAgo = new Date(Date.now() - 40 * 86_400_000).toISOString();
    const inventory: PropertyListing[] = [
        { id: "published-today", createdAt: fortyDaysAgo, publishedAt: today },
        { id: "published-earlier", createdAt: fortyDaysAgo, publishedAt: fortyDaysAgo },
        { id: "new-draft", createdAt: today },
        { id: "old-draft", createdAt: fortyDaysAgo },
    ];

    for (const days of ["7", "30"]) {
        const result = await myListingsApi.list(
            { propertyFilters: { ...EMPTY_PROPERTY_CRITERIA, listedWithinDays: days } },
            undefined,
            { withAttachedClients: false, propertyCollection: async () => inventory },
        );
        assert.deepEqual(
            result.items.map((item) => item.id),
            ["published-today", "new-draft"],
        );
        assert.equal(result.total, 2);
        assert.equal(result.items[0].publishedAt, today);
        assert.equal(result.items[0].listedDaysAgo, 0);
    }
});

test("Unfurnished filters exclude missing and unrecognized furnishing information", async () => {
    const inventory: PropertyListing[] = [
        { id: "missing" },
        { id: "null", furnishingStatus: null },
        { id: "empty", furnishingStatus: "" },
        { id: "unknown", furnishingStatus: "not-recorded" },
        { id: "unfurnished", furnishingStatus: "unfurnished" },
        { id: "semi", furnishingStatus: "semi" },
        { id: "furnished", furnishingStatus: "furnished" },
    ];
    const options = { withAttachedClients: false, propertyCollection: async () => inventory };
    for (const furnishing of ["unfurnished", "semi", "furnished"] as const) {
        const result = await myListingsApi.list(
            { status: "draft", propertyFilters: { ...EMPTY_PROPERTY_CRITERIA, furnishing } },
            undefined,
            options,
        );
        assert.deepEqual(
            result.items.map((item) => item.id),
            [furnishing],
        );
        assert.equal(result.total, 1);
    }
    for (const listing of inventory.slice(0, 4)) {
        const mapped = mapPropertyListingToMyItem(listing);
        assert.equal(mapped.furnishing, "");
        assert.equal(mapped.furnishingLabel, "");
    }
});
