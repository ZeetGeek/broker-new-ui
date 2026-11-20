import { keepPreviousData } from "@tanstack/react-query";
import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import {
    earningsApi,
    type EarningsReportApi,
    earningsReportQueryOptions,
    mapEarningsReport,
} from "@/lib/api/earnings";

import { USE_MOCK_DATA } from "@/config";
import { comparisonFor, resolveEarningsWindow } from "@/features/earnings/earnings-math";

const NOW = new Date(2026, 10, 17, 12); // 17 Nov 2026

function stubReport(t: test.TestContext, body: EarningsReportApi): URL[] {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const urls: URL[] = [];
    api.defaults.adapter = async (config) => {
        urls.push(new URL(String(config.url), "http://api.test"));
        return { data: body, status: 200, statusText: "OK", headers: {}, config };
    };
    return urls;
}

const deal = (
    id: string,
    extra: Partial<EarningsReportApi["recentClosed"][number]> = {},
): EarningsReportApi["recentClosed"][number] => ({
    id,
    status: "closed",
    resolvedAt: "2026-11-05T06:00:00.000Z",
    buyerName: "Ravi",
    property: {
        title: "2 BHK in Adajan",
        isRent: false,
        amountInr: 72_00_000,
        commissionPercent: 2,
        commissionAmountInr: null,
    },
    commissionInr: 1_44_000,
    daysToClose: 9,
    ...extra,
});

function rawReport(overrides: Partial<EarningsReportApi> = {}): EarningsReportApi {
    return {
        hasResolvedDeals: true,
        window: { from: "2026-10-31T18:30:00.000Z", to: "2026-11-17T18:29:59.999Z" },
        chartWindow: { from: "2026-10-31T18:30:00.000Z", to: "2026-11-17T18:29:59.999Z" },
        chartTrimmed: false,
        bucketUnit: "month",
        earnedInr: 1_44_000,
        saleEarnedInr: 1_44_000,
        rentEarnedInr: 0,
        previousEarnedInr: 50_000,
        closedCount: 1,
        saleClosedCount: 1,
        rentClosedCount: 0,
        previousClosedCount: 1,
        lostCount: 3,
        previousLostCount: 0,
        winRate: 25,
        unvaluedClosedCount: 0,
        avgDaysToClose: 9,
        bestDeal: deal("d1"),
        buckets: [
            {
                start: "2025-12-31T18:30:00.000Z",
                saleInr: 0,
                rentInr: 0,
                totalInr: 0,
                closed: 0,
                lost: 0,
                lostInr: 0,
                lostReasonCounts: {},
                isToDate: false,
            },
            {
                start: "2026-10-31T18:30:00.000Z",
                saleInr: 1_44_000,
                rentInr: 0,
                totalInr: 1_44_000,
                closed: 1,
                lost: 3,
                lostInr: 60_000,
                lostReasonCounts: { price: 1, other: 2 },
                isToDate: true,
            },
        ],
        lostReasonCounts: {
            price: 1,
            bought_elsewhere: 0,
            not_responding: 0,
            changed_mind: 0,
            other: 1,
        },
        lostWithoutReasonCount: 1,
        lostFromStages: [{ stage: "negotiation", count: 3 }],
        recentClosed: [deal("d1")],
        areas: [
            {
                key: "adajan|surat",
                locality: "Adajan",
                city: "Surat",
                earnedInr: 1_44_000,
                closedCount: 1,
                unvaluedCount: 0,
            },
        ],
        live: {
            count: 2,
            saleValueInr: 1_00_00_000,
            saleCount: 2,
            stageCounts: { new: 1, contacted: 0, visit: 0, negotiation: 1 },
            stageCommissionInr: { new: 0, contacted: 0, visit: 0, negotiation: 1_00_000 },
            stalledCount: 0,
            potentialInr: 1_00_000,
            valuedCount: 1,
            likelyInr: 1_00_000,
            likelyCount: 1,
            acceptedOfferCount: 0,
            topDeals: [deal("l1", { status: "negotiation", resolvedAt: null })],
        },
        ...overrides,
    };
}

test(
    "report sends the window and comparison as ISO query params",
    { skip: USE_MOCK_DATA },
    async (t) => {
        const urls = stubReport(t, rawReport());
        const selection = { preset: "last_month" as const };
        await earningsApi.report(selection, undefined, NOW);

        const window = resolveEarningsWindow(selection, NOW);
        const comparison = comparisonFor(selection, window, NOW)!;
        assert.equal(urls.length, 1);
        assert.equal(urls[0].pathname, "/earnings/report");
        assert.equal(urls[0].searchParams.get("from"), window.from!.toISOString());
        assert.equal(urls[0].searchParams.get("to"), window.to.toISOString());
        assert.equal(
            urls[0].searchParams.get("compareFrom"),
            comparison.window.from!.toISOString(),
        );
        assert.equal(urls[0].searchParams.get("compareTo"), comparison.window.to.toISOString());
    },
);

test("all time sends only the end of the window", { skip: USE_MOCK_DATA }, async (t) => {
    const urls = stubReport(t, rawReport());
    const report = await earningsApi.report({ preset: "all_time" }, undefined, NOW);

    assert.equal(urls[0].searchParams.has("from"), false);
    assert.equal(urls[0].searchParams.has("compareFrom"), false);
    assert.equal(urls[0].searchParams.has("compareTo"), false);
    assert.equal(report.comparison, null);
    assert.equal(report.window.from, null);
});

test("buckets become dated chart points with labels", () => {
    const selection = { preset: "last_12_months" as const };
    const window = resolveEarningsWindow(selection, NOW);
    const report = mapEarningsReport(rawReport(), {
        window,
        comparison: comparisonFor(selection, window, NOW),
    });

    assert.equal(report.buckets.length, 2);
    assert.equal(report.buckets[1].key, "2026-10-31T18:30:00.000Z");
    assert.ok(report.chartWindow.from instanceof Date);
    // Jan and Nov 2026: one calendar year, so short month labels.
    assert.equal(report.buckets[1].label, "Nov");
    assert.equal(report.buckets[1].longLabel, "November 2026");
    assert.equal(report.buckets[1].isToDate, true);
    assert.deepEqual(report.buckets[1].lostReasonCounts, { price: 1, other: 2 });
});

test("month labels gain the year when the chart spans two years", () => {
    const raw = rawReport();
    raw.buckets[0].start = "2025-11-30T18:30:00.000Z"; // Dec 2025
    const window = resolveEarningsWindow({ preset: "last_12_months" }, NOW);
    const report = mapEarningsReport(raw, { window, comparison: null });
    assert.equal(report.buckets[0].label, "Dec 25");
    assert.equal(report.buckets[1].label, "Nov 26");
});

test("Others row adds free-text reasons and deals with no reason; all four reasons always show", () => {
    const window = resolveEarningsWindow({ preset: "this_month" }, NOW);
    const report = mapEarningsReport(rawReport(), { window, comparison: null });

    assert.deepEqual(
        report.lostReasons.map((row) => [row.key, row.count]),
        [
            ["price", 1],
            ["bought_elsewhere", 0],
            ["not_responding", 0],
            ["changed_mind", 0],
            ["other", 2],
        ],
    );
    assert.equal(report.lostReasons.at(-1)?.label, "Others");
    assert.equal(report.lostWithoutReasonCount, 1);
});

test("deal rows keep the locked amounts and commission", () => {
    const window = resolveEarningsWindow({ preset: "this_month" }, NOW);
    const report = mapEarningsReport(rawReport(), { window, comparison: null });

    assert.deepEqual(report.recentClosed[0], {
        deal: {
            id: "d1",
            status: "closed",
            resolvedAt: "2026-11-05T06:00:00.000Z",
            buyer: { name: "Ravi" },
            property: {
                title: "2 BHK in Adajan",
                isRent: false,
                amountInr: 72_00_000,
                commissionPercent: 2,
                commissionAmountInr: null,
            },
            daysToClose: 9,
        },
        commissionInr: 1_44_000,
    });
    assert.equal(report.bestDeal?.deal.id, "d1");
    assert.equal(report.live.topDeals[0].deal.status, "negotiation");
    assert.equal(report.previousEarnedInr, 50_000);
    assert.equal(report.hasResolvedDeals, true);
    const fresh = mapEarningsReport(rawReport({ hasResolvedDeals: false }), {
        window,
        comparison: null,
    });
    assert.equal(fresh.hasResolvedDeals, false);
});

test("earnings query keeps the previous report while a new period loads", () => {
    const a = earningsReportQueryOptions({ preset: "last_6_months" }, NOW);
    const b = earningsReportQueryOptions({ preset: "all_time" }, NOW);

    assert.equal(a.placeholderData, keepPreviousData);
    assert.notDeepEqual(a.queryKey, b.queryKey);
    const window = resolveEarningsWindow({ preset: "last_6_months" }, NOW);
    assert.ok(a.queryKey.includes(window.from!.toISOString()));
    assert.ok(a.queryKey.includes(window.to.toISOString()));
});
