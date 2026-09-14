import { Suspense } from "react";
import type { Metadata } from "next";

import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { getInitialBrokerVisits } from "@/lib/api/broker-visits-server";
import { slotListFiltersFromParams } from "@/lib/visits/filters";

import { BrokerSiteVisitsPage } from "@/features/site-visits/broker/broker-site-visits-page";
import { VisitsPageSkeleton } from "@/features/site-visits/broker/visits-page-skeleton";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const values = await searchParams;
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => Array.isArray(value) ? value.forEach((item) => params.append(key, item)) : value ? params.set(key, value) : undefined);
    const visitFilters = {};
    const slotFilters = slotListFiltersFromParams(params);
    const queryClient = new QueryClient();
    try {
        const initial = await getInitialBrokerVisits(visitFilters, slotFilters);
        queryClient.setQueryData(["visits", visitFilters], initial.visits);
        queryClient.setQueryData(["slots", slotFilters], initial.slots);
        queryClient.setQueryData(["timeRequests", "all"], initial.requests);
        queryClient.setQueryData(["visitSummary"], initial.summary);
    } catch {
        // The client queries retry with the authenticated browser session.
    }
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<VisitsPageSkeleton />}>
                <BrokerSiteVisitsPage />
            </Suspense>
        </HydrationBoundary>
    );
}
