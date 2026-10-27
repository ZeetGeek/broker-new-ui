"use client";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import type { PropertyAnalyticsLead } from "@/lib/api/property-analytics";
import { propertyAnalyticsApi } from "@/lib/api/property-analytics";
import { formatDateShort, formatRelativePast } from "@/lib/format/date";
import { formatPhoneIn } from "@/lib/format/phone";
import { useParams } from "@/lib/navigation";
import {
    BROKER_YOUR_LISTINGS_HREF,
    brokerPropertyDetailHref,
    brokerYourListingsHref,
} from "@/lib/routes/broker";

import { ArrowLeft, ChartBar, Users } from "@/components/shared/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { amountLabel, listingPriceLabel } from "./format";
import { LeadStageBar, LeadStageLegend } from "./stage-bar";
import { OFFER_STATUS_LABEL, SHOWING_STATUS_LABEL, STAGE_BADGE_COLOR, STAGE_LABEL } from "./stage-meta";

function placeLabel(address?: string | null, city?: string | null): string {
    return [address, city].filter(Boolean).join(", ");
}

function whenLabel(iso: string | null): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return formatRelativePast(date, new Date());
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
        <div className="flex flex-col gap-6">
            <Link
                href={BROKER_YOUR_LISTINGS_HREF}
                className="inline-flex items-center gap-1.5 body-sm font-medium text-ink-muted hover:text-ink"
            >
                <ArrowLeft aria-hidden className="block-4 inline-4" />
                Your listings
            </Link>

            {query.isPending ? (
                <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading property analytics">
                    <div className="rounded-card bg-surface-muted block-16 inline-64" />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }, (_, index) => (
                            <div
                                key={index}
                                className="rounded-card border border-border-warm bg-surface-muted block-20"
                            />
                        ))}
                    </div>
                </div>
            ) : query.isError || !data ? (
                <div role="alert" className="flex flex-col items-center gap-4 py-12 text-center">
                    <p className="body-sm text-danger">
                        Couldn&apos;t load analytics for this listing.
                    </p>
                    <Button variant="outline" onClick={() => void query.refetch()}>
                        Try again
                    </Button>
                </div>
            ) : (
                <PropertyAnalyticsBody data={data} />
            )}
        </div>
    );
}

function PropertyAnalyticsBody({
    data,
}: {
    data: NonNullable<Awaited<ReturnType<typeof propertyAnalyticsApi.property>>>;
}) {
    const { property, summary, byStage, leads } = data;
    const price = listingPriceLabel(property);
    const place = placeLabel(property.address, property.city);
    const wonAmount = amountLabel(summary.closedWonAmount);
    const wonRate =
        summary.totalLeads === 0
            ? null
            : Math.round((summary.closedWon / summary.totalLeads) * 100);

    return (
        <>
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-inline-0">
                    <h1 className="h2 text-ink">{property.title?.trim() || "Untitled listing"}</h1>
                    <p className="body-sm mt-1 text-ink-muted">
                        {[place, price].filter(Boolean).join(" · ") || "Lead analytics"}
                    </p>
                </div>
                <Button
                    variant="outline"
                    render={<Link href={brokerPropertyDetailHref(property.id)} />}
                >
                    View listing
                </Button>
            </header>

            <section aria-label="Lead totals" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                    label="Leads"
                    value={summary.totalLeads}
                    hint={summary.openLeads === 1 ? "1 still open" : `${summary.openLeads} still open`}
                />
                <Stat
                    label="Won"
                    value={summary.closedWon}
                    hint={
                        wonAmount
                            ? `${wonAmount} closed`
                            : wonRate == null
                              ? undefined
                              : `${wonRate}% of leads`
                    }
                />
                <Stat
                    label="Lost"
                    value={summary.closedLost}
                    hint={
                        summary.pendingOffers > 0
                            ? `${summary.pendingOffers} pending ${summary.pendingOffers === 1 ? "offer" : "offers"}`
                            : undefined
                    }
                />
                <Stat
                    label="Visits"
                    value={summary.showings}
                    hint={
                        summary.acceptedOffers + summary.rejectedOffers > 0
                            ? `${summary.acceptedOffers} accepted · ${summary.rejectedOffers} rejected`
                            : undefined
                    }
                />
            </section>

            <section
                aria-label="Leads by stage"
                className="flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-4 shadow-sm"
            >
                <div className="flex items-center justify-between gap-3">
                    <h2 className="h6 text-ink">Pipeline</h2>
                    <Link
                        href={brokerYourListingsHref()}
                        className="body-sm font-medium text-ink-muted hover:text-ink"
                    >
                        All listings
                    </Link>
                </div>
                <LeadStageBar counts={byStage} />
                <LeadStageLegend counts={byStage} />
            </section>

            <section aria-label="Leads" className="flex flex-col gap-3">
                <h2 className="h6 text-ink">Each lead</h2>
                {leads.length === 0 ? (
                    <EmptyState
                        icon={ChartBar}
                        heading="No leads on this listing"
                        description="Attach a buyer from the listing card. Their stage will show up here."
                    >
                        <Button variant="outline" render={<Link href={BROKER_YOUR_LISTINGS_HREF} />}>
                            <Users aria-hidden className="block-4 inline-4" />
                            Back to your listings
                        </Button>
                    </EmptyState>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {leads.map((lead) => (
                            <li key={lead.id}>
                                <LeadRow lead={lead} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
}

function LeadRow({ lead }: { lead: PropertyAnalyticsLead }) {
    const phone = lead.buyerPhone ? formatPhoneIn(lead.buyerPhone) : null;
    const updated = whenLabel(lead.updatedAt);
    const offer = amountLabel(lead.offerAmount);
    const closed = amountLabel(lead.closedAmount);
    const visitStatus = lead.latestShowing?.status
        ? (SHOWING_STATUS_LABEL[lead.latestShowing.status] ?? lead.latestShowing.status)
        : null;
    const visitWhen = lead.latestShowing?.scheduledDate
        ? formatDateShort(new Date(lead.latestShowing.scheduledDate))
        : null;

    return (
        <article className="flex flex-col gap-2 rounded-card border border-border-warm bg-surface p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-inline-0">
                    <p className="font-semibold text-ink">{lead.buyerName?.trim() || "Unnamed buyer"}</p>
                    <p className="body-sm text-ink-muted">
                        {[phone, lead.buyerEmail, updated ? `Updated ${updated}` : null]
                            .filter(Boolean)
                            .join(" · ") || "No contact details"}
                    </p>
                </div>
                <Badge color={STAGE_BADGE_COLOR[lead.stage]}>{STAGE_LABEL[lead.stage]}</Badge>
            </div>

            <p className="body-sm text-ink">
                {offer ? (
                    <>
                        Offer {offer}
                        {lead.offerStatus ? ` · ${OFFER_STATUS_LABEL[lead.offerStatus]}` : ""}
                    </>
                ) : closed ? (
                    <>Closed at {closed}</>
                ) : (
                    <span className="text-ink-muted">No offer yet</span>
                )}
                {lead.showings > 0 ? (
                    <span className="text-ink-muted">
                        {" "}
                        · {lead.showings} {lead.showings === 1 ? "visit" : "visits"}
                        {visitStatus ? ` · ${visitStatus}` : ""}
                        {visitWhen ? ` ${visitWhen}` : ""}
                    </span>
                ) : null}
            </p>

            {lead.notes?.trim() ? (
                <p className="body-sm text-ink-muted">{lead.notes.trim()}</p>
            ) : null}
        </article>
    );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
    return (
        <div className="rounded-card border border-border-warm bg-surface px-4 py-3 shadow-sm">
            <p className="body-xs font-medium text-ink-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</p>
            {hint ? <p className="body-xs text-ink-subtle">{hint}</p> : null}
        </div>
    );
}
