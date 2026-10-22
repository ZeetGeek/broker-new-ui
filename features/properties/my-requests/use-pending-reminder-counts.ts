"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { type RepresentationItem, representativeApi } from "@/lib/api/representative";

import { REMINDER_LIMIT } from "@/features/properties/my-requests/types";

export const PENDING_REMINDER_COUNTS_QUERY_KEY = ["broker-representations", "outbound"] as const;

function remindersSent(row: RepresentationItem): number {
    if (row.reminderCount != null) return row.reminderCount;
    if (row.remindersRemaining != null) {
        return Math.max(0, REMINDER_LIMIT - row.remindersRemaining);
    }
    return 0;
}

/**
 * Reminders already sent on each pending broker request, keyed by property id.
 * Same source as My deals, so browse cards show the real count after a reload.
 */
export function usePendingReminderCounts(): ReadonlyMap<string, number> {
    const query = useQuery({
        queryKey: PENDING_REMINDER_COUNTS_QUERY_KEY,
        queryFn: () => representativeApi.brokerList(),
        staleTime: 30_000,
    });

    return useMemo(() => {
        const byProperty = new Map<string, number>();
        for (const row of query.data ?? []) {
            if (row.status?.toLowerCase() !== "pending") continue;
            if (row.initiatedBy?.toLowerCase() === "owner") continue;
            byProperty.set(row.propertyId, remindersSent(row));
        }
        return byProperty;
    }, [query.data]);
}
