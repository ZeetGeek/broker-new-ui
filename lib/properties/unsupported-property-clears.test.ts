import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_PROPERTY_DRAFT } from "@/lib/schemas/property";

import { mapPropertyListingToMyItem } from "@/features/properties/your-listings/map-my-listing";

import { unsupportedPropertyClears } from "./unsupported-property-clears";

function draft() {
    const values = structuredClone(DEFAULT_PROPERTY_DRAFT);
    values.basics.category = "residential";
    values.basics.propertyType = "apartment";
    values.basics.listingFor = "sell";
    return values;
}

test("saved optional scalar fields cannot silently clear through an API that omits empties", () => {
    const previous = mapPropertyListingToMyItem({
        id: "property",
        bathrooms: 2,
        flatNo: "B-402",
        landmark: "School",
        availableFrom: "2026-12-01",
        propertyType: "residential",
        subtype: "apartment",
    });
    const current = draft();
    current.details.bathrooms = null;
    current.location.unitNumber = "";
    current.location.landmark = "";
    const issues = unsupportedPropertyClears(previous, current);
    assert.deepEqual(
        issues.map((issue) => issue.path),
        ["location.unitNumber", "location.landmark", "details.bathrooms"],
    );
    assert.equal(issues[0].step, "basics");
    assert.equal(issues[2].step, "details");
    current.location.unitNumber = "C-202";
    current.location.landmark = "New school";
    current.details.bathrooms = 0;
    assert.deepEqual(unsupportedPropertyClears(previous, current), []);
});

test("hidden form fields do not prevent category or transaction changes", () => {
    const previous = mapPropertyListingToMyItem({
        id: "property",
        bathrooms: 2,
        monthlyRent: 10000,
        availableFrom: "2026-12-01",
        transactionType: "rent",
    });
    const current = draft();
    current.basics.category = "land";
    current.basics.propertyType = "residential_plot";
    current.details.bathrooms = null;
    current.location.unitNumber = "";
    assert.deepEqual(unsupportedPropertyClears(previous, current), []);
});

test("supported URL and array clears remain allowed, and empty original fields need no guard", () => {
    const previous = mapPropertyListingToMyItem({
        id: "property",
        videoUrl: "https://example.com/video",
        amenities: ["lift"],
    });
    const current = draft();
    current.media.videoUrl = "";
    current.amenities.society = [];
    assert.deepEqual(unsupportedPropertyClears(previous, current), []);
});
