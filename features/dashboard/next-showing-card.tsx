import Link from "next/link";

import {
    CalendarClock,
    CalendarPlus,
    IndianRupee,
    MapPin,
    Navigation,
    Phone,
    User,
} from "lucide-react";

import { formatDurationUntil, formatShowingWhen } from "@/lib/format/date";
import { OWNER_VISITS_HREF } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { TextLinkButton } from "@/components/shared/text-link-button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL, DASHBOARD_CARD_SHELL_EMPTY } from "./card-shell";
import type { NextShowingStatus } from "./mock-data";

const STARTING_SOON_MINUTES = 30;
const BROKER_NEXT_SHOWING_INFO =
    "Your next scheduled site visit — when, where, and who you're meeting.";
const OWNER_NEXT_SHOWING_INFO =
    "The next showing booked on one of your properties — when, where, and which broker is bringing the client.";

export type NextShowing = {
    id: string;
    scheduledAt: Date;
    configLabel: string;
    locality: string;
    address: string;
    amountInr: number;
    isRent: boolean;
    meetNote: string;
    distanceKm: number;
    brokerNote: string;
    status: NextShowingStatus;
    clientName: string;
    clientPhoneDigits: string;
};

export type NextShowingCardProps = {
    showing: NextShowing | null;
    now: Date;
    className?: string;
    /** Owner portal swaps copy, empty CTA, and person role. */
    portal?: "broker" | "owner";
};

/**
 * Visit states in the broker's words. "Awaiting owner" and friends are internal
 * shorthand - each label says what happened, each tooltip says what to do next.
 */
function statusBadgeContent(
    status: NextShowingStatus,
    isStartingSoon: boolean,
    isPast: boolean,
    portal: "broker" | "owner",
): { label: string; hint: string; className: string; variant?: "brand" | "urgent" | "outline" } {
    if (isPast) {
        return {
            label: "In progress",
            hint:
                portal === "owner"
                    ? "This visit's start time has passed. Check in with the broker if you need an update."
                    : "This visit's start time has passed. Mark it done or reschedule once you're finished.",
            variant: "brand",
            className: "font-semibold",
        };
    }
    if (isStartingSoon) {
        return {
            label: "Starting soon",
            hint:
                portal === "owner"
                    ? `Starts in under ${STARTING_SOON_MINUTES} minutes. The broker should be on the way with their client.`
                    : `Starts in under ${STARTING_SOON_MINUTES} minutes. Leave now if you aren't already on your way.`,
            variant: "urgent",
            className: "font-semibold",
        };
    }
    if (status === "confirmed") {
        return {
            label: portal === "owner" ? "Confirmed" : "Owner confirmed",
            hint:
                portal === "owner"
                    ? "You've confirmed this time slot. The visit is on."
                    : "The owner approved this time slot. The visit is on - no further action needed.",
            className: "border-transparent bg-highlight font-semibold text-highlight-ink",
        };
    }
    return {
        label: portal === "owner" ? "Scheduled" : "Owner not replied",
        hint:
            portal === "owner"
                ? "A broker booked this slot. Confirm or cancel it from Visits if you need to change it."
                : "The owner hasn't confirmed this slot yet. Nudge them, or reschedule if you don't hear back before the visit.",
        variant: "outline",
        className: "bg-surface font-semibold text-pending",
    };
}

function StatusBadge({
    status,
    isStartingSoon,
    isPast,
    portal,
}: {
    status: NextShowingStatus;
    isStartingSoon: boolean;
    isPast: boolean;
    portal: "broker" | "owner";
}) {
    const { label, hint, className, variant } = statusBadgeContent(
        status,
        isStartingSoon,
        isPast,
        portal,
    );

    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <button
                        type="button"
                        aria-label={`Visit status: ${label}. ${hint}`}
                        className="
                          shrink-0 rounded-sm outline-none
                          focus-visible:ring-2 focus-visible:ring-ring
                        "
                    >
                        <Badge variant={variant} className={className}>
                            {label}
                        </Badge>
                    </button>
                }
            />
            <TooltipContent side="bottom" align="center" className="text-pretty max-inline-64">
                {hint}
            </TooltipContent>
        </Tooltip>
    );
}

function formatDistanceKm(distanceKm: number): string {
    const rounded = Number.isInteger(distanceKm) ? distanceKm.toFixed(0) : distanceKm.toFixed(1);
    return `${rounded} km`;
}

function mapsSearchUrl(address: string): string {
    const query = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/** Empty map slot — swap in a real map later. Distance sits below. */
function MapPlaceholder({ distanceKm }: { distanceKm: number }) {
    return (
        <aside
            className="mbs-4 hidden shrink-0 flex-col items-center gap-3 pe-5"
            aria-label="Travel details"
        >
            <div
                className="
                  overflow-hidden rounded-inner border border-border-warm bg-surface-muted block-32
                  inline-32
                "
                aria-hidden
            />
            <p className="tabular h3 text-ink">{formatDistanceKm(distanceKm)}</p>
        </aside>
    );
}

function EmptyNextShowing({
    className,
    portal,
}: {
    className?: string;
    portal: "broker" | "owner";
}) {
    const isOwner = portal === "owner";

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL_EMPTY, className)}
            aria-labelledby="next-showing-empty-heading"
        >
            <CardLabel info={isOwner ? OWNER_NEXT_SHOWING_INFO : BROKER_NEXT_SHOWING_INFO}>
                Next showing
            </CardLabel>

            <EmptyState
                icon={CalendarPlus}
                headingId="next-showing-empty-heading"
                heading="No visits booked"
                description={
                    isOwner
                        ? "Open visit slots so brokers can book showings on your listings."
                        : "Schedule one when a client is ready to see a property."
                }
            >
                <TextLinkButton href={isOwner ? OWNER_VISITS_HREF : "/broker/visits/new"}>
                    {isOwner ? "Manage visits" : "Schedule a visit"}
                </TextLinkButton>
            </EmptyState>
        </section>
    );
}

export function NextShowingCard({
    showing,
    now,
    className,
    portal = "broker",
}: NextShowingCardProps) {
    if (!showing) {
        return <EmptyNextShowing className={className} portal={portal} />;
    }

    const isOwner = portal === "owner";
    const whenLabel = formatShowingWhen(showing.scheduledAt, now);
    const duration = formatDurationUntil(showing.scheduledAt, now);
    const isStartingSoon =
        !duration.isPast &&
        duration.minutesRemaining > 0 &&
        duration.minutesRemaining <= STARTING_SOON_MINUTES;
    const hasPhone = showing.clientPhoneDigits.replace(/\D/g, "").length >= 10;
    const phoneHref = hasPhone
        ? `tel:+91${showing.clientPhoneDigits.replace(/\D/g, "").slice(-10)}`
        : undefined;
    const hasPrice = showing.amountInr > 0;
    /** Locality is often folded into the title already - only join when it adds something. */
    const propertyLine = [showing.configLabel, showing.locality]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" · ");
    /** Prefer a real street address; fall back to the property line when the API omits one. */
    const locationLine = showing.address.trim() || propertyLine;
    const directionsHref = mapsSearchUrl(locationLine);
    const personRole = isOwner ? "Broker" : "Client";
    const secondaryHref = isOwner
        ? OWNER_VISITS_HREF
        : `/broker/visits/new?reschedule=${showing.id}`;
    const secondaryLabel = isOwner ? "View visits" : "Reschedule";

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby={`next-showing-${showing.id}`}
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <CardLabel info={isOwner ? OWNER_NEXT_SHOWING_INFO : BROKER_NEXT_SHOWING_INFO}>
                    Next showing
                </CardLabel>
                <StatusBadge
                    status={showing.status}
                    isStartingSoon={isStartingSoon}
                    isPast={duration.isPast}
                    portal={portal}
                />
            </div>

            <div className="mbs-3 flex flex-1 flex-col gap-3 overflow-hidden min-block-0">
                <div className="flex flex-1 items-start justify-between gap-4 min-block-0">
                    <div className="flex flex-1 flex-col justify-center gap-3 min-inline-0">
                        <div className="shrink-0">
                            <h2 id={`next-showing-${showing.id}`} className="h2 text-ink">
                                <time dateTime={showing.scheduledAt.toISOString()}>
                                    {whenLabel}
                                </time>
                            </h2>
                            <p
                                className={cn(
                                    "body-sm tabular mbs-1 font-medium",
                                    isStartingSoon ? "text-urgent" : "text-ink-muted",
                                )}
                            >
                                {duration.label}
                            </p>
                        </div>

                        <div className="shrink-0">
                            <p
                                className="
                                  body-sm flex items-start gap-1.5 text-ink-muted max-inline-100
                                "
                            >
                                <MapPin
                                    aria-hidden
                                    className="mbs-0.5 shrink-0 block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                <span className="text-pretty min-inline-0">{locationLine}</span>
                            </p>
                            {hasPrice || showing.meetNote ? (
                                <Badge
                                    className="
                                      body-sm mbs-3! inline-flex items-center gap-1.5
                                      border-border-warm bg-transparent px-3 py-1.5 font-medium
                                      whitespace-normal text-ink-muted max-inline-100
                                    "
                                >
                                    {hasPrice ? (
                                        <IndianRupee
                                            aria-hidden
                                            className="shrink-0 text-brand block-3.5 inline-3.5"
                                            strokeWidth={1.75}
                                        />
                                    ) : null}
                                    <span className="leading-0 text-pretty min-inline-0">
                                        {hasPrice ? (
                                            <Price
                                                amountInr={showing.amountInr}
                                                isRent={showing.isRent}
                                                className="font-semibold text-brand"
                                            />
                                        ) : null}
                                        {hasPrice && showing.meetNote ? (
                                            <span aria-hidden className="text-ink-subtle">
                                                {" "}
                                                ·{" "}
                                            </span>
                                        ) : null}
                                        {showing.meetNote ? <span>{showing.meetNote}</span> : null}
                                    </span>
                                </Badge>
                            ) : null}
                        </div>
                    </div>

                    {!isOwner && showing.distanceKm > 0 ? (
                        <MapPlaceholder distanceKm={showing.distanceKm} />
                    ) : null}
                </div>

                <div
                    className="
                      pts-1 mbs-auto flex flex-wrap items-center justify-between gap-3 min-block-0
                    "
                >
                    <div className="flex flex-wrap gap-3">
                        {locationLine ? (
                            <Button
                                variant="accent"
                                size="md"
                                nativeButton={false}
                                render={
                                    <a
                                        href={directionsHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    />
                                }
                            >
                                <Navigation aria-hidden strokeWidth={1.75} />
                                Directions
                            </Button>
                        ) : null}
                        <Button
                            variant="outline-dark"
                            size="md"
                            nativeButton={false}
                            render={<Link href={secondaryHref} />}
                        >
                            <CalendarClock aria-hidden strokeWidth={1.75} />
                            {secondaryLabel}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2.5 min-inline-0">
                        <UserAvatar name={showing.clientName} size="md" />
                        <div className="min-inline-0">
                            <p className="body truncate font-medium text-ink capitalize">
                                {showing.clientName}
                            </p>
                            <p
                                className="
                                  body-sm inline-flex items-center gap-1.5 font-medium
                                  text-ink-muted
                                "
                            >
                                <span className="inline-flex items-center gap-1">
                                    <User
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={2}
                                    />
                                    {personRole}
                                </span>
                                {hasPhone && phoneHref ? (
                                    <>
                                        <span aria-hidden>·</span>
                                        <Tooltip>
                                            <TooltipTrigger
                                                render={
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        nativeButton={false}
                                                        render={<a href={phoneHref} />}
                                                        className="
                                                          body-sm gap-1 p-0 font-medium text-ink-muted
                                                          block-auto
                                                          hover:text-ink hover:underline
                                                        "
                                                    >
                                                        <Phone
                                                            aria-hidden
                                                            className="block-3.5 inline-3.5"
                                                            strokeWidth={2}
                                                        />
                                                        <PhoneNumber
                                                            phoneDigits={showing.clientPhoneDigits}
                                                        />
                                                    </Button>
                                                }
                                            />
                                            <TooltipContent
                                                side="top"
                                                align="center"
                                                className="text-pretty"
                                            >
                                                {`Call ${showing.clientName} about this visit`}
                                            </TooltipContent>
                                        </Tooltip>
                                    </>
                                ) : null}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
