"use client";

import { useQuery } from "@tanstack/react-query";

import { brokerVisitsApi } from "@/lib/api/broker-visits";

export function useVisitSummary() {
    return useQuery({
        queryKey: ["visitSummary"],
        queryFn: () => brokerVisitsApi.summary(),
        staleTime: 60_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    });
}
