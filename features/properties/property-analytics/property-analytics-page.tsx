"use client";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { type PropertyAnalytics, propertyAnalyticsApi } from "@/lib/api/property-analytics";
import { useParams } from "@/lib/navigation";
import { BROKER_YOUR_LISTINGS_HREF, brokerPropertyDetailHref } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { ArrowLeft, ChartBar, MapPin } from "@/components/shared/icons";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { Skeleton } from "@/components/shared/skeleton";
import { Button } from "@/components/ui/button";

import { amountLabel, listingAsk } from "./format";
import { LeadList } from "./lead-list";
import { LeadStageBar, LeadStageLegend } from "./stage-bar";

const CARD_CLASS = "rounded-card border border-border-warm bg-surface shadow-sm";

function count(value: number, one: string, many: string): string {
    return `${value} ${value === 1 ? one : many}`;
}

function headlineSummary(summary: PropertyAnalytics["summary"]): string {
    if (summary.totalLeads === 0) return "No leads yet.";
    const visits =
        summary.showings > 0 ? count(summary.showings, "visit", "visits") : "no visits yet";
    const offers =
        summary.closedWon > 0
            ? `${summary.closedWon} sold`
            : summary.pendingOffers > 0
              ? `${count(summary.pendingOffers, "offer", "offers")} pending`
              : "no offers yet";
    return `${count(summary.totalLeads, "lead", "leads")}, ${visits}, ${offers}.`;
}

function withFullStop(text: string): string {
    const trimmed = text.trim().replace(/[.\s]+$/, "");
    return `${trimmed}.`;
}

export function PropertyAnalyticsPage() {
    const params = useParams<{ id: string }>();
    const propertyId = params.id;

    const query = useQuery({
        queryKey: ["property-analytics", propertyId],
        queryFn: ({ signal }) => propertyAnalyticsApi.property(propertyId, signal),
        enabled: Boolean(propertyId),
    });

    const data = query.data?.summary ? query.data : null;

    return (
        <div className="flex flex-col gap-6 pbe-24 md:gap-8 md:pbe-10">
            <Button
                variant="link"
                size="md"
                className="self-start px-0 text-ink-muted hover:text-ink"
                render={<Link href={BROKER_YOUR_LISTINGS_HREF} />}
            >
                <ArrowLeft aria-hidden />
                Back to My Listings
            </Button>

            {query.isPending ? (
                <AnalyticsSkeleton />
            ) : query.isError || !data ? (
                <div role="alert" className={`${CARD_CLASS} flex flex-col items-start gap-4 p-5`}>
                    <div className="flex flex-col gap-1">
                        <h1 className="h5 text-ink">
                            Couldn&apos;t load this listing&apos;s leads
                        </h1>
                        <p className="body-sm text-ink-muted">
                            Check your connection and try again.
                        </p>
                    </div>
                    <Button variant="outline" size="md" onClick={() => void query.refetch()}>
                        Try again
                    </Button>
                </div>
            ) : (
                <AnalyticsBody data={data} />
            )}
        </div>
    );
}

function AnalyticsBody({ data }: { data: PropertyAnalytics }) {
    const { property, summary, byStage, leads } = data;
    const ask = listingAsk(property);
    const place = [property.address, property.city].filter(Boolean).join(", ");
    const wonAmount = amountLabel(summary.closedWonAmount);

    const metrics = [
        {
            label: "Open leads",
            value: summary.openLeads,
            hint: summary.totalLeads > 0 ? `of ${summary.totalLeads}` : null,
        },
        { label: "Visits", value: summary.showings, hint: null },
        { label: "Offers pending", value: summary.pendingOffers, hint: null },
        { label: "Sold", value: summary.closedWon, hint: wonAmount },
    ];

    return (
        <>
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-2 min-inline-0">
                    <h1 className="h3">
                        <span className="text-ink">
                            {withFullStop(property.title?.trim() || "Untitled listing")}
                        </span>{" "}
                        <span className="text-ink-muted">{headlineSummary(summary)}</span>
                    </h1>
                    <div
                        className="
                          body-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-muted
                        "
                    >
                        {place ? (
                            <span className="flex items-center gap-1 min-inline-0">
                                <MapPin
                                    aria-hidden
                                    className="shrink-0 block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                <span className="truncate capitalize">{place}</span>
                            </span>
                        ) : null}
                        {ask ? (
                            <PriceWithCommission
                                amountInr={ask.amountInr}
                                isRent={ask.isRent}
                                audience="broker"
                                size="sm"
                                showEmptyTip={false}
                            />
                        ) : null}
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="md"
                    className="self-start sm:self-auto"
                    render={<Link href={brokerPropertyDetailHref(property.id)} />}
                >
                    View listing
                </Button>
            </header>

            <section
                aria-labelledby="analytics-overview"
                className={`${CARD_CLASS}
              flex flex-col gap-5 p-4
              md:p-5
            `}
            >
                <h2 id="analytics-overview" className="sr-only">
                    Overview
                </h2>
                <dl
                    className="
                      grid grid-cols-2 gap-px overflow-hidden rounded-inner bg-border-warm
                      sm:grid-cols-4
                    "
                >
                    {metrics.map((metric) => (
                        <div
                            key={metric.label}
                            className="flex flex-col gap-1 bg-surface-muted px-4 py-3"
                        >
                            <dt className="body-xs text-ink-muted">{metric.label}</dt>
                            <dd className="flex flex-wrap items-baseline gap-x-1.5">
                                {metric.value > 0 ? (
                                    <span className="h4 text-ink tabular-nums">{metric.value}</span>
                                ) : (
                                    <span className="h4 text-ink-subtle">None</span>
                                )}
                                {metric.hint && metric.value > 0 ? (
                                    <span className="body-sm text-ink-muted tabular-nums">
                                        {metric.hint}
                                    </span>
                                ) : null}
                            </dd>
                        </div>
                    ))}
                </dl>

                {summary.totalLeads > 0 ? (
                    <div className="flex flex-col gap-3">
                        <h3 className="body-sm font-semibold text-ink">Where your leads are</h3>
                        <LeadStageBar counts={byStage} />
                        <LeadStageLegend counts={byStage} />
                    </div>
                ) : null}
            </section>

            <section aria-labelledby="analytics-leads" className="flex flex-col gap-3">
                <h2 id="analytics-leads" className="h5 text-ink">
                    Leads
                    {leads.length > 0 ? (
                        <span className="text-ink-muted tabular-nums"> {leads.length}</span>
                    ) : null}
                </h2>
                {leads.length === 0 ? (
                    <EmptyState
                        icon={ChartBar}
                        heading="No leads on this listing yet"
                        description="Add a client to this listing from My Listings. Their progress shows up here."
                    >
                        <Button
                            variant="outline"
                            size="md"
                            render={<Link href={BROKER_YOUR_LISTINGS_HREF} />}
                        >
                            Go to My Listings
                        </Button>
                    </EmptyState>
                ) : (
                    <LeadList leads={leads} />
                )}
            </section>
        </>
    );
}

function AnalyticsSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Loading this listing's leads"
            className="flex flex-col gap-6 md:gap-8"
        >
            <div className="flex flex-col gap-2">
                <Skeleton className="block-8 inline-full max-inline-lg" />
                <Skeleton className="block-4 inline-48" />
            </div>
            <div className={`${CARD_CLASS} flex flex-col gap-5 p-4 md:p-5`}>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-inner sm:grid-cols-4">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} className="rounded-none block-16" />
                    ))}
                </div>
                <Skeleton className="rounded-full block-3" />
            </div>
            <div className={`${CARD_CLASS} divide-y divide-border-warm`}>
                {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="flex flex-col gap-2 p-4 md:p-5">
                        <Skeleton className="block-5 inline-40" />
                        <Skeleton className="block-4 inline-64" />
                    </div>
                ))}
            </div>
        </div>
    );
}
