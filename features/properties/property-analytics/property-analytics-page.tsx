"use client";

import { useMemo } from "react";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { propertyAnalyticsApi } from "@/lib/api/property-analytics";
import { useParams } from "@/lib/navigation";
import { BROKER_YOUR_LISTINGS_HREF, brokerPropertyDetailHref } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { AlertCircle, Building2, Users } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { AnalyticsAttention } from "@/features/properties/property-analytics/analytics-attention";
import { AnalyticsClientList } from "@/features/properties/property-analytics/analytics-client-list";
import { AnalyticsHeader } from "@/features/properties/property-analytics/analytics-header";
import { buildPropertyReport } from "@/features/properties/property-analytics/analytics-math";
import { AnalyticsOffers } from "@/features/properties/property-analytics/analytics-offers";
import {
    AnalyticsFunnel,
    AnalyticsStages,
} from "@/features/properties/property-analytics/analytics-progress";
import { AnalyticsSkeleton } from "@/features/properties/property-analytics/analytics-skeleton";
import { AnalyticsStatStrip } from "@/features/properties/property-analytics/analytics-stat-strip";

const CARD_CLASS = "rounded-card bg-surface p-4 shadow-sm ring-1 ring-border-warm/50 sm:p-5";

/**
 * One listing's clients, visits and offers, from `GET /properties/:id/analytics`.
 *
 * Phone order is priority order: what to act on, then the offers, then how
 * the listing converts, then every client.
 */
export function PropertyAnalyticsPage() {
    const params = useParams<{ id: string }>();
    const propertyId = params.id;

    const query = useQuery({
        queryKey: ["property-analytics", propertyId],
        queryFn: ({ signal }) => propertyAnalyticsApi.property(propertyId, signal),
        enabled: Boolean(propertyId),
        // Arriving from a card should show a visit or offer logged a moment ago.
        staleTime: 0,
    });

    const data = query.data?.property && query.data.summary ? query.data : null;
    // "Now" is when the data was fetched, so upcoming / overdue agree with it.
    const fetchedAt = query.dataUpdatedAt;
    const now = useMemo(() => new Date(fetchedAt), [fetchedAt]);
    const report = useMemo(() => (data ? buildPropertyReport(data, now) : null), [data, now]);

    if (query.isPending) return <AnalyticsSkeleton />;

    if (!data || !report) {
        const notFound = query.error instanceof ApiError && query.error.status === 404;
        return (
            <div className="flex flex-col gap-6 pbe-6">
                <h1 className="h3 text-ink">Listing analytics</h1>
                <EmptyState
                    icon={notFound ? Building2 : AlertCircle}
                    heading={
                        notFound
                            ? "This listing is not in your listings"
                            : "Couldn’t load this listing"
                    }
                    description={
                        notFound
                            ? "It may have been deleted, or it is handled by someone else on your team."
                            : "Check your internet connection and try again."
                    }
                    className={CARD_CLASS}
                >
                    {notFound ? (
                        <Button
                            nativeButton={false}
                            render={<Link href={BROKER_YOUR_LISTINGS_HREF} />}
                        >
                            Go to My Listings
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={() => void query.refetch()}
                            loading={query.isRefetching}
                        >
                            Try again
                        </Button>
                    )}
                </EmptyState>
            </div>
        );
    }

    const propertyTitle = data.property.title?.trim() || "your listing";

    return (
        <div className="flex flex-col gap-5 pbe-6 sm:gap-6">
            <AnalyticsHeader property={data.property} report={report} now={now} />

            {report.counts.total === 0 ? (
                <EmptyState
                    icon={Users}
                    heading="No clients on this listing yet"
                    description="Attach clients from the listing page. Their visits, offers and progress show up here."
                    className={CARD_CLASS}
                >
                    <Button
                        nativeButton={false}
                        render={<Link href={brokerPropertyDetailHref(data.property.id)} />}
                    >
                        Attach clients
                    </Button>
                </EmptyState>
            ) : (
                <>
                    <AnalyticsStatStrip report={report} now={now} />

                    {/* Phone and tablet: attention, offers, then the two progress cards.
                        Desktop: attention beside the funnel, offers beside the stages. */}
                    <div className="grid grid-cols-1 gap-card-grid md:grid-cols-2 lg:grid-cols-12">
                        <AnalyticsAttention
                            report={report}
                            now={now}
                            className="md:col-span-2 lg:order-1 lg:col-span-7"
                        />
                        <AnalyticsOffers
                            report={report}
                            className="md:col-span-2 lg:order-3 lg:col-span-7"
                        />
                        <AnalyticsFunnel report={report} className="lg:order-2 lg:col-span-5" />
                        <AnalyticsStages report={report} className="lg:order-4 lg:col-span-5" />
                    </div>

                    <AnalyticsClientList report={report} propertyTitle={propertyTitle} now={now} />
                </>
            )}
        </div>
    );
}
