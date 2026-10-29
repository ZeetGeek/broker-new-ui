import assert from "node:assert/strict";
import test from "node:test";

import {
    buildOwnerListingsSummaryLines,
    type OwnerListingsSummaryInput,
} from "@/features/properties/owner-listings/build-owner-listings-summary-lines";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";

const base: OwnerListingsSummaryInput = {
    totalCount: 21,
    newThisWeekCount: 4,
    serviceAreas: ["Vesu"],
    filters: { ...DEFAULT_OWNER_LISTINGS_FILTERS, yourAreas: false },
    poolSummary: {
        slotsOpenCount: 0,
        newTodayCount: 0,
        commissionSetCount: 8,
        readyToMoveCount: 3,
    },
    isLoading: false,
    hasActiveFilters: false,
};

test("qualifies partial new-property counts and suppresses incomplete feature totals", () => {
    const lines = buildOwnerListingsSummaryLines({ ...base, hasMoreResults: true });
    assert.equal(lines[0], "At least 4 new properties in your areas this week");
    assert.ok(
        !lines.some((line) => line.includes("3 properties") || line.includes("8 properties")),
    );
    assert.ok(
        lines.some(
            (line) => line.includes("owner approves") && line.includes("Requests & Invitations"),
        ),
    );
});

test("shows complete result statistics and uses the selected transaction type", () => {
    const lines = buildOwnerListingsSummaryLines({
        ...base,
        filters: { ...base.filters, type: "rent" },
        hasActiveFilters: true,
    });
    assert.equal(lines[0], "4 new matches in your areas this week");
    assert.ok(lines.includes("3 properties are ready to move in"));
    assert.ok(lines.includes("Owners have added commission details for 8 properties"));
    assert.ok(lines.includes("Send the owner a request to rent out their property"));
});

test("empty and loading states do not rotate through misleading inventory claims", () => {
    assert.deepEqual(buildOwnerListingsSummaryLines({ ...base, isLoading: true }), [
        "Loading properties from owners…",
    ]);
    assert.deepEqual(
        buildOwnerListingsSummaryLines({ ...base, totalCount: 0, hasActiveFilters: true }),
        ["No properties match. Try changing your filters"],
    );
});

test("handles a single matching property without claiming it is in an unknown service area", () => {
    const lines = buildOwnerListingsSummaryLines({
        ...base,
        totalCount: 1,
        newThisWeekCount: 1,
        serviceAreas: [],
        hasActiveFilters: true,
    });
    assert.equal(lines[0], "1 property from owners matches your filters");
    assert.ok(!lines.some((line) => line.includes("this week")));
});
