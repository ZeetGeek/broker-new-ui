import Link from "next/link";

import { AlertTriangle, Building2, MessageCircle } from "lucide-react";

import { formatAreaSqft } from "@/lib/format/area";
import { cn } from "@/lib/utils";

import { Price } from "@/components/shared/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL_AUTO } from "./card-shell";
import type { RepresentedPropertyItem, YouRepresentData } from "./mock-data";
import { TextLinkButton } from "./text-link-button";

const YOU_REPRESENT_INFO =
    "Properties owners have approved you to represent — share them or book a visit before they go stale.";

const MAX_ROWS = 3;

export type YouRepresentCardProps = {
    data: YouRepresentData;
    className?: string;
};

function activityLabel(property: RepresentedPropertyItem): string {
    if (property.isStale) {
        const visitPart =
            property.visitCount === 0
                ? "0 visits"
                : property.visitCount === 1
                  ? "1 visit"
                  : `${property.visitCount} visits`;
        return `No activity in ${property.daysSinceActivity} days · ${visitPart}`;
    }

    const visitsDone =
        property.visitCount === 1
            ? "1 visit done"
            : `${property.visitCount} visits done`;

    if (property.stageLabel && property.negotiationClientName) {
        return `${visitsDone} · ${property.negotiationClientName} at offer stage`;
    }

    const interested =
        property.interestedCount === 1
            ? "1 client interested"
            : `${property.interestedCount} clients interested`;

    const lastActivity =
        property.daysSinceActivity === 0
            ? "last activity today"
            : property.daysSinceActivity === 1
              ? "last activity 1 day ago"
              : `last activity ${property.daysSinceActivity} days ago`;

    return `${visitsDone} · ${interested} · ${lastActivity}`;
}

function PropertyThumb() {
    return (
        <span
            className="
              flex shrink-0 items-center justify-center rounded-inner bg-surface-muted
              text-ink-muted block-12 inline-16 sm:block-16 sm:inline-20
            "
            aria-hidden
        >
            <Building2 className="block-5 inline-5" strokeWidth={1.75} />
        </span>
    );
}

function PropertyRow({
    property,
    className,
}: {
    property: RepresentedPropertyItem;
    className?: string;
}) {
    const activity = activityLabel(property);

    return (
        <li className={cn("flex items-center gap-3 sm:gap-4", className)}>
            <PropertyThumb />

            <div
                className="
                  flex flex-1 flex-col gap-3 min-inline-0 sm:flex-row sm:items-center
                  sm:justify-between sm:gap-4
                "
            >
                <div className="flex flex-col gap-0.5 min-inline-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="body font-semibold text-ink">
                            {property.configLabel} · {property.locality}
                        </p>
                        <Price
                            amountInr={property.amountInr}
                            isRent={property.isRent}
                            className="body font-semibold"
                        />
                        <Badge variant="neutral">{property.isRent ? "Rent" : "Sale"}</Badge>
                        {property.stageLabel ? (
                            <Badge variant="brand">{property.stageLabel}</Badge>
                        ) : null}
                    </div>

                    <p className="body-sm text-ink-muted">
                        {formatAreaSqft(property.areaSqft)} · {property.furnishingLabel}
                        <span className="hidden sm:inline">
                            {" "}
                            · Owner: {property.ownerFirstName}
                        </span>
                    </p>

                    <p
                        className={cn(
                            "body-sm flex items-start gap-1.5",
                            property.isStale
                                ? "font-medium text-urgent"
                                : "text-ink-muted",
                        )}
                    >
                        {property.isStale ? (
                            <AlertTriangle
                                aria-hidden
                                className="mbs-0.5 shrink-0 block-3.5 inline-3.5"
                                strokeWidth={2}
                            />
                        ) : null}
                        <span>{activity}</span>
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={
                            <a
                                href={property.shareHref}
                                target="_blank"
                                rel="noopener noreferrer"
                            />
                        }
                        className="gap-1.5 border-2 border-border-warm"
                    >
                        <MessageCircle
                            aria-hidden
                            className="block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        Share
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={property.bookVisitHref} />}
                        className="border-2 border-border-warm"
                    >
                        Book visit
                    </Button>
                </div>
            </div>
        </li>
    );
}

export function YouRepresentCard({ data, className }: YouRepresentCardProps) {
    const { totalCount, properties } = data;
    const rows = properties.slice(0, MAX_ROWS);
    const heading = `You represent · ${totalCount}`;

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL_AUTO, className)}
            aria-labelledby="you-represent-heading"
        >
            <div className="flex shrink-0 items-center justify-between gap-3">
                <CardLabel info={YOU_REPRESENT_INFO}>
                    <span id="you-represent-heading">{heading}</span>
                </CardLabel>
                <TextLinkButton href="/broker/properties?mine=1">View all</TextLinkButton>
            </div>

            {rows.length === 0 ? (
                <div className="mbs-4 flex flex-1 flex-col min-block-0">
                    <p className="h5 text-ink">No properties yet.</p>
                    <p className="body mbs-1 text-ink-muted">
                        Owners in your area are listing now.
                    </p>
                    <div className="pts-3 mbs-auto">
                        <TextLinkButton href="/broker/properties">
                            Browse available properties
                        </TextLinkButton>
                    </div>
                </div>
            ) : (
                <ul className="mbs-1 flex flex-col">
                    {rows.map((property, index) => (
                        <PropertyRow
                            key={property.id}
                            property={property}
                            className={
                                index > 0
                                    ? "mbs-3 border-bs border-border-warm pbs-3"
                                    : "mbs-4"
                            }
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}
