"use client";

import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";

import { brokerVisitsApi } from "@/lib/api/broker-visits";

import type { SlotListFilters } from "@/features/site-visits/broker/model";

export function slotsQueryOptions(
    active: boolean,
    filters: SlotListFilters,
    source: "platform" | "exclusive" = "platform",
) {
    return infiniteQueryOptions({
        queryKey: ["slots", source, filters],
        queryFn: ({ pageParam }) =>
            source === "exclusive"
                ? brokerVisitsApi.exclusiveSlots({ ...filters, page: pageParam })
                : brokerVisitsApi.slots({ ...filters, page: pageParam }),
        enabled: active,
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
        staleTime: 30_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: () =>
            active && typeof document !== "undefined" && document.visibilityState === "visible"
                ? 60_000
                : false,
    });
}

export function useSlots(
    active: boolean,
    filters: SlotListFilters,
    source: "platform" | "exclusive" = "platform",
) {
    return useInfiniteQuery(slotsQueryOptions(active, filters, source));
}
