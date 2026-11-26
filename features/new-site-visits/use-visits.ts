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
import { notifyWorkflowSaved, subscribeWorkflowSaved } from "@/lib/workflows/refresh";
import {
    bookVisitForDeal,
    cancelVisitForDeal,
    rescheduleVisitForDeal,
    updateVisitRemindersForDeal,
} from "@/lib/workflows/visit-deal-sync";

import { useAppSelector } from "@/store/hooks";

export const VISITS_KEY = ["broker-visits"] as const;
const PAGE_SIZE = 20;
/** Event the backend pushes whenever a visit is booked, moved, cancelled or marked. */
const VISIT_CHANGED_EVENT = "visit.changed";

export function useVisitList(query: Omit<VisitListQuery, "page" | "limit">) {
    const queryClient = useQueryClient();
    const userId = useAppSelector((state) => state.auth.user?.id);
    const sourceQuery = { ...query, search: undefined };
    return useInfiniteQuery({
        queryKey: [...VISITS_KEY, "list", query],
        queryFn: ({ pageParam, signal }) =>
            siteVisitsApi.list({ ...query, page: pageParam, limit: PAGE_SIZE }, signal, () =>
                queryClient.fetchQuery({
                    queryKey: [...VISITS_KEY, "search-source", userId, sourceQuery],
                    queryFn: ({ signal }) => siteVisitsApi.searchSource(sourceQuery, signal),
                    staleTime: 30_000,
                }),
            ),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
        // Retain header counts and filter options while results show their skeleton.
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
        // Stage changes can also affect which deals are bookable.
        const refresh = () => {
            notifyWorkflowSaved("visit");
        };
        socket.on(VISIT_CHANGED_EVENT, refresh);
        socket.on("connect", refresh);
        return () => {
            socket.off(VISIT_CHANGED_EVENT, refresh);
            socket.off("connect", refresh);
        };
    }, [accessToken, queryClient]);

    useEffect(
        () =>
            subscribeWorkflowSaved((kind) => {
                if (kind === "visit" || kind === "deal")
                    void queryClient.invalidateQueries({
                        predicate: (query) =>
                            query.queryKey[0] === VISITS_KEY[0] &&
                            query.queryKey[1] !== "schedule-intent",
                    });
            }),
        [queryClient],
    );

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
    const settle = () => {
        notifyWorkflowSaved("visit");
        return queryClient.invalidateQueries({
            predicate: (query) =>
                query.queryKey[1] !== "schedule-intent" &&
                /^(broker-visits|workflow-deal|pipeline|property-analytics|broker|dashboard)/.test(
                    String(query.queryKey[0]),
                ),
        });
    };
    return {
        book: useMutation({ mutationFn: bookVisitForDeal, onSettled: settle }),
        reschedule: useMutation({
            mutationFn: (a: { id: string } & Parameters<typeof siteVisitsApi.reschedule>[1]) => {
                const { id, ...body } = a;
                return rescheduleVisitForDeal(id, body);
            },
            onSettled: settle,
        }),
        updateReminders: useMutation({
            mutationFn: (a: { id: string; reminders: number[] }) =>
                updateVisitRemindersForDeal(a.id, a.reminders),
            onSettled: settle,
        }),
        cancel: useMutation({ mutationFn: cancelVisitForDeal, onSettled: settle }),
        setOutcome: useMutation({
            mutationFn: (a: { id: string; status: "completed" | "no_show" }) =>
                siteVisitsApi.setOutcome(a.id, a.status),
            onSettled: settle,
        }),
    };
}
