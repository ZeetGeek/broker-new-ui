import assert from "node:assert/strict";
import { test } from "node:test";

import {
    ownerListingsFilterVisibility,
    stripHiddenOwnerListingsFilters,
} from "../../features/properties/owner-listings/filter-visibility";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "../../features/properties/owner-listings/types";
import {
    collectPropertyPages,
    EMPTY_PROPERTY_CRITERIA,
    matchesPropertyCriteria,
    normalizePropertyCriteria,
    parsePropertyCriteria,
    propertyCriteriaShowBhk,
    serializePropertyCriteria,
} from "./list-criteria";

test("criteria round-trip without removing unrelated page state", () => {
    const criteria = normalizePropertyCriteria({
        where: "Vesu",
        category: "commercial",
        propertyType: "office",
        minAreaSqft: "200",
        maxAreaSqft: "800",
    });
    const params = new URLSearchParams({ tab: "accepted", sort: "oldest" });
    serializePropertyCriteria(params, criteria);
    assert.deepEqual(parsePropertyCriteria(params.get("propertyFilters")!), criteria);
    assert.equal(params.get("tab"), "accepted");
    assert.deepEqual(parsePropertyCriteria("not-json"), EMPTY_PROPERTY_CRITERIA);
});

test("category changes strip invalid subtypes and malformed ranges", () => {
    const criteria = normalizePropertyCriteria({
        category: "land",
        propertyType: "apartment",
        min: "900",
        max: "100",
        minAreaSqft: "-1",
        maxAreaSqft: "NaN",
    });
    assert.equal(criteria.propertyType, "");
    assert.equal(criteria.min, "100");
    assert.equal(criteria.max, "900");
    assert.equal(criteria.minAreaSqft, "");
    assert.equal(criteria.maxAreaSqft, "");
});

test("filter matching uses locality, subtype, area and the selected sale/rent price", () => {
    const property = {
        locality: "Vesu",
        city: "Surat",
        category: "residential",
        propertyType: "apartment",
        transactionType: "both",
        areaSqft: 1200,
        saleAmountInr: 9_000_000,
        rentAmountInr: 25_000,
    };
    assert.equal(
        matchesPropertyCriteria(property, {
            where: "vesu",
            type: "rent",
            min: "20000",
            max: "30000",
            minAreaSqft: "1000",
        }),
        true,
    );
    assert.equal(matchesPropertyCriteria(property, { type: "sale", max: "30000" }), false);
    assert.equal(matchesPropertyCriteria(property, { category: "land" }), false);
    assert.equal(
        matchesPropertyCriteria({ propertyTypeLabel: "Residential" }, { category: "residential" }),
        true,
    );
    assert.equal(
        matchesPropertyCriteria(
            { subtype: "one_rk", transactionType: "rent" },
            { propertyType: "1rk" },
        ),
        true,
    );
    assert.equal(matchesPropertyCriteria({ city: "Surat" }, { minAreaSqft: "10" }), false);
    assert.equal(
        matchesPropertyCriteria(
            { propertyTypeLabel: "Office", isRent: true, amountInr: 18000 },
            { propertyType: "office_space", type: "rent", max: "20000" },
        ),
        true,
    );
});

test("BHK visibility is derived from the Add Property rules", () => {
    assert.equal(propertyCriteriaShowBhk(), true);
    assert.equal(propertyCriteriaShowBhk({ category: "residential" }), true);
    assert.equal(propertyCriteriaShowBhk({ category: "commercial" }), false);
    assert.equal(propertyCriteriaShowBhk({ category: "land" }), false);
    assert.equal(propertyCriteriaShowBhk({ propertyType: "residential_plot" }), false);
    assert.equal(
        ownerListingsFilterVisibility({ category: "commercial", propertyType: "office" })
            .showSuitableFor,
        true,
    );
});

test("changing to plot clears hidden advanced filters", () => {
    const filters = stripHiddenOwnerListingsFilters({
        ...DEFAULT_OWNER_LISTINGS_FILTERS,
        category: "land",
        propertyType: "plot",
        bhk: ["2"],
        bathrooms: ["1"],
        furnishing: "furnished",
        propertyConditions: ["ready_to_move"],
        readyToMove: true,
        suitableFor: ["office"],
    });
    assert.deepEqual(filters.bhk, []);
    assert.deepEqual(filters.bathrooms, []);
    assert.equal(filters.furnishing, "");
    assert.deepEqual(filters.propertyConditions, []);
    assert.equal(filters.readyToMove, false);
    assert.deepEqual(filters.suitableFor, []);
});

test("My Deals condition and room filters require matching property facts", () => {
    const readyThreeBhk = {
        bhk: 3,
        bathrooms: 2,
        propertyCondition: "ready_to_move",
    };
    assert.equal(
        matchesPropertyCriteria(readyThreeBhk, {
            bhk: ["3"],
            bathrooms: ["2"],
            propertyConditions: ["ready_to_move"],
        }),
        true,
    );
    assert.equal(
        matchesPropertyCriteria(readyThreeBhk, {
            propertyConditions: ["under_construction"],
        }),
        false,
    );
    assert.equal(
        matchesPropertyCriteria({ bhk: 3 }, { propertyConditions: ["ready_to_move"] }),
        false,
    );
});

test("collection filtering sees later pages rather than filtering a partial first page", async () => {
    const calls: number[] = [];
    const rows = await collectPropertyPages(async (page) => {
        calls.push(page);
        return { items: [{ city: page === 3 ? "Surat" : "Mumbai" }], totalPages: 3 };
    });
    assert.deepEqual(calls, [1, 2, 3]);
    assert.equal(rows.filter((row) => matchesPropertyCriteria(row, { where: "Surat" })).length, 1);
});
