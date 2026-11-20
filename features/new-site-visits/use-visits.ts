"use client";

import { useEffect } from "react";

import {
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { isMockMode } from "@/lib/api/mock-mode";
import { siteVisitsApi, type VisitListQuery } from "@/lib/api/site-visits";
import { getNotificationSocket } from "@/lib/socket/notifications";
import { msUntil } from "@/lib/visits/next-change";

import { useAppSelector } from "@/store/hooks";

export const VISITS_KEY = ["broker-visits"] as const;
const PAGE_SIZE = 20;
/** Event the backend pushes whenever a visit is booked, moved, cancelled or marked. */
const VISIT_CHANGED_EVENT = "visit.changed";

export function useVisitList(query: Omit<VisitListQuery, "page" | "limit">) {
    return useInfiniteQuery({
        queryKey: [...VISITS_KEY, "list", query],
        queryFn: ({ pageParam }) =>
            siteVisitsApi.list({ ...query, page: pageParam, limit: PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
        // Filter changes dim the list instead of wiping it.
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: true,
    });
}

/** Deals the broker can book a visit for. */
export function useBookableLeads() {
    return useQuery({
        queryKey: [...VISITS_KEY, "bookable"],
        queryFn: () => siteVisitsApi.bookable(),
    });
}

export function useFreeTimes(args: Parameters<typeof siteVisitsApi.freeTimes>[0] | null) {
    return useQuery({
        queryKey: [...VISITS_KEY, "free-times", args],
        queryFn: () => siteVisitsApi.freeTimes(args!),
        enabled: args !== null,
    });
}

/**
 * Keep Visits current without a refresh: refetch when the backend pushes
 * `visit.changed`, when the socket reconnects (events missed while the phone
 * slept), and at `nextChangeAt` so a visit moves Upcoming → Running on time.
 */
export function useVisitsLive(nextChangeAt: string | null, dataUpdatedAt: number) {
    const queryClient = useQueryClient();
    const accessToken = useAppSelector((state) => state.auth.accessToken);

    useEffect(() => {
        if (!accessToken || isMockMode()) return;
        const socket = getNotificationSocket(accessToken);
        // A visit changed: the lists and free times may be stale; the bookable
        // deals are not, so leave those alone.
        const refresh = () => {
            void queryClient.invalidateQueries({ queryKey: [...VISITS_KEY, "list"] });
            void queryClient.invalidateQueries({ queryKey: [...VISITS_KEY, "free-times"] });
        };
        socket.on(VISIT_CHANGED_EVENT, refresh);
        socket.on("connect", refresh);
        return () => {
            socket.off(VISIT_CHANGED_EVENT, refresh);
            socket.off("connect", refresh);
        };
    }, [accessToken, queryClient]);

    useEffect(() => {
        const delay = msUntil(nextChangeAt, Date.now());
        if (delay === null) return;
        const timer = window.setTimeout(() => {
            void queryClient.invalidateQueries({ queryKey: [...VISITS_KEY, "list"] });
        }, delay);
        return () => window.clearTimeout(timer);
        // Re-arm after every response: if this phone's clock runs ahead, the
        // server may still report the same moment, and we must ask again.
    }, [nextChangeAt, dataUpdatedAt, queryClient]);
}

export function useVisitMutations() {
    const queryClient = useQueryClient();
    const settle = () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: [...VISITS_KEY, "list"] }),
            queryClient.invalidateQueries({ queryKey: [...VISITS_KEY, "free-times"] }),
        ]);
    return {
        book: useMutation({ mutationFn: siteVisitsApi.book, onSettled: settle }),
        reschedule: useMutation({
            mutationFn: (a: { id: string } & Parameters<typeof siteVisitsApi.reschedule>[1]) => {
                const { id, ...body } = a;
                return siteVisitsApi.reschedule(id, body);
            },
            onSettled: settle,
        }),
        updateReminders: useMutation({
            mutationFn: (a: { id: string; reminders: number[] }) =>
                siteVisitsApi.updateReminders(a.id, a.reminders),
            onSettled: settle,
        }),
        cancel: useMutation({ mutationFn: siteVisitsApi.cancel, onSettled: settle }),
        setOutcome: useMutation({
            mutationFn: (a: { id: string; status: "completed" | "no_show" }) =>
                siteVisitsApi.setOutcome(a.id, a.status),
            onSettled: settle,
        }),
    };
}
