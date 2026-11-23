/**
 * Earnings report — period presets, comparison windows, chart labels and the
 * headline copy. The numbers come from the API (`GET /earnings/report`, see
 * `lib/api/earnings.ts`); `buildEarningsReport` below only serves mock mode.
 *
 * There is no payments ledger, so every rupee figure is an ESTIMATE: the
 * commission the owner set on the property, applied to the best known deal
 * amount, locked when the deal is sold or lost.
 *
 * - Sale: final price (when saved) → accepted offer → listed ask, × commission %.
 * - Rent: the fixed brokerage the owner set (one-time, not monthly).
 */
import {
    addMonths,
    addQuarters,
    addWeeks,
    addYears,
    differenceInCalendarDays,
    endOfDay,
    endOfMonth,
    format,
    isAfter,
    isBefore,
    startOfDay,
    startOfMonth,
    startOfQuarter,
    startOfWeek,
    startOfYear,
    subDays,
    subMonths,
    subQuarters,
    subWeeks,
    subYears,
} from "date-fns";

import { isStalled } from "@/lib/api/pipeline";
import { formatCommission } from "@/lib/format/commission";
import { formatDateRangeMedium } from "@/lib/format/date";
import { plural } from "@/lib/format/plural";

import { DEAL_LOST_REASON_DETAIL } from "@/features/pipeline/stage-meta";
import {
    DEAL_STAGE_ORDER,
    type DealItem,
    type DealLostReason,
    type DealStage,
    type DealStatus,
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

/** What the selected period is compared against, and how to say it in a sentence. */
export type EarningsComparison = {
    window: EarningsWindow;
    /** Noun phrase that follows "vs" or "on": "September", "the 6 months before". */
    phrase: string;
};

const MONTH_PRESETS: Partial<Record<EarningsPreset, number>> = {
    last_3_months: 3,
    last_6_months: 6,
    last_9_months: 9,
    last_12_months: 12,
};

/**
 * Calendar-aware comparison. Month presets compare against whole months, and
 * year-to-date presets against the same stretch a year earlier, so a festive
 * month is never measured against half of another one. Null for "all time".
 */
export function comparisonFor(
    selection: EarningsSelection,
    window: EarningsWindow,
    now = new Date(),
): EarningsComparison | null {
    if (!window.from) return null;
    const months = MONTH_PRESETS[selection.preset];
    if (months) {
        return {
            window: {
                from: startOfMonth(subMonths(window.from, months)),
                to: endOfDay(subMonths(window.to, months)),
            },
            phrase: `the ${months} months before`,
        };
    }
    switch (selection.preset) {
        case "this_month":
            return {
                window: { from: startOfMonth(subMonths(now, 1)), to: endOfDay(subMonths(now, 1)) },
                phrase: "the same days last month",
            };
        case "last_month": {
            const prev = subMonths(window.from, 1);
            return {
                window: { from: startOfMonth(prev), to: endOfMonth(prev) },
                phrase: format(prev, "MMMM"),
            };
        }
        case "this_year":
        case "this_fy":
            return {
                window: { from: subYears(window.from, 1), to: endOfDay(subYears(now, 1)) },
                phrase:
                    selection.preset === "this_year"
                        ? "the same time last year"
                        : "the same time last financial year",
            };
        case "last_fy":
            return {
                window: { from: subYears(window.from, 1), to: endOfDay(subDays(window.from, 1)) },
                phrase: "the financial year before",
            };
        default: {
            const prev = previousWindow(window);
            if (!prev?.from) return null;
            const days = windowDays({ from: prev.from, to: prev.to });
            return {
                window: prev,
                phrase: days === 1 ? "the day before" : `the ${days} days before`,
            };
        }
    }
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

/** Calendar days from deal created → sold. Null when either date is missing. */
export function dealDaysToClose(deal: DealItem): number | null {
    if (!deal.createdAt || !deal.resolvedAt) return null;
    const days = differenceInCalendarDays(new Date(deal.resolvedAt), new Date(deal.createdAt));
    return Number.isFinite(days) ? Math.max(0, days) : null;
}

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
    /** Estimated commission that walked away with lost deals in this bucket. */
    lostInr: number;
    /**
     * Lost-reason counts in this bucket. Keys are Mark as lost codes or
     * `"other"` (free text / missing). Labels are applied in the chart UI.
     */
    lostReasonCounts: Partial<Record<DealLostReason | "other", number>>;
    /** True for the bucket holding today — it is still filling up. */
    isToDate: boolean;
};

export type BucketUnit = "week" | "month" | "quarter" | "year";

/**
 * Grain scales with range length so a 16-year custom range stays readable
 * (~16 year marks) instead of hundreds of weeks.
 */
export function bucketUnitFor(window: { from: Date; to: Date }): BucketUnit {
    const days = differenceInCalendarDays(window.to, window.from);
    if (days <= 62) return "week";
    if (days <= 36 * 31) return "month"; // up to ~3 years
    if (days <= 36 * 92) return "quarter"; // up to ~9 years
    return "year";
}

/** Plain unit word for copy ("per week", chart titles). */
export function bucketUnitWord(unit: BucketUnit): string {
    return unit;
}

/** Most points a chart draws. Older history is trimmed; the latest stay. */
const MAX_BUCKETS = 36;

function startOfBucket(date: Date, unit: BucketUnit): Date {
    switch (unit) {
        case "week":
            return startOfWeek(date, { weekStartsOn: 1 });
        case "month":
            return startOfMonth(date);
        case "quarter":
            return startOfQuarter(date);
        case "year":
            return startOfYear(date);
    }
}

function addBucket(date: Date, unit: BucketUnit): Date {
    switch (unit) {
        case "week":
            return addWeeks(date, 1);
        case "month":
            return addMonths(date, 1);
        case "quarter":
            return addQuarters(date, 1);
        case "year":
            return addYears(date, 1);
    }
}

/** Earliest bucket start that still fits MAX_BUCKETS ending at `to`. */
function oldestAllowedBucket(to: Date, unit: BucketUnit): Date {
    switch (unit) {
        case "week":
            return startOfWeek(subWeeks(to, MAX_BUCKETS - 1), { weekStartsOn: 1 });
        case "month":
            return startOfMonth(subMonths(to, MAX_BUCKETS - 1));
        case "quarter":
            return startOfQuarter(subQuarters(to, MAX_BUCKETS - 1));
        case "year":
            return startOfYear(subYears(to, MAX_BUCKETS - 1));
    }
}

export function bucketLabels(cursor: Date, unit: BucketUnit): { label: string; longLabel: string } {
    switch (unit) {
        case "week":
            return {
                label: format(cursor, "d MMM"),
                longLabel: `Week of ${format(cursor, "d MMM yyyy")}`,
            };
        case "month":
            return {
                label: format(cursor, "MMM"),
                longLabel: format(cursor, "MMMM yyyy"),
            };
        case "quarter": {
            const q = Math.floor(cursor.getMonth() / 3) + 1;
            const year = format(cursor, "yy");
            const longYear = format(cursor, "yyyy");
            const end = addMonths(cursor, 2);
            return {
                label: `Q${q} '${year}`,
                longLabel: `${format(cursor, "MMM")}–${format(end, "MMM")} ${longYear}`,
            };
        }
        case "year":
            return {
                label: format(cursor, "yyyy"),
                longLabel: format(cursor, "yyyy"),
            };
    }
}

function buildBuckets(from: Date, to: Date, unit: BucketUnit, now: Date): EarningsBucket[] {
    const buckets: EarningsBucket[] = [];
    let cursor = startOfBucket(from, unit);
    while (!isAfter(cursor, to)) {
        const next = addBucket(cursor, unit);
        const isToDate = !isBefore(now, cursor) && isBefore(now, next);
        const { label, longLabel } = bucketLabels(cursor, unit);
        buckets.push({
            key: cursor.toISOString(),
            label,
            longLabel,
            saleInr: 0,
            rentInr: 0,
            totalInr: 0,
            closed: 0,
            lost: 0,
            lostInr: 0,
            lostReasonCounts: {},
            isToDate,
        });
        cursor = next;
    }
    labelMonthsWithYears(buckets, unit);
    return buckets;
}

/** Month labels gain a year when the chart spans more than one calendar year. */
export function labelMonthsWithYears(buckets: EarningsBucket[], unit: BucketUnit): void {
    if (unit !== "month" || buckets.length === 0) return;
    const years = new Set(buckets.map((b) => new Date(b.key).getFullYear()));
    if (years.size > 1) {
        for (const b of buckets) b.label = format(new Date(b.key), "MMM yy");
    }
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

/**
 * The few deal fields the earnings page shows. For sold and lost deals the
 * amounts are the ones locked when the deal closed.
 */
export type EarningsDeal = {
    id: string;
    status: DealStatus;
    resolvedAt: string | null;
    /** The id is known in mock mode; the API sends only the name. */
    buyer: { id?: string; name: string };
    property: {
        title: string;
        isRent: boolean;
        amountInr: number;
        commissionPercent: number | null;
        commissionAmountInr: number | null;
    };
    /** Calendar days from the deal being added to closing. Null while live. */
    daysToClose: number | null;
};

export type ValuedDeal = { deal: EarningsDeal; commissionInr: number | null };

/** A pipeline deal with its estimated commission (mock mode and area grouping). */
type PipelineValuedDeal = { deal: DealItem; commissionInr: number | null };

export function toEarningsDeal(deal: DealItem): EarningsDeal {
    return {
        id: deal.id,
        status: deal.status,
        resolvedAt: deal.resolvedAt ?? null,
        buyer: { id: deal.buyer.id, name: deal.buyer.name },
        property: {
            title: deal.property.title,
            isRent: deal.property.isRent,
            amountInr:
                deal.status === "closed" || deal.status === "lost"
                    ? dealBaseAmountInr(deal)
                    : deal.property.amountInr,
            commissionPercent: deal.property.commissionPercent ?? null,
            commissionAmountInr: deal.property.commissionAmountInr ?? null,
        },
        daysToClose: deal.status === "closed" ? dealDaysToClose(deal) : null,
    };
}

const toValued = ({ deal, commissionInr }: PipelineValuedDeal): ValuedDeal => ({
    deal: toEarningsDeal(deal),
    commissionInr,
});

/** Sold deals in one locality, for "Earnings by area". */
export type AreaEarningsRow = {
    /** Normalised "locality|city", stable across periods. */
    key: string;
    locality: string;
    city: string;
    earnedInr: number;
    closedCount: number;
    /** Sold here with no commission set, so they add nothing to `earnedInr`. */
    unvaluedCount: number;
};

/**
 * Groups sold deals by locality + city (two "Baner"s in different cities stay
 * apart). Most money first; ties go to more deals, then name.
 */
export function earningsByArea(valued: PipelineValuedDeal[]): AreaEarningsRow[] {
    const rows = new Map<string, AreaEarningsRow>();
    for (const { deal, commissionInr } of valued) {
        const locality = deal.property.locality?.trim() ?? "";
        const city = deal.property.city?.trim() ?? "";
        if (!locality && !city) continue;
        const key = `${locality.toLowerCase()}|${city.toLowerCase()}`;
        const row = rows.get(key) ?? {
            key,
            locality: locality || city,
            city: locality ? city : "",
            earnedInr: 0,
            closedCount: 0,
            unvaluedCount: 0,
        };
        row.closedCount += 1;
        if (commissionInr == null) row.unvaluedCount += 1;
        else row.earnedInr += commissionInr;
        rows.set(key, row);
    }
    return [...rows.values()].sort(
        (a, b) =>
            b.earnedInr - a.earnedInr ||
            b.closedCount - a.closedCount ||
            a.locality.localeCompare(b.locality),
    );
}

export type LostReasonRow = {
    key: DealLostReason | "other";
    label: string;
    /** Same helper line as the Mark as lost modal. Null for “Others”. */
    detail: string | null;
    count: number;
};

export type EarningsReport = {
    /** False until the broker has sold or lost any deal, in any period. */
    hasResolvedDeals: boolean;
    window: EarningsWindow;
    /** What the period is compared against. Null for "all time". */
    comparison: EarningsComparison | null;
    /** Window actually drawn on charts (all time → first deal → today). */
    chartWindow: { from: Date; to: Date };
    /** True when the chart shows a shorter span than the selected totals window. */
    chartTrimmed: boolean;
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
    /** Sold deals in range grouped by area, most money first. */
    areas: AreaEarningsRow[];

    live: {
        count: number;
        /** Asking price of open sale deals. Rent is monthly, so it is left out. */
        saleValueInr: number;
        saleCount: number;
        stageCounts: Record<DealStage, number>;
        /** Commission on live deals in each stage (deals with no commission add 0). */
        stageCommissionInr: Record<DealStage, number>;
        /** Asking price of open sale deals in each stage. */
        stageSaleValueInr: Record<DealStage, number>;
        /** Monthly rent of open rent deals in each stage. */
        stageMonthlyRentInr: Record<DealStage, number>;
        /** Monthly rent across open rent deals. */
        rentValueInr: number;
        stalledCount: number;
        /** Commission on every live deal that has one set. */
        potentialInr: number;
        /** Live deals whose owner set a commission. */
        valuedCount: number;
        /** Commission on deals in negotiation or with an accepted offer. */
        likelyInr: number;
        likelyCount: number;
        acceptedOfferCount: number;
        topDeals: ValuedDeal[];
    };
};

/**
 * Always the same five rows as Mark as lost (4 reasons + Others), zeros
 * included. "Others" holds free-text reasons and deals saved with no reason.
 */
export function lostReasonRows(
    countFor: (key: DealLostReason) => number,
    othersCount: number,
    lostReasonLabel: (key: DealLostReason) => string,
): LostReasonRow[] {
    return [
        ...LOST_REASON_ORDER.map((key) => ({
            key,
            label: lostReasonLabel(key),
            detail: DEAL_LOST_REASON_DETAIL[key],
            count: countFor(key),
        })),
        {
            key: "other" as const,
            label: "Others",
            detail: "No listed reason, or written in as free text",
            count: othersCount,
        },
    ];
}

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
    const comparison = comparisonFor(selection, window, now);
    const prev = comparison?.window ?? null;

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
    let chartFrom =
        window.from ??
        (firstResolved && isBefore(firstResolved, subMonths(now, 5))
            ? startOfMonth(firstResolved)
            : startOfMonth(subMonths(now, 5)));
    const bucketUnit = bucketUnitFor({ from: chartFrom, to: window.to });
    // Long histories keep the latest buckets; a stray old deal must not squeeze the chart.
    const oldestBar = oldestAllowedBucket(window.to, bucketUnit);
    let chartTrimmed = false;
    if (isBefore(chartFrom, oldestBar)) {
        chartFrom = oldestBar;
        chartTrimmed = true;
    }
    const chartWindow = { from: chartFrom, to: window.to };
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
        if (i < 0) continue;
        buckets[i].lost += 1;
        const c = dealCommissionInr(deal);
        if (c != null) buckets[i].lostInr += c;
        const reason = deal.lostReason?.trim();
        const reasonKey: DealLostReason | "other" = reason
            ? (LOST_REASON_ORDER as string[]).includes(reason)
                ? (reason as DealLostReason)
                : "other"
            : "other";
        buckets[i].lostReasonCounts[reasonKey] = (buckets[i].lostReasonCounts[reasonKey] ?? 0) + 1;
    }

    const closeDurations = closed.map(dealDaysToClose).filter((n): n is number => n != null);

    const valuedClosed: PipelineValuedDeal[] = closed.map((deal) => ({
        deal,
        commissionInr: dealCommissionInr(deal),
    }));
    const best =
        valuedClosed
            .filter((v) => v.commissionInr != null)
            .sort((a, b) => (b.commissionInr ?? 0) - (a.commissionInr ?? 0))[0] ?? null;

    // Loss analysis — same reasons / details as the Mark as lost modal.
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
    // Always the same five rows as Mark as lost (4 reasons + Others), zeros included.
    const lostReasons = lostReasonRows(
        (key) => reasonCounts.get(key) ?? 0,
        (reasonCounts.get("other") ?? 0) + lostWithoutReasonCount,
        lostReasonLabel,
    );

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
    const valuedLive: PipelineValuedDeal[] = liveDeals.map((deal) => ({
        deal,
        commissionInr: dealCommissionInr(deal),
    }));
    const stageCommissionInr = Object.fromEntries(
        DEAL_STAGE_ORDER.map((stage) => [
            stage,
            valuedLive
                .filter((v) => v.deal.status === stage)
                .reduce((sum, v) => sum + (v.commissionInr ?? 0), 0),
        ]),
    ) as Record<DealStage, number>;
    const stageAskInr = (isRent: boolean) =>
        Object.fromEntries(
            DEAL_STAGE_ORDER.map((stage) => [
                stage,
                liveDeals
                    .filter((d) => d.status === stage && d.property.isRent === isRent)
                    .reduce((sum, d) => sum + d.property.amountInr, 0),
            ]),
        ) as Record<DealStage, number>;
    const likely = valuedLive.filter(
        (v) => v.deal.status === "negotiation" || v.deal.offerStatus === "accepted",
    );

    const resolvedCount = closed.length + lost.length;

    return {
        hasResolvedDeals: closedAll.length + lostAll.length > 0,
        window,
        comparison,
        chartWindow,
        chartTrimmed,
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
        bestDeal: best ? toValued(best) : null,
        buckets,
        lostReasons,
        lostWithoutReasonCount,
        lostFromStages,
        areas: earningsByArea(valuedClosed),
        recentClosed: [...valuedClosed]
            .sort(
                (a, b) =>
                    new Date(b.deal.resolvedAt as string).getTime() -
                    new Date(a.deal.resolvedAt as string).getTime(),
            )
            .slice(0, 5)
            .map(toValued),
        live: {
            count: liveDeals.length,
            saleValueInr: liveDeals
                .filter((d) => !d.property.isRent)
                .reduce((sum, d) => sum + d.property.amountInr, 0),
            saleCount: liveDeals.filter((d) => !d.property.isRent).length,
            stageCounts,
            stageCommissionInr,
            stageSaleValueInr: stageAskInr(false),
            stageMonthlyRentInr: stageAskInr(true),
            rentValueInr: liveDeals
                .filter((d) => d.property.isRent)
                .reduce((sum, d) => sum + d.property.amountInr, 0),
            stalledCount: liveDeals.filter(isStalled).length,
            potentialInr: valuedLive.reduce((sum, v) => sum + (v.commissionInr ?? 0), 0),
            valuedCount: valuedLive.filter((v) => v.commissionInr != null).length,
            likelyInr: likely.reduce((sum, v) => sum + (v.commissionInr ?? 0), 0),
            likelyCount: likely.length,
            acceptedOfferCount: liveDeals.filter((d) => d.offerStatus === "accepted").length,
            topDeals: valuedLive
                .filter((v) => v.commissionInr != null)
                .sort((a, b) => (b.commissionInr ?? 0) - (a.commissionInr ?? 0))
                .slice(0, 10)
                .map(toValued),
        },
    };
}

/** Percent change, rounded. Null when there is nothing to compare against. */
export function percentChange(current: number, previous: number | null): number | null {
    if (previous == null || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
}

/** Sold / lost line for the selected period. */
function earningsOutcomesLine(report: EarningsReport): string {
    if (report.closedCount === 0) {
        return report.lostCount > 0
            ? `Nothing sold yet, ${report.lostCount} lost.`
            : "Nothing sold in this period yet.";
    }
    return report.lostCount > 0
        ? `${report.closedCount} sold, ${report.lostCount} lost.`
        : `${plural(report.closedCount, "deal")} sold.`;
}

/**
 * Second clause of the two-tone page headline: what the period means, in one
 * sentence. Prefers a comparison when there is one, otherwise sold / lost.
 * "Up 18% on the 6 months before." / "9 sold, 4 lost."
 */
export function earningsHeadline(report: EarningsReport): string {
    const change = percentChange(report.earnedInr, report.previousEarnedInr);
    if (report.comparison && change != null && report.earnedInr > 0) {
        if (change === 0) return `Same as ${report.comparison.phrase}.`;
        return `${change > 0 ? "Up" : "Down"} ${Math.abs(change)}% on ${report.comparison.phrase}.`;
    }
    return earningsOutcomesLine(report);
}

/**
 * Rotating "Earnings. …" lines for the page header — same pattern as the
 * dashboard. Built from the current report, so changing the date filter
 * rebuilds every line (sold/lost, rupees earned, comparison, win rate, pipeline).
 */
export function earningsHeadlineLines(report: EarningsReport): string[] {
    const lines: string[] = [earningsOutcomesLine(report)];

    if (report.earnedInr > 0) {
        lines.push(`${formatCommission(report.earnedInr)} estimated this period.`);
    } else {
        lines.push("No commission earned in this period yet.");
    }

    const change = percentChange(report.earnedInr, report.previousEarnedInr);
    if (report.comparison) {
        if (change != null && report.earnedInr > 0) {
            lines.push(
                change === 0
                    ? `Same as ${report.comparison.phrase}.`
                    : `${change > 0 ? "Up" : "Down"} ${Math.abs(change)}% on ${report.comparison.phrase}.`,
            );
        } else if (report.earnedInr > 0 && report.previousEarnedInr === 0) {
            lines.push(`Nothing earned in ${report.comparison.phrase}.`);
        }
    }

    if (report.winRate != null) {
        const resolved = report.closedCount + report.lostCount;
        lines.push(
            `Win rate ${report.winRate}% — ${report.closedCount} of ${plural(resolved, "finished deal")} sold.`,
        );
    }

    if (report.live.potentialInr > 0) {
        lines.push(`${formatCommission(report.live.potentialInr)} still in your open deals.`);
    } else if (report.live.count > 0) {
        lines.push(`${plural(report.live.count, "open deal")} with no commission set yet.`);
    }

    if (report.avgDaysToClose != null && report.closedCount > 0) {
        lines.push(
            report.avgDaysToClose === 0
                ? "Same-day closes on average."
                : `Average ${plural(report.avgDaysToClose, "day")} from new client to sold.`,
        );
    }

    return lines;
}

/** "1 Jun – 17 Nov 2026" */
export function formatWindow(window: { from: Date | null; to: Date }): string {
    return formatDateRangeMedium(window.from, window.to);
}

/**
 * When the chart is a shorter slice than the selected totals window, say so.
 * Keeps trust when All time / a long custom range trims older buckets.
 */
export function chartCoverageNote(report: EarningsReport): string | null {
    if (!report.chartTrimmed) return null;
    const chartLabel = formatWindow(report.chartWindow);
    if (report.window.from == null) {
        return `Chart shows ${chartLabel}. Totals above use the full range.`;
    }
    return `Chart shows ${chartLabel}. Totals above use ${formatWindow(report.window)}.`;
}

/** Inclusive day count of a bounded window. */
export function windowDays(window: { from: Date; to: Date }): number {
    return differenceInCalendarDays(window.to, window.from) + 1;
}
