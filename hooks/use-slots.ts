"use client";

import { useQuery } from "@tanstack/react-query";

import { brokerVisitsApi } from "@/lib/api/broker-visits";

import { MOCK_PROPERTIES_WITH_SLOTS } from "@/mocks/visits";

export function useSlots(active: boolean, filterKey: string) {
    return useQuery({
        queryKey: ["slots", filterKey],
        queryFn: () => brokerVisitsApi.slots(),
        initialData: () => structuredClone(MOCK_PROPERTIES_WITH_SLOTS),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        refetchInterval: () => active && typeof document !== "undefined" && document.visibilityState === "visible" ? 60_000 : false,
    });
}

