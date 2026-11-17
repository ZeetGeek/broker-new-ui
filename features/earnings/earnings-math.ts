/**
 * Earnings report — pure maths over the broker's pipeline deals.
 *
 * Everything here is derived from data the leads API already returns. There
 * is no payments ledger, so every rupee figure is an ESTIMATE: the commission
 * the owner set on the property, applied to the best known deal amount.
 *
 * - Sale: final price (when saved) → accepted offer → listed ask, × commission %.
 * - Rent: the fixed brokerage the owner set (one-time, not monthly).
 */
import {
    addMonths,
    addWeeks,
    differenceInCalendarDays,
    endOfDay,
    endOfMonth,
    format,
    isAfter,
    isBefore,
    startOfDay,
    startOfMonth,
    startOfWeek,
    startOfYear,
    subDays,
    subMonths,
    subYears,
} from "date-fns";

import { isStalled } from "@/lib/api/pipeline";

import {
    DEAL_STAGE_ORDER,
    type DealItem,
    type DealLostReason,
    type DealStage,
    isLiveStage,
} from "@/features/pipeline/types";

// ---------------------------------------------------------------------------
// Date ranges
// ---------------------------------------------------------------------------

export type EarningsPreset =
    | "this_month"
    | "last_month"
    | "last_3_months"
    | "last_6_months"
    | "last_9_months"
    | "last_12_months"
    | "this_year"
    | "this_fy"
    | "last_fy"
    | "all_time"
    | "custom";

export const EARNINGS_PRESETS: ReadonlyArray<{
    value: Exclude<EarningsPreset, "custom">;
    label: string;
}> = [
    { value: "this_month", label: "This month" },
    { value: "last_month", label: "Last month" },
    { value: "last_3_months", label: "Last 3 months" },
    { value: "last_6_months", label: "Last 6 months" },
    { value: "last_9_months", label: "Last 9 months" },
    { value: "last_12_months", label: "Last 12 months" },
    { value: "this_year", label: "This year" },
    { value: "this_fy", label: "This financial year" },
    { value: "last_fy", label: "Last financial year" },
    { value: "all_time", label: "All time" },
];

export const DEFAULT_EARNINGS_PRESET: EarningsPreset = "last_6_months";

export type EarningsSelection = {
    preset: EarningsPreset;
    /** Only used when `preset` is "custom". */
    customFrom?: Date | null;
    customTo?: Date | null;
};

/** Resolved window. `from` is null for "all time" (no lower bound). */
export type EarningsWindow = { from: Date | null; to: Date };

/** Indian financial year starts 1 April. */
function financialYearStart(now: Date): Date {
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return new Date(year, 3, 1);
}

/** "Last N months" includes the current month: 3 months on 17 Nov = 1 Sep → today. */
function lastMonths(now: Date, months: number): EarningsWindow {
    return { from: startOfMonth(subMonths(now, months - 1)), to: endOfDay(now) };
}

export function resolveEarningsWindow(
    selection: EarningsSelection,
    now = new Date(),
): EarningsWindow {
    switch (selection.preset) {
        case "this_month":
            return { from: startOfMonth(now), to: endOfDay(now) };
        case "last_month": {
            const prev = subMonths(now, 1);
            return { from: startOfMonth(prev), to: endOfMonth(prev) };
        }
        case "last_3_months":
            return lastMonths(now, 3);
        case "last_6_months":
            return lastMonths(now, 6);
        case "last_9_months":
            return lastMonths(now, 9);
        case "last_12_months":
            return lastMonths(now, 12);
        case "this_year":
            return { from: startOfYear(now), to: endOfDay(now) };
        case "this_fy":
            return { from: financialYearStart(now), to: endOfDay(now) };
        case "last_fy": {
            const thisStart = financialYearStart(now);
            return { from: subYears(thisStart, 1), to: endOfDay(subDays(thisStart, 1)) };
        }
        case "all_time":
            return { from: null, to: endOfDay(now) };
        case "custom": {
            const from = selection.customFrom
                ? startOfDay(selection.customFrom)
                : startOfMonth(now);
            const to = selection.customTo ? endOfDay(selection.customTo) : endOfDay(from);
            return isAfter(from, to) ? { from: startOfDay(to), to: endOfDay(from) } : { from, to };
        }
    }
}

/** The equal-length window just before this one. Null for "all time". */
export function previousWindow(window: EarningsWindow): EarningsWindow | null {
    if (!window.from) return null;
    const days = differenceInCalendarDays(window.to, window.from) + 1;
    const to = endOfDay(subDays(window.from, 1));
    return { from: startOfDay(subDays(window.from, days)), to };
}

function inWindow(iso: string | null | undefined, window: EarningsWindow): boolean {
    if (!iso) return false;
    const at = new Date(iso);
    if (Number.isNaN(at.getTime())) return false;
    if (window.from && isBefore(at, window.from)) return false;
    return !isAfter(at, window.to);
}

// ---------------------------------------------------------------------------
// Commission
// ---------------------------------------------------------------------------

/** Best known amount the deal closed at (or will close at). */
export function dealBaseAmountInr(deal: DealItem): number {
    if (deal.closedAmountInr != null && deal.closedAmountInr > 0) return deal.closedAmountInr;
    if (deal.offerStatus === "accepted" && deal.offerAmountInr && deal.offerAmountInr > 0) {
        return deal.offerAmountInr;
    }
    return deal.property.amountInr;
}

/**
 * Estimated brokerage on one deal, in INR. Null when the owner never set a
 * commission — that deal cannot be valued, and must not be counted as ₹0.
 */
export function dealCommissionInr(deal: DealItem): number | null {
    if (deal.property.isRent) {
        const amount = deal.property.commissionAmountInr ?? 0;
        return amount > 0 ? Math.round(amount) : null;
    }
    const percent = deal.property.commissionPercent ?? 0;
    if (percent <= 0) return null;
    return Math.round((dealBaseAmountInr(deal) * percent) / 100);
}

// ---------------------------------------------------------------------------
// Buckets (chart x-axis)
// ---------------------------------------------------------------------------

export type EarningsBucket = {
    key: string;
    label: string;
    /** Long label for tooltips and the screen-reader table. */
    longLabel: string;
    saleInr: number;
    rentInr: number;
    totalInr: number;
    closed: number;
    lost: number;
    /** True for the bucket holding today — it is still filling up. */
    isToDate: boolean;
};

export type BucketUnit = "week" | "month";

/** Short windows read better week by week; anything longer, month by month. */
export function bucketUnitFor(window: { from: Date; to: Date }): BucketUnit {
    return differenceInCalendarDays(window.to, window.from) <= 62 ? "week" : "month";
}

function buildBuckets(from: Date, to: Date, unit: BucketUnit, now: Date): EarningsBucket[] {
    const buckets: EarningsBucket[] = [];
    let cursor = unit === "week" ? startOfWeek(from, { weekStartsOn: 1 }) : startOfMonth(from);
    // Hard cap so a stray decade-old deal cannot draw 500 bars.
    while (!isAfter(cursor, to) && buckets.length < 120) {
        const next = unit === "week" ? addWeeks(cursor, 1) : addMonths(cursor, 1);
        const isToDate = !isBefore(now, cursor) && isBefore(now, next);
        buckets.push({
            key: cursor.toISOString(),
            label: unit === "week" ? format(cursor, "d MMM") : format(cursor, "MMM"),
            longLabel:
                unit === "week"
                    ? `Week of ${format(cursor, "d MMM yyyy")}`
                    : format(cursor, "MMMM yyyy"),
            saleInr: 0,
            rentInr: 0,
            totalInr: 0,
            closed: 0,
            lost: 0,
            isToDate,
        });
        cursor = next;
    }
    // Month labels gain a year when the chart spans more than one.
    if (unit === "month" && buckets.length > 0) {
        const years = new Set(buckets.map((b) => new Date(b.key).getFullYear()));
        if (years.size > 1) {
            for (const b of buckets) b.label = format(new Date(b.key), "MMM yy");
        }
    }
    return buckets;
}

function bucketIndex(buckets: EarningsBucket[], iso: string): number {
    const at = new Date(iso).getTime();
    for (let i = buckets.length - 1; i >= 0; i -= 1) {
        if (new Date(buckets[i].key).getTime() <= at) return i;
    }
    return -1;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export type ValuedDeal = { deal: DealItem; commissionInr: number | null };

export type LostReasonRow = { key: DealLostReason | "other"; label: string; count: number };

export type EarningsReport = {
    window: EarningsWindow;
    /** Window actually drawn on charts (all time → first deal → today). */
    chartWindow: { from: Date; to: Date };
    bucketUnit: BucketUnit;

    earnedInr: number;
    saleEarnedInr: number;
    rentEarnedInr: number;
    /** Null when there is no previous period to compare (all time). */
    previousEarnedInr: number | null;

    closedCount: number;
    saleClosedCount: number;
    rentClosedCount: number;
    previousClosedCount: number | null;
    lostCount: number;
    previousLostCount: number | null;
    /** Closed ÷ (closed + lost), 0–100. Null with nothing resolved. */
    winRate: number | null;

    /** Closed deals in range whose property had no commission set. */
    unvaluedClosedCount: number;
    /** Average calendar days from deal created → closed. Null without data. */
    avgDaysToClose: number | null;
    /** Largest single commission in range. */
    bestDeal: ValuedDeal | null;

    buckets: EarningsBucket[];

    lostReasons: LostReasonRow[];
    /** Lost deals in range with no saved reason. */
    lostWithoutReasonCount: number;
    lostFromStages: Array<{ stage: DealStage; count: number }>;

    recentClosed: ValuedDeal[];

    live: {
        count: number;
        valueInr: number;
        stageCounts: Record<DealStage, number>;
        stalledCount: number;
        /** Commission on every live deal that has one set. */
        potentialInr: number;
        /** Commission on deals in negotiation or with an accepted offer. */
        likelyInr: number;
        likelyCount: number;
        acceptedOfferCount: number;
        topDeals: ValuedDeal[];
    };
};

const LOST_REASON_ORDER: DealLostReason[] = [
    "price",
    "bought_elsewhere",
    "not_responding",
    "changed_mind",
];

function sumCommission(deals: DealItem[]) {
    let sale = 0;
    let rent = 0;
    let unvalued = 0;
    for (const deal of deals) {
        const c = dealCommissionInr(deal);
        if (c == null) {
            unvalued += 1;
            continue;
        }
        if (deal.property.isRent) rent += c;
        else sale += c;
    }
    return { sale, rent, total: sale + rent, unvalued };
}

export function buildEarningsReport(
    deals: DealItem[],
    selection: EarningsSelection,
    lostReasonLabel: (key: DealLostReason) => string,
    now = new Date(),
): EarningsReport {
    const window = resolveEarningsWindow(selection, now);
    const prev = previousWindow(window);

    const closedAll = deals.filter((d) => d.status === "closed" && d.resolvedAt);
    const lostAll = deals.filter((d) => d.status === "lost" && d.resolvedAt);

    const closed = closedAll.filter((d) => inWindow(d.resolvedAt, window));
    const lost = lostAll.filter((d) => inWindow(d.resolvedAt, window));

    const money = sumCommission(closed);
    const prevClosed = prev ? closedAll.filter((d) => inWindow(d.resolvedAt, prev)) : null;
    const prevLost = prev ? lostAll.filter((d) => inWindow(d.resolvedAt, prev)) : null;

    // Chart window: all time starts at the first resolved deal (or 6 months back).
    const firstResolved = [...closedAll, ...lostAll]
        .map((d) => new Date(d.resolvedAt as string))
        .filter((d) => !Number.isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime())[0];
    const chartFrom =
        window.from ??
        (firstResolved && isBefore(firstResolved, subMonths(now, 5))
            ? startOfMonth(firstResolved)
            : startOfMonth(subMonths(now, 5)));
    const chartWindow = { from: chartFrom, to: window.to };
    const bucketUnit = bucketUnitFor(chartWindow);
    const buckets = buildBuckets(chartFrom, window.to, bucketUnit, now);

    for (const deal of closed) {
        const i = bucketIndex(buckets, deal.resolvedAt as string);
        if (i < 0) continue;
        buckets[i].closed += 1;
        const c = dealCommissionInr(deal);
        if (c == null) continue;
        if (deal.property.isRent) buckets[i].rentInr += c;
        else buckets[i].saleInr += c;
        buckets[i].totalInr += c;
    }
    for (const deal of lost) {
        const i = bucketIndex(buckets, deal.resolvedAt as string);
        if (i >= 0) buckets[i].lost += 1;
    }

    const closeDurations = closed
        .filter((d) => d.createdAt)
        .map((d) =>
            Math.max(
                0,
                differenceInCalendarDays(
                    new Date(d.resolvedAt as string),
                    new Date(d.createdAt as string),
                ),
            ),
        )
        .filter((n) => Number.isFinite(n));

    const valuedClosed: ValuedDeal[] = closed.map((deal) => ({
        deal,
        commissionInr: dealCommissionInr(deal),
    }));
    const bestDeal =
        valuedClosed
            .filter((v) => v.commissionInr != null)
            .sort((a, b) => (b.commissionInr ?? 0) - (a.commissionInr ?? 0))[0] ?? null;

    // Loss analysis
    const reasonCounts = new Map<string, number>();
    let lostWithoutReasonCount = 0;
    for (const deal of lost) {
        const reason = deal.lostReason?.trim();
        if (!reason) {
            lostWithoutReasonCount += 1;
            continue;
        }
        const key = (LOST_REASON_ORDER as string[]).includes(reason) ? reason : "other";
        reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1);
    }
    const lostReasons: LostReasonRow[] = [
        ...LOST_REASON_ORDER.map((key) => ({
            key,
            label: lostReasonLabel(key),
            count: reasonCounts.get(key) ?? 0,
        })),
        { key: "other" as const, label: "Other reason", count: reasonCounts.get("other") ?? 0 },
    ]
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count);

    const lostFromStages = DEAL_STAGE_ORDER.map((stage) => ({
        stage,
        count: lost.filter((d) => d.lostFromStage === stage).length,
    })).filter((row) => row.count > 0);

    // Live pipeline (not range-bound — it is "right now")
    const liveDeals = deals.filter((d) => isLiveStage(d.status));
    const stageCounts = Object.fromEntries(
        DEAL_STAGE_ORDER.map((stage) => [
            stage,
            liveDeals.filter((d) => d.status === stage).length,
        ]),
    ) as Record<DealStage, number>;
    const valuedLive: ValuedDeal[] = liveDeals.map((deal) => ({
        deal,
        commissionInr: dealCommissionInr(deal),
    }));
    const likely = valuedLive.filter(
        (v) => v.deal.status === "negotiation" || v.deal.offerStatus === "accepted",
    );

    const resolvedCount = closed.length + lost.length;

    return {
        window,
        chartWindow,
        bucketUnit,
        earnedInr: money.total,
        saleEarnedInr: money.sale,
        rentEarnedInr: money.rent,
        previousEarnedInr: prevClosed ? sumCommission(prevClosed).total : null,
        closedCount: closed.length,
        saleClosedCount: closed.filter((d) => !d.property.isRent).length,
        rentClosedCount: closed.filter((d) => d.property.isRent).length,
        previousClosedCount: prevClosed ? prevClosed.length : null,
        lostCount: lost.length,
        previousLostCount: prevLost ? prevLost.length : null,
        winRate: resolvedCount === 0 ? null : Math.round((closed.length / resolvedCount) * 100),
        unvaluedClosedCount: money.unvalued,
        avgDaysToClose:
            closeDurations.length === 0
                ? null
                : Math.round(closeDurations.reduce((a, b) => a + b, 0) / closeDurations.length),
        bestDeal,
        buckets,
        lostReasons,
        lostWithoutReasonCount,
        lostFromStages,
        recentClosed: [...valuedClosed]
            .sort(
                (a, b) =>
                    new Date(b.deal.resolvedAt as string).getTime() -
                    new Date(a.deal.resolvedAt as string).getTime(),
            )
            .slice(0, 5),
        live: {
            count: liveDeals.length,
            valueInr: liveDeals.reduce((sum, d) => sum + d.property.amountInr, 0),
            stageCounts,
            stalledCount: liveDeals.filter(isStalled).length,
            potentialInr: valuedLive.reduce((sum, v) => sum + (v.commissionInr ?? 0), 0),
            likelyInr: likely.reduce((sum, v) => sum + (v.commissionInr ?? 0), 0),
            likelyCount: likely.length,
            acceptedOfferCount: liveDeals.filter((d) => d.offerStatus === "accepted").length,
            topDeals: valuedLive
                .filter((v) => v.commissionInr != null)
                .sort((a, b) => (b.commissionInr ?? 0) - (a.commissionInr ?? 0))
                .slice(0, 5),
        },
    };
}

/** Percent change, rounded. Null when there is nothing to compare against. */
export function percentChange(current: number, previous: number | null): number | null {
    if (previous == null || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
}

/** "1 Jun – 17 Nov 2026" */
export function formatWindow(window: { from: Date | null; to: Date }): string {
    if (!window.from) return `Up to ${format(window.to, "d MMM yyyy")}`;
    const sameYear = window.from.getFullYear() === window.to.getFullYear();
    const sameDay = differenceInCalendarDays(window.to, window.from) === 0;
    if (sameDay) return format(window.to, "d MMM yyyy");
    return `${format(window.from, sameYear ? "d MMM" : "d MMM yyyy")} – ${format(window.to, "d MMM yyyy")}`;
}

/** Inclusive day count of a bounded window. */
export function windowDays(window: { from: Date; to: Date }): number {
    return differenceInCalendarDays(window.to, window.from) + 1;
}
