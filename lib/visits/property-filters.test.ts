import assert from "node:assert/strict";
import test from "node:test";

import { matchesVisitProperty } from "@/lib/visits/property-filters";

import type { VisitPropertySummary } from "@/features/site-visits/broker/model";

const property: VisitPropertySummary = {
    id: "property-1",
    title: "Apartment",
    configLabel: "2 BHK",
    propertyType: "Residential",
    locality: "Vesu",
    city: "Surat",
    address: "Vesu, Surat",
    areaSqft: 1200,
    amountInr: 7500000,
    purpose: "sale",
    commissionPercent: 2,
    filterFacts: { subtype: "apartment", bathrooms: 2 },
};

test("visit filters match property facts, location, budget and BHK", () => {
    assert.equal(
        matchesVisitProperty(property, {
            where: "Vesu",
            type: "sale",
            min: "7000000",
            max: "8000000",
            propertyType: "apartment",
            bhk: ["2"],
            bathrooms: ["2"],
        }),
        true,
    );
    assert.equal(matchesVisitProperty(property, { max: "5000000" }), false);
    assert.equal(matchesVisitProperty(property, { type: "rent" }), false);
    assert.equal(matchesVisitProperty(property, { bhk: ["3"] }), false);
    assert.equal(matchesVisitProperty(property, { furnishing: "furnished" }), false);
    assert.equal(matchesVisitProperty(property), true);
});

test("rent budgets and commission use rent facts", () => {
    const rent = {
        ...property,
        purpose: "rent" as const,
        amountInr: 20000,
        commissionAmountInr: 10000,
    };
    assert.equal(
        matchesVisitProperty(rent, { type: "rent", max: "25000", minCommissionAmount: "10000" }),
        true,
    );
    assert.equal(matchesVisitProperty(rent, { maxAreaSqft: "1000" }), false);
});
