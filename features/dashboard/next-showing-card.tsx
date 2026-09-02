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
const NEXT_SHOWING_INFO = "Your next scheduled site visit — when, where, and who you're meeting.";

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
};

/**
 * Visit states in the broker's words. "Awaiting owner" and friends are internal
 * shorthand - each label says what happened, each tooltip says what to do next.
 */
function statusBadgeContent(
    status: NextShowingStatus,
    isStartingSoon: boolean,
    isPast: boolean,
): { label: string; hint: string; className: string; variant?: "brand" | "urgent" | "outline" } {
    if (isPast) {
        return {
            label: "In progress",
            hint: "This visit's start time has passed. Mark it done or reschedule once you're finished.",
            variant: "brand",
            className: "font-semibold",
        };
    }
    if (isStartingSoon) {
        return {
            label: "Starting soon",
            hint: `Starts in under ${STARTING_SOON_MINUTES} minutes. Leave now if you aren't already on your way.`,
            variant: "urgent",
            className: "font-semibold",
        };
    }
    if (status === "confirmed") {
        return {
            label: "Owner confirmed",
            hint: "The owner approved this time slot. The visit is on - no further action needed.",
            className: "border-transparent bg-highlight font-semibold text-highlight-ink",
        };
    }
    return {
        label: "Owner not replied",
        hint: "The owner hasn't confirmed this slot yet. Nudge them, or reschedule if you don't hear back before the visit.",
        variant: "outline",
        className: "bg-surface font-semibold text-pending",
    };
}

function StatusBadge({
    status,
    isStartingSoon,
    isPast,
}: {
    status: NextShowingStatus;
    isStartingSoon: boolean;
    isPast: boolean;
}) {
    const { label, hint, className, variant } = statusBadgeContent(status, isStartingSoon, isPast);

    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <button
                        type="button"
                        aria-label={`Visit status: ${label}. ${hint}`}
                        className="
                          shrink-0 rounded-full outline-none
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

function EmptyNextShowing({ className }: { className?: string }) {
    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL_EMPTY, className)}
            aria-labelledby="next-showing-empty-heading"
        >
            <CardLabel info={NEXT_SHOWING_INFO}>Next showing</CardLabel>

            <EmptyState
                icon={CalendarPlus}
                headingId="next-showing-empty-heading"
                heading="No visits booked"
                description="Schedule one when a client is ready to see a property."
            >
                <TextLinkButton href="/broker/visits/new">Schedule a visit</TextLinkButton>
                {/* <Button
                    variant="accent"
                    size="md"
                    nativeButton={false}
                    render={<Link href="/broker/visits/new" />}
                >
                    <CalendarPlus aria-hidden strokeWidth={1.75} />
                </Button> */}
            </EmptyState>
        </section>
    );
}

export function NextShowingCard({ showing, now, className }: NextShowingCardProps) {
    if (!showing) {
        return <EmptyNextShowing className={className} />;
    }

    const whenLabel = formatShowingWhen(showing.scheduledAt, now);
    const duration = formatDurationUntil(showing.scheduledAt, now);
    const isStartingSoon =
        !duration.isPast &&
        duration.minutesRemaining > 0 &&
        duration.minutesRemaining <= STARTING_SOON_MINUTES;
    const phoneHref = `tel:+91${showing.clientPhoneDigits.replace(/\D/g, "").slice(-10)}`;
    const hasPrice = showing.amountInr > 0;
    /** Locality is often folded into the title already - only join when it adds something. */
    const propertyLine = [showing.configLabel, showing.locality]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" · ");
    /** Prefer a real street address; fall back to the property line when the API omits one. */
    const locationLine = showing.address.trim() || propertyLine;
    const directionsHref = mapsSearchUrl(locationLine);

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby={`next-showing-${showing.id}`}
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <CardLabel info={NEXT_SHOWING_INFO}>Next showing</CardLabel>
                <StatusBadge
                    status={showing.status}
                    isStartingSoon={isStartingSoon}
                    isPast={duration.isPast}
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

                    <MapPlaceholder distanceKm={showing.distanceKm} />
                </div>

                <div
                    className="
                      pts-1 mbs-auto flex flex-wrap items-center justify-between gap-3 min-block-0
                    "
                >
                    <div className="flex flex-wrap gap-3">
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
                        <Button
                            variant="outline-dark"
                            size="md"
                            nativeButton={false}
                            render={<Link href={`/broker/visits/new?reschedule=${showing.id}`} />}
                        >
                            <CalendarClock aria-hidden strokeWidth={1.75} />
                            Reschedule
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
                                    Client
                                </span>
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
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
