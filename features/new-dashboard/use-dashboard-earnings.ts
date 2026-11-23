"use client";

import { useQuery } from "@tanstack/react-query";

import { earningsReportQueryOptions } from "@/lib/api/earnings";

import { useAppSelector } from "@/store/hooks";

import { type CommissionMonths, commissionSelection } from "./commission-window";

/**
 * The earnings report behind the commission chart, the pipeline card and the
 * header's active-deal count. The default window is shared by all three, so it
 * is fetched once.
 */
export function useDashboardEarnings(months: CommissionMonths, page: number, now: Date | null) {
    const hydrated = useAppSelector((state) => state.auth.hydrated);
    // Before the clock is read the query stays off; any date gives a valid key.
    const at = now ?? new Date(0);
    return useQuery({
        ...earningsReportQueryOptions(commissionSelection(months, page, at), at),
        enabled: hydrated && now !== null,
    });
}
