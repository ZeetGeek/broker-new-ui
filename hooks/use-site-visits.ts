"use client";

import { useQuery } from "@tanstack/react-query";

import { brokerVisitsApi } from "@/lib/api/broker-visits";

import { MOCK_SITE_VISITS } from "@/mocks/visits";

export function useSiteVisits() {
    return useQuery({
        queryKey: ["visits", { scope: "broker" }],
        queryFn: () => brokerVisitsApi.list(),
        initialData: () => structuredClone(MOCK_SITE_VISITS),
        staleTime: 60_000,
        refetchOnWindowFocus: true,
    });
}

