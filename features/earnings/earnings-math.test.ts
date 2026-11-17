import assert from "node:assert/strict";
import test from "node:test";

import {
    buildEarningsReport,
    dealCommissionInr,
    previousWindow,
    resolveEarningsWindow,
} from "@/features/earnings/earnings-math";
import type { DealItem } from "@/features/pipeline/types";

const NOW = new Date(2026, 10, 17, 12); // 17 Nov 2026

function deal(
    overrides: Omit<Partial<DealItem>, "property"> & { property?: Partial<DealItem["property"]> },
): DealItem {
    const { property, ...rest } = overrides;
    return {
        id: Math.random().toString(36).slice(2),
        status: "closed",
        buyer: { id: "b", name: "Ravi", phoneDigits: "", budgetMaxInr: null },
        property: {
            id: "p",
            title: "2 BHK",
            configLabel: "2 BHK",
            propertyTypeLabel: "Apartment",
            locality: "Adajan",
            city: "Surat",
            areaSqft: 1000,
            bhk: 2,
            amountInr: 50_00_000,
            isRent: false,
            commissionPercent: 2,
            commissionAmountInr: 0,
            imageSrc: "",
            ...property,
        },
        owner: { name: "Owner", isRepresentationActive: true },
        stageEnteredAt: NOW.toISOString(),
        lastContactedAt: null,
        nextVisitAt: null,
        note: "",
        resolvedAt: new Date(2026, 10, 5).toISOString(),
        closedAmountInr: null,
        offerAmountInr: null,
        offerStatus: null,
        ...rest,
    };
}

test("presets resolve to calendar windows; last N months includes this month", () => {
    const m3 = resolveEarningsWindow({ preset: "last_3_months" }, NOW);
    assert.equal(m3.from?.getMonth(), 8); // 1 Sep
    assert.equal(m3.from?.getDate(), 1);

    const fy = resolveEarningsWindow({ preset: "this_fy" }, NOW);
    assert.equal(fy.from?.getFullYear(), 2026);
    assert.equal(fy.from?.getMonth(), 3); // 1 Apr

    const lastFy = resolveEarningsWindow({ preset: "last_fy" }, NOW);
    assert.equal(lastFy.from?.getFullYear(), 2025);
    assert.equal(lastFy.to.getMonth(), 2); // 31 Mar 2026

    assert.equal(resolveEarningsWindow({ preset: "all_time" }, NOW).from, null);
    assert.equal(previousWindow({ from: null, to: NOW }), null);
});

test("commission prefers final price, then accepted offer, then ask; unset is null", () => {
    assert.equal(dealCommissionInr(deal({})), 1_00_000);
    assert.equal(dealCommissionInr(deal({ closedAmountInr: 40_00_000 })), 80_000);
    assert.equal(
        dealCommissionInr(deal({ offerAmountInr: 45_00_000, offerStatus: "accepted" })),
        90_000,
    );
    assert.equal(dealCommissionInr(deal({ property: { commissionPercent: 0 } })), null);
    assert.equal(
        dealCommissionInr(
            deal({ property: { isRent: true, amountInr: 25_000, commissionAmountInr: 25_000 } }),
        ),
        25_000,
    );
});

test("report counts only deals resolved inside the window", () => {
    const deals = [
        deal({}),
        deal({ property: { isRent: true, amountInr: 20_000, commissionAmountInr: 20_000 } }),
        deal({ property: { commissionPercent: 0 } }),
        deal({ resolvedAt: new Date(2025, 0, 1).toISOString() }),
        deal({ status: "lost", lostReason: "price", lostFromStage: "negotiation" }),
        deal({ status: "negotiation", resolvedAt: null }),
    ];
    const report = buildEarningsReport(deals, { preset: "this_month" }, (k) => k, NOW);

    assert.equal(report.closedCount, 3);
    assert.equal(report.earnedInr, 1_20_000);
    assert.equal(report.saleEarnedInr, 1_00_000);
    assert.equal(report.rentEarnedInr, 20_000);
    assert.equal(report.unvaluedClosedCount, 1);
    assert.equal(report.lostCount, 1);
    assert.equal(report.winRate, 75);
    assert.deepEqual(report.lostFromStages, [{ stage: "negotiation", count: 1 }]);
    assert.equal(report.live.count, 1);
    assert.equal(report.live.likelyCount, 1);
    assert.equal(report.bucketUnit, "week");
    assert.equal(
        report.buckets.reduce((s, b) => s + b.totalInr, 0),
        report.earnedInr,
    );
});
