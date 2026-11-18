import assert from "node:assert/strict";
import test from "node:test";

import type { PropertyAnalytics, PropertyAnalyticsLead } from "@/lib/api/property-analytics";

import {
    buildPropertyReport,
    closedWordFor,
    leadSide,
    listingAsk,
} from "@/features/properties/property-analytics/analytics-math";

const NOW = new Date("2026-11-18T12:00:00+05:30");

function lead(overrides: Partial<PropertyAnalyticsLead> & { id: string }): PropertyAnalyticsLead {
    return {
        stage: "new",
        buyerName: `Client ${overrides.id}`,
        buyerPhone: "9876543210",
        buyerEmail: null,
        clientId: `client-${overrides.id}`,
        offerAmount: null,
        offerStatus: null,
        listPrice: null,
        closedAmount: null,
        notes: null,
        createdAt: "2026-11-01T10:00:00+05:30",
        updatedAt: "2026-11-17T10:00:00+05:30",
        showings: 0,
        latestShowing: null,
        ...overrides,
    };
}

function analytics(
    leads: PropertyAnalyticsLead[],
    property: Partial<PropertyAnalytics["property"]> = {},
): PropertyAnalytics {
    return {
        property: {
            id: "p1",
            title: "Sunrise Heights 2 BHK",
            city: "Pune",
            address: "Hinjewadi",
            status: "available",
            publishStatus: "published",
            transactionType: "sale",
            salePrice: "8900000",
            monthlyRent: null,
            photo: null,
            createdAt: "2026-10-26T12:00:00+05:30",
            soldAt: null,
            ...property,
        },
        summary: {
            totalLeads: leads.length,
            openLeads: 0,
            closedWon: 0,
            closedLost: 0,
            pendingOffers: 0,
            acceptedOffers: 0,
            rejectedOffers: 0,
            showings: 0,
            closedWonAmount: null,
        },
        byStage: {
            new: 0,
            contacted: 0,
            site_visit: 0,
            negotiation: 0,
            offer_made: 0,
            closed_won: 0,
            closed_lost: 0,
        },
        leads,
    };
}

test("closed word follows what the listing is for", () => {
    assert.equal(closedWordFor({ saleInr: 1, rentInr: null }), "Sold");
    assert.equal(closedWordFor({ saleInr: null, rentInr: 1 }), "Rented");
    assert.equal(closedWordFor({ saleInr: 1, rentInr: 1 }), "Closed");
});

test("a sale-only listing ignores a stray monthly rent", () => {
    const ask = listingAsk(analytics([], { monthlyRent: "25000" }).property);
    assert.deepEqual(ask, { saleInr: 8_900_000, rentInr: null });
});

test("on a listing for both, the deal amount decides buy or rent", () => {
    const ask = { saleInr: 8_900_000, rentInr: 25_000 };
    assert.equal(leadSide(lead({ id: "a", offerAmount: "24000" }), ask), "rent");
    assert.equal(leadSide(lead({ id: "b", offerAmount: "8200000" }), ask), "sale");
    assert.equal(leadSide(lead({ id: "c" }), ask), "sale");
});

test("offers compare against the asking price, best first", () => {
    const report = buildPropertyReport(
        analytics([
            lead({ id: "a", stage: "offer_made", offerAmount: "8200000", offerStatus: "pending" }),
            lead({ id: "b", stage: "offer_made", offerAmount: "8600000", offerStatus: "rejected" }),
            lead({ id: "c", stage: "contacted" }),
        ]),
        NOW,
    );
    assert.deepEqual(
        report.offers.rows.map((c) => c.id),
        ["b", "a"],
    );
    assert.equal(report.offers.rows[1].offer?.gapInr, -700_000);
    // A declined offer is not the best one still standing.
    assert.equal(report.offers.best?.id, "a");
    assert.equal(report.offers.pending, 1);
    assert.equal(report.offers.rejected, 1);
});

test("funnel counts how far clients got, even when later lost", () => {
    const report = buildPropertyReport(
        analytics([
            lead({ id: "a", stage: "new" }),
            lead({ id: "b", stage: "site_visit" }),
            lead({ id: "c", stage: "closed_lost", showings: 1 }),
            lead({ id: "d", stage: "closed_lost", offerAmount: "8000000" }),
            lead({ id: "e", stage: "closed_won", closedAmount: "8700000" }),
        ]),
        NOW,
    );
    assert.deepEqual(
        report.funnel.map((step) => step.count),
        [5, 4, 2, 1],
    );
    assert.deepEqual(report.counts, { total: 5, active: 2, won: 1, lost: 2 });
    assert.equal(report.closedInr, 8_700_000);
});

test("attention picks one reason per client, most pressing first", () => {
    const report = buildPropertyReport(
        analytics([
            lead({ id: "quiet", stage: "contacted", updatedAt: "2026-10-20T10:00:00+05:30" }),
            lead({ id: "new", stage: "new" }),
            lead({
                id: "visit",
                stage: "site_visit",
                showings: 1,
                latestShowing: { status: "confirmed", scheduledDate: "2026-11-19T11:00:00+05:30" },
            }),
            lead({
                id: "offer",
                stage: "offer_made",
                offerAmount: "8500000",
                offerStatus: "pending",
                latestShowing: { status: "confirmed", scheduledDate: "2026-11-20T11:00:00+05:30" },
            }),
            lead({
                id: "stale-visit",
                stage: "site_visit",
                showings: 1,
                latestShowing: { status: "scheduled", scheduledDate: "2026-11-10T11:00:00+05:30" },
            }),
            lead({ id: "fine", stage: "negotiation" }),
            lead({ id: "lost", stage: "closed_lost", updatedAt: "2026-09-01T10:00:00+05:30" }),
        ]),
        NOW,
    );
    assert.deepEqual(
        report.attention.map((item) => `${item.kind}:${item.client.id}`),
        [
            "offer:offer",
            "visit_soon:visit",
            "visit_update:stale-visit",
            "not_contacted:new",
            "quiet:quiet",
        ],
    );
    assert.equal(report.visits.upcoming, 2);
    assert.equal(report.visits.nextAt?.toISOString(), "2026-11-19T05:30:00.000Z");
});

test("days listed stop counting once sold", () => {
    const report = buildPropertyReport(
        analytics([], {
            createdAt: "2026-10-01T12:00:00+05:30",
            soldAt: "2026-10-31T12:00:00+05:30",
        }),
        NOW,
    );
    assert.equal(report.daysListed, 30);
    assert.equal(report.lastUpdateAt, null);
});
