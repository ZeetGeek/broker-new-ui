import assert from "node:assert/strict";
import { test } from "node:test";

import {
    buildPropertyFacts,
    propertyDetailFieldVisible,
} from "../../features/properties/property-detail/property-detail-facts";
import { mapPropertyListingToMyItem } from "../../features/properties/your-listings/map-my-listing";
import { MOCK_MY_LISTINGS_SEED } from "../../features/properties/your-listings/mock-my-listings";

const base = MOCK_MY_LISTINGS_SEED[0];

test("plot details omit stale apartment facts", () => {
    const listing = {
        ...base,
        category: "land" as const,
        propertyType: "plot" as const,
        subtype: "residential_plot",
        bhk: 3,
        bathrooms: 2,
        balconies: 1,
        floorNumber: 4,
        parking: "1" as const,
    };
    const keys = buildPropertyFacts(listing).map((fact) => fact.key);
    for (const key of ["bhk", "bathrooms", "balconies", "floor", "parking", "furnishing"])
        assert.ok(!keys.includes(key), key);
    assert.ok(keys.includes("area"));
});

test("office facts follow form rules without residential configuration", () => {
    const listing = {
        ...base,
        category: "commercial" as const,
        propertyType: "office" as const,
        subtype: "office_space",
        bhk: 3,
        cabins: 2,
        workstations: 12,
    };
    const facts = buildPropertyFacts(listing);
    assert.ok(!facts.some((fact) => fact.key === "bhk"));
    assert.equal(facts.find((fact) => fact.key === "cabins")?.value, "2");
    assert.equal(facts.find((fact) => fact.key === "workstations")?.value, "12");
});

test("independent homes hide floor number and agricultural listings hide nearby places", () => {
    const home = {
        ...base,
        category: "residential" as const,
        propertyType: "villa" as const,
        subtype: "villa",
        floorNumber: 3,
    };
    assert.ok(!buildPropertyFacts(home).some((fact) => fact.key === "floor"));
    const land = {
        ...base,
        category: "agricultural" as const,
        propertyType: "agricultural" as const,
        subtype: "agricultural_land",
    };
    assert.equal(propertyDetailFieldVisible(land, "location.nearbyPlaces"), false);
});

test("API mapping retains exact parking and hides facts the API did not supply", () => {
    const listing = mapPropertyListingToMyItem({
        id: "api-property",
        subtype: "apartment",
        parkingSpaces: 7,
        visibility: "private",
    });
    const facts = buildPropertyFacts(listing);
    assert.equal(facts.find((fact) => fact.key === "parking")?.value, "7");
    assert.ok(!facts.some((fact) => fact.key === "furnishing"));
    assert.equal(listing.visibility, "private");
    assert.equal(listing.city, "");
    const missing = mapPropertyListingToMyItem({ id: "missing-property", subtype: "apartment" });
    assert.ok(!buildPropertyFacts(missing).some((fact) => fact.key === "parking"));
});

test("rental deposit preserves amount versus months and stale sale terms are hidden", () => {
    const rental = {
        ...base,
        transactionType: "rent" as const,
        securityDeposit: 2,
        securityDepositMode: "months_of_rent" as const,
    };
    assert.equal(
        buildPropertyFacts(rental).find((fact) => fact.key === "securityDeposit")?.value,
        "2 months of rent",
    );
    const sale = { ...rental, transactionType: "sale" as const, availableFrom: "2026-11-01" };
    assert.ok(
        !buildPropertyFacts(sale).some((fact) =>
            ["securityDeposit", "available"].includes(fact.key),
        ),
    );
});

test("availability dates from the API format consistently and invalid dates stay hidden", () => {
    const rental = { ...base, transactionType: "rent" as const };
    const dateOnly = buildPropertyFacts({ ...rental, availableFrom: "2026-11-01" }).find(
        (fact) => fact.key === "available",
    )?.value;
    const timestamp = buildPropertyFacts({
        ...rental,
        availableFrom: "2026-11-01T00:00:00.000Z",
    }).find((fact) => fact.key === "available")?.value;
    assert.equal(dateOnly, "01/11/2026");
    assert.equal(timestamp, dateOnly);
    assert.ok(
        !buildPropertyFacts({ ...rental, availableFrom: "2026-02-31" }).some(
            (fact) => fact.key === "available",
        ),
    );
});

test("independent home total floors are displayed when provided", () => {
    const listing = {
        ...base,
        category: "residential" as const,
        propertyType: "villa" as const,
        subtype: "villa",
        totalFloors: 2,
    };
    assert.equal(
        buildPropertyFacts(listing).find((fact) => fact.key === "totalFloors")?.value,
        "2",
    );
});

test("detail mapping keeps optional API location and property facts without inventing values", () => {
    const listing = mapPropertyListingToMyItem({
        id: "complete-property",
        propertyType: "residential",
        subtype: "apartment",
        state: "Gujarat",
        country: "India",
        projectOrSociety: "Riverstone Residency",
        unitNumber: "B-804",
        streetOrRoad: "Canal Road",
        carpetArea: 940,
        areaSqft: 1100,
        propertyAge: 5,
        propertyCondition: "ready_to_move",
    });
    const facts = buildPropertyFacts(listing);

    assert.equal(listing.state, "Gujarat");
    assert.equal(listing.society, "Riverstone Residency");
    assert.equal(listing.unitNumber, "B-804");
    assert.equal(listing.streetOrRoad, "Canal Road");
    assert.equal(facts.find((fact) => fact.key === "category")?.value, "Residential");
    assert.equal(facts.find((fact) => fact.key === "carpetArea")?.value, "940 sq ft");
    assert.equal(facts.find((fact) => fact.key === "propertyAge")?.value, "5 years old");
    assert.equal(facts.find((fact) => fact.key === "condition")?.value, "Ready to move");

    const underConstruction = {
        ...listing,
        propertyAge: 5,
        propertyCondition: "under_construction",
    };
    assert.ok(!buildPropertyFacts(underConstruction).some((fact) => fact.key === "propertyAge"));

    const missing = mapPropertyListingToMyItem({ id: "sparse-property", subtype: "apartment" });
    assert.equal(missing.state, null);
    assert.equal(missing.carpetAreaSqft, null);
    assert.ok(!buildPropertyFacts(missing).some((fact) => fact.key === "propertyAge"));

    const noCategory = mapPropertyListingToMyItem({ id: "no-category" });
    assert.ok(!buildPropertyFacts(noCategory).some((fact) => fact.key === "category"));
});
