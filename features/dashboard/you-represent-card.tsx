import Link from "next/link";

import { AlertTriangle, KeyRound, MessageCircle, UserRound } from "lucide-react";

import { formatAreaSqft } from "@/lib/format/area";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { Price } from "@/components/shared/price";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ShortcutTooltip } from "@/components/shared/shortcut-tooltip";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL_AUTO, DASHBOARD_CARD_SHELL_EMPTY } from "./card-shell";
import type { RepresentedPropertyItem, YouRepresentData } from "./mock-data";
import { TextLinkButton } from "./text-link-button";

const YOU_REPRESENT_INFO =
    "Properties owners have approved you to represent — share them or book a visit before they go stale.";

const MAX_ROWS = 3;

const META_CHIP =
    "inline-flex items-center rounded-control bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700";

export type YouRepresentCardProps = {
    data: YouRepresentData;
    className?: string;
};

function activityStatus(property: RepresentedPropertyItem): {
    label: string;
    className: string;
    showWarning: boolean;
} {
    if (property.isStale) {
        const visitPart =
            property.visitCount === 0
                ? "0 visits"
                : property.visitCount === 1
                  ? "1 visit"
                  : `${property.visitCount} visits`;
        return {
            label: `No activity in ${property.daysSinceActivity} days · ${visitPart}`,
            className: "font-medium text-red-700",
            showWarning: true,
        };
    }

    const visitsDone =
        property.visitCount === 1
            ? "1 visit done"
            : `${property.visitCount} visits done`;

    if (property.stageLabel && property.negotiationClientName) {
        return {
            label: `${visitsDone} · ${property.negotiationClientName} at offer stage`,
            className: "font-medium text-amber-800",
            showWarning: false,
        };
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

    return {
        label: `${visitsDone} · ${interested} · ${lastActivity}`,
        className: "font-medium text-emerald-700",
        showWarning: false,
    };
}

function PropertyRow({
    property,
    className,
}: {
    property: RepresentedPropertyItem;
    className?: string;
}) {
    const activity = activityStatus(property);

    return (
        <li className={cn("flex items-center gap-3 sm:gap-4", className)}>
            <PropertyThumb
                src={property.imageSrc}
                alt={`${property.configLabel} in ${property.locality}`}
            />

            <div
                className="
                  flex flex-1 flex-col gap-3 min-inline-0
                  sm:flex-row sm:items-center sm:justify-between sm:gap-4
                "
            >
                <div className="flex flex-col gap-1.5 min-inline-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="body font-semibold text-ink">
                            {property.configLabel} · {property.locality}
                        </p>
                        <Price
                            amountInr={property.amountInr}
                            isRent={property.isRent}
                            className="body font-semibold"
                        />
                        <Badge
                            className={
                                property.isRent
                                    ? "border-0 bg-sky-100 text-sky-800"
                                    : "border-0 bg-emerald-100 text-emerald-800"
                            }
                        >
                            {property.isRent ? "Rent" : "Sale"}
                        </Badge>
                        {property.stageLabel ? (
                            <Badge className="border-0 bg-amber-100 text-amber-900">
                                {property.stageLabel}
                            </Badge>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className={META_CHIP}>{formatAreaSqft(property.areaSqft)}</span>
                        <span className={META_CHIP}>{property.furnishingLabel}</span>
                        <span className={cn(META_CHIP, "hidden gap-1 sm:inline-flex")}>
                            <UserRound
                                aria-hidden
                                className="block-3 inline-3"
                                strokeWidth={2}
                            />
                            {property.ownerFirstName}
                        </span>
                    </div>

                    <p
                        className={cn(
                            "body-sm flex items-start gap-1.5",
                            activity.className,
                        )}
                    >
                        {activity.showWarning ? (
                            <AlertTriangle
                                aria-hidden
                                className="mbs-0.5 shrink-0 block-3.5 inline-3.5"
                                strokeWidth={2}
                            />
                        ) : null}
                        <span>{activity.label}</span>
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

function EmptyYouRepresent() {
    return (
        <EmptyState
            icon={KeyRound}
            headingId="you-represent-empty-heading"
            heading="Not representing any properties yet"
            description="Once an owner approves your request, the property appears here."
        >
            <ShortcutTooltip shortcutId="properties" label="Properties">
                <TextLinkButton href="/broker/properties">Browse properties</TextLinkButton>
            </ShortcutTooltip>
        </EmptyState>
    );
}

export function YouRepresentCard({ data, className }: YouRepresentCardProps) {
    const { totalCount, properties } = data;
    const rows = properties.slice(0, MAX_ROWS);
    const isEmpty = totalCount === 0 || properties.length === 0;
    const heading = isEmpty ? "You represent" : `You represent · ${totalCount}`;

    return (
        <section
            className={cn(isEmpty ? DASHBOARD_CARD_SHELL_EMPTY : DASHBOARD_CARD_SHELL_AUTO, className)}
            aria-labelledby={isEmpty ? "you-represent-empty-heading" : "you-represent-heading"}
        >
            <div className="flex shrink-0 items-center justify-between gap-3">
                <CardLabel info={YOU_REPRESENT_INFO}>
                    <span id="you-represent-heading">{heading}</span>
                </CardLabel>
                {!isEmpty ? (
                    <ShortcutTooltip shortcutId="properties" label="Properties">
                        <TextLinkButton href="/broker/properties?mine=1">View all</TextLinkButton>
                    </ShortcutTooltip>
                ) : null}
            </div>

            {isEmpty ? (
                <EmptyYouRepresent />
            ) : (
                <ul className="mbs-1 flex flex-col">
                    {rows.map((property, index) => (
                        <PropertyRow
                            key={property.id}
                            property={property}
                            className={
                                index > 0
                                    ? "mbs-3 border-bs border-border-warm/50 pbs-3"
                                    : "mbs-4"
                            }
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}
