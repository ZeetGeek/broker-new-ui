"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { propertyAnalyticsApi } from "@/lib/api/property-analytics";
import { plural } from "@/lib/format/plural";
import { BROKER_YOUR_LISTINGS_HREF, brokerPropertyDetailHref } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { AlertCircle, Building2, Clock, Info, Users } from "@/components/shared/icons";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";

import { PREVIEW_PROPERTY_ANALYTICS, USE_MOCK_DATA } from "@/config";
import { AnalyticsClientList } from "@/features/properties/property-analytics/analytics-client-list";
import { agoLabel } from "@/features/properties/property-analytics/analytics-labels";
import { buildPropertyReport } from "@/features/properties/property-analytics/analytics-math";
import { AnalyticsOffers } from "@/features/properties/property-analytics/analytics-offers";
import { AnalyticsOutcome } from "@/features/properties/property-analytics/analytics-outcome";
import { AnalyticsFunnel } from "@/features/properties/property-analytics/analytics-progress";
import { AnalyticsSkeleton } from "@/features/properties/property-analytics/analytics-skeleton";
import { AnalyticsStatStrip } from "@/features/properties/property-analytics/analytics-stat-strip";
import { AnalyticsVisits } from "@/features/properties/property-analytics/analytics-visits";
import { BrokerPropertyAnalytics } from "@/features/properties/property-analytics/broker-property-analytics";
import { PropertyAttention } from "@/features/properties/property-analytics/property-attention";
import type { MyListingItem } from "@/features/properties/your-listings/types";

import styles from "./analytics.module.css";

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
    // The broker-only report is a static design preview until its API is connected.
    if (PREVIEW_PROPERTY_ANALYTICS || USE_MOCK_DATA) {
        return <BrokerPropertyAnalytics propertyId={propertyId} propertyTitle={listing.title} />;
    }
    return <LivePropertyAnalyticsContent propertyId={propertyId} listing={listing} />;
}

function LivePropertyAnalyticsContent({
    propertyId,
    listing,
}: {
    propertyId: string;
    listing: MyListingItem;
}) {
    const query = useQuery({
        queryKey: [
            "property-analytics",
            propertyId,
            PREVIEW_PROPERTY_ANALYTICS ? "preview" : "live",
        ],
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
                            variant="accent"
                        >
                            Go to My Listings
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={() => void query.refetch()}
                            loading={query.isRefetching}
                            variant="accent"
                        >
                            Try again
                        </Button>
                    )}
                </EmptyState>
            </div>
        );
    }

    const propertyTitle = data.property.title?.trim() || "your listing";
    const headlineDetail = [
        report.counts.active > 0 ? `${report.counts.active} active` : null,
        report.counts.won > 0 ? `${report.counts.won} ${report.closedWord.toLowerCase()}` : null,
        report.counts.lost > 0 ? `${report.counts.lost} lost` : null,
    ]
        .filter(Boolean)
        .join(" / ");

    return (
        <div className={styles.report}>
            {PREVIEW_PROPERTY_ANALYTICS ? (
                <p
                    role="status"
                    className="body-sm flex items-start gap-2 rounded-inner bg-brand-soft px-4 py-3 text-brand-text"
                >
                    <Info aria-hidden className="mbs-0.5 shrink-0 block-4 inline-4" />
                    <span>
                        <strong className="font-semibold">Sample data.</strong> 40 demo clients for
                        reviewing analytics. Contact and deal actions are disabled; your saved
                        records are unchanged.
                    </span>
                </p>
            ) : null}
            {report.counts.total === 0 ? (
                <>
                    <PropertyAttention propertyId={propertyId} />
                    <EmptyState
                        icon={Users}
                        heading="No clients on this listing yet"
                        description="Attach clients from the listing page. Their visits, offers and progress show up here."
                        className={CARD_CLASS}
                    >
                        <Button
                            nativeButton={false}
                            render={<Link href={brokerPropertyDetailHref(data.property.id)} />}
                            variant="accent"
                        >
                            Attach clients
                        </Button>
                    </EmptyState>
                </>
            ) : (
                <>
                    <header className={styles.heading}>
                        <div className="flex flex-col gap-1.5 min-inline-0">
                            <h2 className="h3 text-ink">Property performance</h2>
                            <p className="body-sm wrap-anywhere text-ink-muted">{propertyTitle}</p>
                        </div>
                        <div className={styles.metadata}>
                            {report.daysListed != null ? (
                                <span className="body-sm">
                                    <Clock aria-hidden className="block-4 inline-4" />
                                    {plural(report.daysListed, "day")} on the market
                                </span>
                            ) : null}
                            {report.lastUpdateAt ? (
                                <span className="body-sm">
                                    <Info aria-hidden className="block-4 inline-4" />
                                    Updated {agoLabel(report.lastUpdateAt, now)}
                                </span>
                            ) : null}
                        </div>
                    </header>
                    <div className={styles.workspace}>
                        <div className={styles.main}>
                            <AnalyticsStatStrip
                                report={report}
                                now={now}
                                clientDetail={headlineDetail}
                            />
                            <PropertyAttention propertyId={propertyId} />
                            <AnalyticsFunnel report={report} className={styles.journey} />
                            <AnalyticsVisits report={report} now={now} className={styles.visits} />
                            <AnalyticsClientList
                                report={report}
                                propertyTitle={propertyTitle}
                                now={now}
                                className={styles.clients}
                            />
                        </div>
                        <div className={styles.aside}>
                            <AnalyticsOutcome report={report} listing={listing} />
                            <AnalyticsOffers report={report} className={styles.offers} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
