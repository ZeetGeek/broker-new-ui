import { Suspense } from "react";
import type { Metadata } from "next";

import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { getInitialBrokerVisits } from "@/lib/api/broker-visits-server";
import { slotListFiltersFromParams } from "@/lib/visits/filters";
import { USE_MOCK_VISITS } from "@/mocks/visits";

import { BrokerSiteVisitsPage } from "@/features/site-visits/broker/broker-site-visits-page";
import { VisitsPageSkeleton } from "@/features/site-visits/broker/visits-page-skeleton";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const values = await searchParams;
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) =>
        Array.isArray(value)
            ? value.forEach((item) => params.append(key, item))
            : value
              ? params.set(key, value)
              : undefined,
    );
    const visitFilters = {};
    const slotFilters = slotListFiltersFromParams(params);
    const queryClient = new QueryClient();

    // Only seed React Query in mock mode. Live mode must leave queries unset so
    // the browser session actually hits /slots — hydrating [] + staleTime skips fetch.
    if (USE_MOCK_VISITS) {
        try {
            const initial = await getInitialBrokerVisits(visitFilters, slotFilters);
            queryClient.setQueryData(["visits", visitFilters], initial.visits);
            queryClient.setQueryData(["slots", slotFilters], initial.slots);
            queryClient.setQueryData(["timeRequests", "all"], initial.requests);
            queryClient.setQueryData(["visitSummary"], initial.summary);
        } catch {
            // Client retries with the authenticated browser session.
        }
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<VisitsPageSkeleton />}>
                <BrokerSiteVisitsPage />
            </Suspense>
        </HydrationBoundary>
    );
}
