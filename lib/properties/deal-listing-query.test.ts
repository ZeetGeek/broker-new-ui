import assert from "node:assert/strict";
import { test } from "node:test";

import { appendDealListingQuery, dealListingApiQuery } from "@/lib/properties/deal-listing-query";
import {
    EMPTY_PROPERTY_CRITERIA,
    matchesPropertyCriteria,
    normalizePropertyCriteria,
    PLOT_SUBTYPES,
    type PropertyListCriteria,
} from "@/lib/properties/list-criteria";

import { PROPERTY_CATEGORY_OPTIONS, PROPERTY_TYPES } from "@/constants/property";

function queryFor(criteria: Partial<PropertyListCriteria>) {
    const normalized = normalizePropertyCriteria({ ...EMPTY_PROPERTY_CRITERIA, ...criteria });
    const params = new URLSearchParams();
    appendDealListingQuery(
        params,
        dealListingApiQuery({ type: normalized.type, propertyFilters: normalized }),
    );
    return params;
}

test("every category + type pair in the sheet reaches the API as that exact type", () => {
    for (const { value: category } of PROPERTY_CATEGORY_OPTIONS) {
        for (const type of PROPERTY_TYPES[category]) {
            const params = queryFor({ category, propertyType: type });
            assert.equal(params.get("propertyType"), category, `${category}/${type}`);
            assert.equal(params.get("subtype"), type, `${category}/${type}`);
        }
    }
});

test("Land + Farm land sends farm_land, which the API matches even when stored as agricultural", () => {
    const params = queryFor({ category: "land", propertyType: "farm_land" });
    assert.equal(params.get("subtype"), "farm_land");
});

test("category alone sends only the category", () => {
    const params = queryFor({ category: "agricultural" });
    assert.equal(params.get("propertyType"), "agricultural");
    assert.equal(params.get("subtype"), null);
    assert.deepEqual(params.getAll("subtypes"), []);
});

test("a type outside the chosen category is dropped, not sent", () => {
    const params = queryFor({ category: "agricultural", propertyType: "apartment" });
    assert.equal(params.get("subtype"), null);
    assert.equal(params.get("propertyType"), "agricultural");
});

test("Plot with no category means every plot type", () => {
    assert.equal(normalizePropertyCriteria({ propertyType: "plot" }).propertyType, "plot");
    assert.deepEqual(queryFor({ propertyType: "plot" }).getAll("subtypes"), [...PLOT_SUBTYPES]);
    for (const subtype of PLOT_SUBTYPES) {
        assert.equal(matchesPropertyCriteria({ subtype }, { propertyType: "plot" }), true);
    }
    assert.equal(
        matchesPropertyCriteria({ subtype: "farm_land" }, { propertyType: "plot" }),
        false,
    );
});

test("choosing a category clears the Plot group instead of picking one plot type", () => {
    assert.equal(
        normalizePropertyCriteria({ category: "land", propertyType: "plot" }).propertyType,
        "",
    );
});

test("no filters sends no params", () => {
    assert.equal(queryFor({}).toString(), "");
});
