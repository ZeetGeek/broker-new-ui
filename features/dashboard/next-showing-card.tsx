import Link from "next/link";

import { CalendarClock, IndianRupee, MapPin, Navigation, Phone, User } from "lucide-react";

import { formatDurationUntil, formatShowingWhen } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";
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

function statusBadge(status: NextShowingStatus, isStartingSoon: boolean, isPast: boolean) {
    if (isPast) {
        return (
            <Badge variant="brand" className="font-semibold">
                Started
            </Badge>
        );
    }
    if (isStartingSoon) {
        return (
            <Badge variant="urgent" className="font-semibold">
                Starting soon
            </Badge>
        );
    }
    if (status === "confirmed") {
        return (
            <Badge className="border-transparent bg-highlight font-semibold text-highlight-ink">
                Confirmed
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-surface font-semibold text-pending">
            Awaiting owner
        </Badge>
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
            className="mbs-4 flex hidden shrink-0 flex-col items-center gap-3 pe-5"
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
        <section className={cn(DASHBOARD_CARD_SHELL, className)}>
            <CardLabel info={NEXT_SHOWING_INFO}>Next showing</CardLabel>
            <div className="mbs-4 flex flex-1 flex-col min-block-0">
                <p className="h5 text-ink">Nothing on the calendar.</p>
                <p className="body mbs-1 text-ink-muted">
                    Schedule a site visit when a client is ready to see a property.
                </p>
                <div className="pts-3 mbs-auto">
                    <Button
                        variant="default"
                        size="md"
                        nativeButton={false}
                        render={<Link href="/broker/visits/new" />}
                    >
                        Schedule a visit
                    </Button>
                </div>
            </div>
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
    const directionsHref = mapsSearchUrl(showing.address);

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby={`next-showing-${showing.id}`}
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <CardLabel info={NEXT_SHOWING_INFO}>Next showing</CardLabel>
                {statusBadge(showing.status, isStartingSoon, duration.isPast)}
            </div>

            <div className="mbs-3 flex flex-1 flex-col gap-3 overflow-hidden min-block-0">
                <div className="flex flex-1 items-start justify-between gap-4 min-block-0">
                    <div className="flex flex-1 flex-col gap-3 min-inline-0">
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
                            <p className="h5 text-ink">
                                {showing.configLabel} · {showing.locality}
                            </p>
                            <p
                                className="
                                  body-sm mbs-1.5 flex items-center gap-1.5 text-ink-muted
                                  max-inline-100
                                "
                            >
                                <MapPin
                                    aria-hidden
                                    className="shrink-0 block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                <span className="text-pretty min-inline-0">{showing.address}</span>
                            </p>
                            <Badge
                                className="
                                  body-sm mbs-5! inline-flex items-center gap-1.5 border-border-warm
                                  bg-transparent px-3 py-1.5 font-medium whitespace-normal
                                  text-ink-muted max-inline-100
                                "
                            >
                                <IndianRupee
                                    aria-hidden
                                    className="shrink-0 text-brand block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                <span className="leading-0 text-pretty min-inline-0">
                                    <Price
                                        amountInr={showing.amountInr}
                                        isRent={showing.isRent}
                                        className="font-semibold text-brand"
                                    />
                                    <span aria-hidden className="text-ink-subtle">
                                        {" "}
                                        ·{" "}
                                    </span>
                                    <span>{showing.meetNote}</span>
                                </span>
                            </Badge>
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
                            variant="default"
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
                            <p className="body truncate font-medium text-ink">
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
                                <Button
                                    variant="link"
                                    size="sm"
                                    nativeButton={false}
                                    render={<a href={phoneHref} />}
                                    className="
                                      body-sm gap-1 p-0 font-medium text-ink-muted block-auto
                                      hover:text-ink hover:underline
                                    "
                                >
                                    <Phone
                                        aria-hidden
                                        className="block-3.5 inline-3.5"
                                        strokeWidth={2}
                                    />
                                    <PhoneNumber phoneDigits={showing.clientPhoneDigits} />
                                </Button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
