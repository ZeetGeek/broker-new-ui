/**
 * Broker earnings — `GET /earnings/report`.
 *
 * The backend filters sold / lost deals by the date they closed and computes
 * every number. The app only turns the chosen period into dates and adds the
 * labels people read (bucket names, lost-reason wording).
 */
import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";
import { pipelineApi } from "@/lib/api/pipeline";
import { withTestNetwork } from "@/lib/testing/test-network";

import {
    bucketLabels,
    type BucketUnit,
    buildEarningsReport,
    comparisonFor,
    type EarningsComparison,
    type EarningsDeal,
    type EarningsReport,
    type EarningsSelection,
    type EarningsWindow,
    labelMonthsWithYears,
    lostReasonRows,
    resolveEarningsWindow,
    type ValuedDeal,
} from "@/features/earnings/earnings-math";
import { DEAL_LOST_REASON_LABEL } from "@/features/pipeline/stage-meta";
import {
    type DealLostReason,
    type DealStage,
    DEFAULT_DEALS_FILTERS,
} from "@/features/pipeline/types";

type ApiDeal = {
    id: string;
    status: EarningsDeal["status"];
    resolvedAt: string | null;
    buyerName: string;
    property: EarningsDeal["property"];
    commissionInr: number | null;
    daysToClose: number | null;
};

type ApiLostReasonKey = DealLostReason | "other";

/** The response body, exactly as the API sends it. */
export type EarningsReportApi = {
    hasResolvedDeals: boolean;
    window: { from: string | null; to: string };
    chartWindow: { from: string; to: string };
    chartTrimmed: boolean;
    bucketUnit: BucketUnit;
    earnedInr: number;
    saleEarnedInr: number;
    rentEarnedInr: number;
    previousEarnedInr: number | null;
    closedCount: number;
    saleClosedCount: number;
    rentClosedCount: number;
    previousClosedCount: number | null;
    lostCount: number;
    previousLostCount: number | null;
    winRate: number | null;
    unvaluedClosedCount: number;
    avgDaysToClose: number | null;
    bestDeal: ApiDeal | null;
    buckets: Array<{
        start: string;
        saleInr: number;
        rentInr: number;
        totalInr: number;
        closed: number;
        lost: number;
        lostInr: number;
        lostReasonCounts: Partial<Record<ApiLostReasonKey, number>>;
        isToDate: boolean;
    }>;
    /** `other` counts free-text reasons only. */
    lostReasonCounts: Record<ApiLostReasonKey, number>;
    lostWithoutReasonCount: number;
    lostFromStages: Array<{ stage: DealStage; count: number }>;
    recentClosed: ApiDeal[];
    areas: EarningsReport["areas"];
    live: Omit<EarningsReport["live"], "topDeals"> & { topDeals: ApiDeal[] };
};

function toValued(deal: ApiDeal): ValuedDeal {
    return {
        deal: {
            id: deal.id,
            status: deal.status,
            resolvedAt: deal.resolvedAt,
            buyer: { name: deal.buyerName },
            property: deal.property,
            daysToClose: deal.daysToClose,
        },
        commissionInr: deal.commissionInr,
    };
}

/** Turns the API body into the report the page renders. */
export function mapEarningsReport(
    raw: EarningsReportApi,
    input: { window: EarningsWindow; comparison: EarningsComparison | null },
): EarningsReport {
    const buckets = raw.buckets.map((bucket) => ({
        ...bucket,
        key: bucket.start,
        ...bucketLabels(new Date(bucket.start), raw.bucketUnit),
    }));
    labelMonthsWithYears(buckets, raw.bucketUnit);

    return {
        hasResolvedDeals: raw.hasResolvedDeals,
        window: input.window,
        comparison: input.comparison,
        chartWindow: { from: new Date(raw.chartWindow.from), to: new Date(raw.chartWindow.to) },
        chartTrimmed: raw.chartTrimmed,
        bucketUnit: raw.bucketUnit,
        earnedInr: raw.earnedInr,
        saleEarnedInr: raw.saleEarnedInr,
        rentEarnedInr: raw.rentEarnedInr,
        previousEarnedInr: raw.previousEarnedInr,
        closedCount: raw.closedCount,
        saleClosedCount: raw.saleClosedCount,
        rentClosedCount: raw.rentClosedCount,
        previousClosedCount: raw.previousClosedCount,
        lostCount: raw.lostCount,
        previousLostCount: raw.previousLostCount,
        winRate: raw.winRate,
        unvaluedClosedCount: raw.unvaluedClosedCount,
        avgDaysToClose: raw.avgDaysToClose,
        bestDeal: raw.bestDeal ? toValued(raw.bestDeal) : null,
        buckets,
        lostReasons: lostReasonRows(
            (key) => raw.lostReasonCounts[key] ?? 0,
            (raw.lostReasonCounts.other ?? 0) + raw.lostWithoutReasonCount,
            (key) => DEAL_LOST_REASON_LABEL[key],
        ),
        lostWithoutReasonCount: raw.lostWithoutReasonCount,
        lostFromStages: raw.lostFromStages,
        recentClosed: raw.recentClosed.map(toValued),
        areas: raw.areas,
        live: { ...raw.live, topDeals: raw.live.topDeals.map(toValued) },
    };
}

export const earningsApi = withTestNetwork({
    async report(
        selection: EarningsSelection,
        signal?: AbortSignal,
        now = new Date(),
    ): Promise<EarningsReport> {
        const window = resolveEarningsWindow(selection, now);
        const comparison = comparisonFor(selection, window, now);

        if (isMockMode()) {
            const { items } = await pipelineApi.list(DEFAULT_DEALS_FILTERS, signal);
            return buildEarningsReport(items, selection, (key) => DEAL_LOST_REASON_LABEL[key], now);
        }

        const qs = new URLSearchParams();
        if (window.from) qs.set("from", window.from.toISOString());
        qs.set("to", window.to.toISOString());
        if (comparison?.window.from) {
            qs.set("compareFrom", comparison.window.from.toISOString());
            qs.set("compareTo", comparison.window.to.toISOString());
        }
        const raw = await apiFetch<EarningsReportApi>(`/earnings/report?${qs}`, { signal });
        return mapEarningsReport(raw, { window, comparison });
    },
});

/**
 * The report for one period. The key carries the resolved dates, and the
 * previous period's report stays on screen while the next one loads.
 */
export function earningsReportQueryOptions(selection: EarningsSelection, now = new Date()) {
    const window = resolveEarningsWindow(selection, now);
    return queryOptions({
        queryKey: [
            "broker",
            "earnings",
            "report",
            selection.preset,
            window.from?.toISOString() ?? "all",
            window.to.toISOString(),
        ],
        queryFn: ({ signal }) => earningsApi.report(selection, signal, now),
        placeholderData: keepPreviousData,
        // Always refetch on arrival so a deal just marked sold shows up at once.
        staleTime: 0,
    });
}
