import { istDateKey } from "@/lib/visits/time";

import type { EarningsBucket, EarningsSelection } from "@/features/earnings/earnings-math";

export type CommissionMonths = 3 | 6 | 12;

/** How far back the dashboard chart can page. */
export const COMMISSION_HISTORY_MONTHS = 24;
export const DASHBOARD_DEFAULT_MONTHS: CommissionMonths = 6;

/** Last page index for a window size: 3 → 7, 6 → 3, 12 → 1. */
export function maxCommissionPage(months: CommissionMonths): number {
    return COMMISSION_HISTORY_MONTHS / months - 1;
}

/**
 * A run of whole months ending `page` windows before the current India-time
 * month. The current month's bar is marked to-date by the API. Dates are
 * calendar days in local time, the convention the Earnings page uses, so both
 * pages ask for the same window.
 */
export function commissionSelection(
    months: CommissionMonths,
    page: number,
    now: Date,
): EarningsSelection {
    const [year, month] = istDateKey(now).split("-").map(Number) as [number, number];
    const lastMonth = month - 1 - months * page;
    const customFrom = new Date(year, lastMonth - months + 1, 1);
    // Always the whole last month, even mid-month: a window of 62 days or fewer
    // makes the API bucket by week, and the dashboard chart is monthly.
    const customTo = new Date(year, lastMonth + 1, 0);
    return { preset: "custom", customFrom, customTo };
}

export type CommissionMonth = {
    /** `YYYY-MM`, the India-time month the bar covers. */
    monthKey: string;
    sale: number;
    rent: number;
    total: number;
    deals: number;
    isToDate: boolean;
};

/** Monthly report buckets as chart rows. */
export function commissionMonths(buckets: readonly EarningsBucket[]): CommissionMonth[] {
    return buckets.map((bucket) => ({
        monthKey: istDateKey(bucket.key).slice(0, 7),
        sale: bucket.saleInr,
        rent: bucket.rentInr,
        total: bucket.totalInr,
        deals: bucket.closed,
        isToDate: bucket.isToDate,
    }));
}

/** "5 deals closed"; never a bare 0. */
export function closedDealsLabel(deals: number): string {
    if (deals === 0) return "No deals closed yet";
    return `${deals} ${deals === 1 ? "deal" : "deals"} closed`;
}
