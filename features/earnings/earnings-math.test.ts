import assert from "node:assert/strict";
import test from "node:test";

import {
    bucketUnitFor,
    buildEarningsReport,
    chartCoverageNote,
    comparisonFor,
    dealCommissionInr,
    earningsHeadline,
    earningsHeadlineLines,
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

test("comparisons line up with calendar months and the same stretch last year", () => {
    const at = (preset: Parameters<typeof resolveEarningsWindow>[0]["preset"]) => {
        const selection = { preset };
        return comparisonFor(selection, resolveEarningsWindow(selection, NOW), NOW);
    };

    const lastMonth = at("last_month");
    assert.equal(lastMonth?.phrase, "September");
    assert.equal(lastMonth?.window.from?.getMonth(), 8);
    assert.equal(lastMonth?.window.to.getDate(), 30);

    const m6 = at("last_6_months"); // 1 Jun – 17 Nov 2026
    assert.equal(m6?.phrase, "the 6 months before");
    assert.equal(m6?.window.from?.getFullYear(), 2025);
    assert.equal(m6?.window.from?.getMonth(), 11); // 1 Dec 2025
    assert.equal(m6?.window.to.getMonth(), 4); // 17 May 2026

    const fy = at("this_fy"); // 1 Apr – 17 Nov 2026
    assert.equal(fy?.window.from?.getFullYear(), 2025);
    assert.equal(fy?.window.from?.getMonth(), 3);
    assert.equal(fy?.window.to.getFullYear(), 2025);
    assert.equal(fy?.window.to.getMonth(), 10);

    assert.equal(at("all_time"), null);
});

test("headline says what the period means", () => {
    const deals = [deal({}), deal({ resolvedAt: new Date(2026, 9, 5).toISOString() })];
    const report = buildEarningsReport(deals, { preset: "last_month" }, (k) => k, NOW);
    // Last month is October: 1 deal; nothing in September.
    assert.equal(earningsHeadline(report), "1 deal sold.");

    const twoMonths = buildEarningsReport(
        [...deals, deal({ resolvedAt: new Date(2026, 8, 5).toISOString() })],
        { preset: "last_month" },
        (k) => k,
        NOW,
    );
    assert.equal(earningsHeadline(twoMonths), "Same as September.");
});

test("bucket grain scales with range length; long spans use years not weeks", () => {
    assert.equal(
        bucketUnitFor({ from: new Date(2026, 10, 1), to: new Date(2026, 10, 17) }),
        "week",
    );
    assert.equal(
        bucketUnitFor({ from: new Date(2026, 5, 1), to: new Date(2026, 10, 17) }),
        "month",
    );
    assert.equal(
        bucketUnitFor({ from: new Date(2020, 0, 1), to: new Date(2026, 10, 17) }),
        "quarter",
    );
    assert.equal(bucketUnitFor({ from: new Date(2010, 9, 10), to: new Date(2026, 9, 10) }), "year");
});

test("long custom ranges chart by year without trimming a 16-year window", () => {
    const deals = [
        deal({ resolvedAt: new Date(2010, 10, 5).toISOString() }),
        deal({ resolvedAt: new Date(2026, 10, 5).toISOString() }),
    ];
    const report = buildEarningsReport(
        deals,
        {
            preset: "custom",
            customFrom: new Date(2010, 9, 10),
            customTo: new Date(2026, 9, 10),
        },
        (k) => k,
        NOW,
    );

    assert.equal(report.bucketUnit, "year");
    assert.equal(report.chartTrimmed, false);
    assert.equal(chartCoverageNote(report), null);
    assert.ok(report.buckets.length <= 36);
    assert.ok(report.buckets.length >= 16);
});

test("rotating headline lines follow sold count, rupees, and the date filter", () => {
    const deals = [deal({}), deal({ resolvedAt: new Date(2026, 9, 5).toISOString() })];
    const october = buildEarningsReport(deals, { preset: "last_month" }, (k) => k, NOW);
    const octoberLines = earningsHeadlineLines(october);

    assert.ok(octoberLines.includes("1 deal sold."));
    assert.ok(octoberLines.some((line) => /estimated this period\.$/.test(line)));
    assert.ok(octoberLines.some((line) => line.startsWith("Win rate ")));

    const emptyPeriod = buildEarningsReport([], { preset: "this_month" }, (k) => k, NOW);
    const emptyLines = earningsHeadlineLines(emptyPeriod);
    assert.ok(emptyLines.includes("Nothing sold in this period yet."));
    assert.ok(emptyLines.includes("No commission earned in this period yet."));
});
