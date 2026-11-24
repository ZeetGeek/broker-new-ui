"use client";

import { useQuery } from "@tanstack/react-query";

import { siteVisitsApi } from "@/lib/api/site-visits";

import { visitDateBounds } from "@/features/new-site-visits/model";
import { useVisitsLive, VISITS_KEY } from "@/features/new-site-visits/use-visits";
import { useAppSelector } from "@/store/hooks";

/**
 * The three visit lists the dashboard reads:
 * - `today`: today's visits not yet marked or cancelled (India-time day)
 * - `needsUpdate`: every unmarked past visit, any day (matches the Visits tab)
 * - `next`: the earliest upcoming visit, any day
 */
export function useDashboardVisits(now: Date | null) {
    const hydrated = useAppSelector((state) => state.auth.hydrated);
    // The dashboard and Visits page use the same date-filtered source, including test samples.
    const enabled = hydrated && now !== null;
    const today = now ? visitDateBounds("today", now.getTime()) : { from: "", to: "" };
    const base = [...VISITS_KEY, "list", "dashboard"] as const;

    const todayQuery = useQuery({
        queryKey: [...base, "today", today.from],
        queryFn: ({ signal }) =>
            // Read every page so earlier unmarked visits cannot hide later appointments.
            siteVisitsApi.searchSource({ tab: "active", ...today, sort: "start_asc" }, signal),
        enabled,
        refetchInterval: 30_000,
    });
    const needsUpdate = useQuery({
        queryKey: [...base, "needs-update"],
        queryFn: ({ signal }) =>
            siteVisitsApi.list({ tab: "needs_update", sort: "start_desc", limit: 20 }, signal),
        enabled,
    });
    const next = useQuery({
        queryKey: [...base, "next"],
        queryFn: ({ signal }) =>
            siteVisitsApi.list({ tab: "upcoming", sort: "start_asc", limit: 1 }, signal),
        enabled,
    });
    useVisitsLive(todayQuery.data?.nextChangeAt ?? null, todayQuery.dataUpdatedAt);

    return { today: todayQuery, needsUpdate, next };
}
