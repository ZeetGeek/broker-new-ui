"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { brokerVisitsApi } from "@/lib/api/broker-visits";

import type { SlotListFilters } from "@/features/site-visits/broker/model";

export function useSlots(active: boolean, filters: SlotListFilters) {
    return useInfiniteQuery({
        queryKey: ["slots", filters],
        queryFn: () => brokerVisitsApi.slots(filters),
        initialPageParam: 1,
        getNextPageParam: () => undefined,
        staleTime: 30_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: () =>
            active && typeof document !== "undefined" && document.visibilityState === "visible"
                ? 60_000
                : false,
    });
}
