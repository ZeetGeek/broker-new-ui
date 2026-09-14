"use client";

import { useQuery } from "@tanstack/react-query";

import { brokerVisitsApi } from "@/lib/api/broker-visits";

import type { VisitListFilters } from "@/features/site-visits/broker/model";

export function useSiteVisits(filters: VisitListFilters = {}) {
    return useQuery({
        queryKey: ["visits", filters],
        queryFn: () => brokerVisitsApi.list(filters),
        staleTime: 60_000,
        refetchOnWindowFocus: true,
    });
}

