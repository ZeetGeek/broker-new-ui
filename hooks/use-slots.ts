"use client";

import { useQuery } from "@tanstack/react-query";

import { brokerVisitsApi } from "@/lib/api/broker-visits";

import type { SlotListFilters } from "@/features/site-visits/broker/model";

export function useSlots(active: boolean, filters: SlotListFilters) {
    return useQuery({
        queryKey: ["slots", filters],
        queryFn: () => brokerVisitsApi.slots(filters),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        refetchInterval: () => active && typeof document !== "undefined" && document.visibilityState === "visible" ? 60_000 : false,
    });
}

