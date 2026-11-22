import type { PropertyAnalytics } from "@/lib/api/property-analytics";
import { formatDateShort } from "@/lib/format/date";
import { plural } from "@/lib/format/plural";
import { BROKER_YOUR_LISTINGS_HREF, brokerPropertyDetailHref } from "@/lib/routes/broker";

import { ArrowLeft, MapPin } from "@/components/shared/icons";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Badge, type BadgeColor } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    agoLabel,
    formatSideAmount,
} from "@/features/properties/property-analytics/analytics-labels";
import type { PropertyReport } from "@/features/properties/property-analytics/analytics-math";

/** Second clause of the two-tone headline: what the numbers mean right now. */
function headline(report: PropertyReport): string {
    const { counts, offers, visits, closedWord, closedInr } = report;
    if (counts.total === 0) return "No clients yet.";
    if (counts.won > 0) {
        const side = report.clients.find((c) => c.group === "won")?.side ?? "sale";
        return closedInr
            ? `${closedWord} for ${formatSideAmount(closedInr, side)}.`
            : `${closedWord}.`;
    }
    const clients = plural(counts.total, "client");
    if (offers.pending > 0) return `${clients}, ${plural(offers.pending, "offer")} waiting.`;
    if (visits.upcoming > 0) return `${clients}, ${plural(visits.upcoming, "visit")} coming up.`;
    if (counts.active === 0) return `${clients}, none active.`;
    return `${clients}, ${counts.active} active.`;
}

function listingStatus(
    property: PropertyAnalytics["property"],
    closedWord: string,
): { label: string; color: BadgeColor } {
    // Same colours as the status pill on My Listings cards.
    if (property.status === "sold") return { label: closedWord, color: "red" };
    if (property.publishStatus === "draft") return { label: "Draft", color: "amber" };
    if (property.status === "unavailable") return { label: "Not available", color: "stone" };
    return { label: "Published", color: "emerald" };
}

function listedLabel(report: PropertyReport): string | null {
    if (report.soldAt) return `${report.closedWord} on ${formatDateShort(report.soldAt)}`;
    if (report.daysListed == null) return null;
    if (report.daysListed === 0) return "Listed today";
    return `Listed ${plural(report.daysListed, "day")} ago`;
}

export function AnalyticsHeader({
    property,
    report,
    now,
}: {
    property: PropertyAnalytics["property"];
    report: PropertyReport;
    now: Date;
}) {
    const title = property.title?.trim() || "Your listing";
    const place = [property.address?.trim(), property.city?.trim()].filter(Boolean).join(", ");
    const status = listingStatus(property, report.closedWord);
    const listed = listedLabel(report);
    const asks = [
        report.ask.saleInr != null ? { amountInr: report.ask.saleInr, isRent: false } : null,
        report.ask.rentInr != null ? { amountInr: report.ask.rentInr, isRent: true } : null,
    ].filter((ask) => ask != null);

    return (
        <header className="flex flex-col gap-4">
            <Button
                variant="link"
                size="md"
                className="self-start px-0 text-ink-muted hover:text-ink"
                nativeButton={false}
                render={<Link href={BROKER_YOUR_LISTINGS_HREF} />}
            >
                <ArrowLeft aria-hidden />
                My Listings
            </Button>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
                <div className="flex items-start gap-4 min-inline-0">
                    <div className="hidden sm:block">
                        <PropertyThumb
                            src={property.photo}
                            alt={title}
                            priority
                            hoverScale={false}
                        />
                    </div>
                    <div className="flex flex-col gap-2 min-inline-0">
                        <h1 className="h3 text-pretty">
                            <span className="text-ink">{title.replace(/[.\s]+$/, "")}.</span>{" "}
                            <span className="text-ink-muted">{headline(report)}</span>
                        </h1>
                        <div className="body-sm flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ink-muted">
                            <Badge color={status.color}>{status.label}</Badge>
                            {asks.map((ask) => (
                                <PriceWithCommission
                                    key={ask.isRent ? "rent" : "sale"}
                                    amountInr={ask.amountInr}
                                    isRent={ask.isRent}
                                    audience="broker"
                                    size="sm"
                                    showEmptyTip={false}
                                />
                            ))}
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
                            {listed ? <span>{listed}</span> : null}
                            {report.lastUpdateAt ? (
                                <span>Last client update {agoLabel(report.lastUpdateAt, now)}</span>
                            ) : null}
                        </div>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="md"
                    className="self-start lg:self-auto"
                    nativeButton={false}
                    render={<Link href={brokerPropertyDetailHref(property.id)} />}
                >
                    View listing
                </Button>
            </div>
        </header>
    );
}
