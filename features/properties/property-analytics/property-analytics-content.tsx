"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { propertyAnalyticsApi } from "@/lib/api/property-analytics";
import { formatShowingWhen } from "@/lib/format/date";
import { plural } from "@/lib/format/plural";
import { BROKER_YOUR_LISTINGS_HREF, brokerPropertyDetailHref } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { AlertCircle, Building2, Info, Users } from "@/components/shared/icons";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";

import { AnalyticsAttention } from "@/features/properties/property-analytics/analytics-attention";
import { AnalyticsClientList } from "@/features/properties/property-analytics/analytics-client-list";
import { agoLabel } from "@/features/properties/property-analytics/analytics-labels";
import { buildPropertyReport } from "@/features/properties/property-analytics/analytics-math";
import { AnalyticsOffers } from "@/features/properties/property-analytics/analytics-offers";
import { AnalyticsOutcome } from "@/features/properties/property-analytics/analytics-outcome";
import {
    AnalyticsFunnel,
    AnalyticsStages,
} from "@/features/properties/property-analytics/analytics-progress";
import { AnalyticsSkeleton } from "@/features/properties/property-analytics/analytics-skeleton";
import { AnalyticsStatStrip } from "@/features/properties/property-analytics/analytics-stat-strip";
import { AnalyticsVisits } from "@/features/properties/property-analytics/analytics-visits";
import type { MyListingItem } from "@/features/properties/your-listings/types";

const CARD_CLASS = "rounded-card bg-surface p-4 shadow-sm ring-1 ring-border-warm/50 sm:p-5";

/**
 * One listing's clients, visits and offers, from `GET /properties/:id/analytics`.
 *
 * Phone order is priority order: what to act on, then the offers, then how
 * the listing converts, then every client.
 */
export function PropertyAnalyticsContent({
    propertyId,
    listing,
}: {
    propertyId: string;
    listing: MyListingItem;
}) {
    const query = useQuery({
        queryKey: ["property-analytics", propertyId],
        queryFn: ({ signal }) => propertyAnalyticsApi.property(propertyId, signal),
        enabled: Boolean(propertyId),
        // Arriving from a card should show a visit or offer logged a moment ago.
        staleTime: 0,
    });

    const apiData = query.data?.property && query.data.summary ? query.data : null;
    // The detail response is already on screen and is the source of truth for
    // listing facts. Analytics contributes the client activity around it.
    const data = useMemo(
        () =>
            apiData
                ? {
                      ...apiData,
                      property: {
                          ...apiData.property,
                          id: listing.id,
                          title: listing.title,
                          city: listing.city,
                          address: listing.address,
                          status: listing.isSold ? "sold" : "available",
                          publishStatus: listing.status,
                          transactionType: listing.transactionType,
                          salePrice:
                              listing.saleAmountInr == null ? null : String(listing.saleAmountInr),
                          monthlyRent:
                              listing.rentAmountInr == null ? null : String(listing.rentAmountInr),
                          photo: listing.imageSrc || apiData.property.photo,
                          createdAt: listing.createdAt,
                          soldAt: listing.soldAt ?? null,
                      },
                  }
                : null,
        [apiData, listing],
    );
    // "Now" is when the data was fetched, so upcoming / overdue agree with it.
    const fetchedAt = query.dataUpdatedAt;
    const now = useMemo(() => new Date(fetchedAt), [fetchedAt]);
    const report = useMemo(() => (data ? buildPropertyReport(data, now) : null), [data, now]);

    if (query.isPending) return <AnalyticsSkeleton />;

    if (!data || !report) {
        const notFound = query.error instanceof ApiError && query.error.status === 404;
        return (
            <div className="flex flex-col gap-6 pbe-6">
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
    const headlineDetail =
        report.counts.won > 0
            ? `${report.counts.won} ${report.closedWord.toLowerCase()} and ${report.counts.active} still active.`
            : report.counts.active > 0
              ? `${report.counts.active} active and ${report.counts.lost} lost.`
              : "Every client has reached an outcome.";
    const context = [
        report.lastUpdateAt ? `Last client update ${agoLabel(report.lastUpdateAt, now)}` : null,
        report.daysListed != null ? `${plural(report.daysListed, "day")} on the market` : null,
        report.visits.nextAt ? `Next visit ${formatShowingWhen(report.visits.nextAt, now)}` : null,
    ].filter((value): value is string => Boolean(value));

    return (
        <div className="flex flex-col gap-card-grid pbe-6">
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
                    <header className="flex flex-col gap-2 pbe-1">
                        <h2 className="h3 flex flex-wrap items-baseline gap-x-1.5 text-ink">
                            <span>{plural(report.counts.total, "client")}.</span>
                            <span className="text-ink-muted">{headlineDetail}</span>
                        </h2>
                        {context.length > 0 ? (
                            <p className="body-sm flex items-start gap-1.5 text-ink-muted">
                                <Info aria-hidden className="mbs-0.5 shrink-0 block-4 inline-4" />
                                <span>{context.join(" · ")}</span>
                            </p>
                        ) : null}
                    </header>

                    <AnalyticsStatStrip report={report} now={now} />

                    <div className="grid grid-cols-1 gap-card-grid md:grid-cols-2 lg:grid-cols-12">
                        <AnalyticsAttention
                            report={report}
                            now={now}
                            className="order-1 md:col-span-2 lg:order-3 lg:col-span-7"
                        />
                        <AnalyticsVisits
                            report={report}
                            now={now}
                            className="order-2 lg:order-4 lg:col-span-5"
                        />
                        <AnalyticsOutcome
                            report={report}
                            listing={listing}
                            className="order-3 lg:order-1 lg:col-span-4"
                        />
                        <AnalyticsFunnel
                            report={report}
                            className="order-4 md:col-span-2 lg:order-2 lg:col-span-8"
                        />
                        <AnalyticsOffers
                            report={report}
                            className="order-5 md:col-span-2 lg:col-span-7"
                        />
                        <AnalyticsStages
                            report={report}
                            className="order-6 md:col-span-2 lg:col-span-5"
                        />
                    </div>

                    <AnalyticsClientList report={report} propertyTitle={propertyTitle} now={now} />
                </>
            )}
        </div>
    );
}
