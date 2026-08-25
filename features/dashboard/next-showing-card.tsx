import Link from "next/link";

import { CalendarClock, Navigation, Phone, User } from "lucide-react";

import { formatDurationUntil, formatShowingWhen } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardLabel } from "./card-label";
import type { NextShowingStatus } from "./mock-data";

const STARTING_SOON_MINUTES = 30;
const NEXT_SHOWING_INFO = "Your next scheduled site visit — when, where, and who you're meeting.";

export type NextShowing = {
    id: string;
    scheduledAt: Date;
    configLabel: string;
    locality: string;
    amountInr: number;
    isRent: boolean;
    meetNote: string;
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
        return <Badge variant="neutral">Started</Badge>;
    }
    if (isStartingSoon) {
        return <Badge variant="urgent">Starting soon</Badge>;
    }
    if (status === "confirmed") {
        return <Badge variant="brand">Confirmed</Badge>;
    }
    return <Badge variant="neutral">Awaiting owner</Badge>;
}

function mapsSearchUrl(locality: string, configLabel: string): string {
    const query = encodeURIComponent(`${configLabel}, ${locality}, Surat`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function EmptyNextShowing({ className }: { className?: string }) {
    return (
        <section
            className={cn(
                `
                  flex flex-col overflow-visible rounded-card border border-border-warm bg-surface
                  p-8 shadow-sm
                  md:block-full
                `,
                className,
            )}
        >
            <CardLabel info={NEXT_SHOWING_INFO}>Next showing</CardLabel>
            <div className="mbs-4 flex flex-1 flex-col">
                <p className="h5 text-ink">Nothing on the calendar.</p>
                <p className="body mbs-1 text-ink-muted">
                    Schedule a site visit when a client is ready to see a property.
                </p>
                <div className="pts-5 mbs-auto">
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
    const directionsHref = mapsSearchUrl(showing.locality, showing.configLabel);

    return (
        <section
            className={cn(
                `
                  flex flex-col overflow-visible rounded-card border border-border-warm bg-surface
                  p-8 shadow-sm
                  md:block-full
                `,
                className,
            )}
            aria-labelledby={`next-showing-${showing.id}`}
        >
            <div className="flex items-start justify-between gap-3">
                <CardLabel info={NEXT_SHOWING_INFO}>Next showing</CardLabel>
                {statusBadge(showing.status, isStartingSoon, duration.isPast)}
            </div>

            <div className="mbs-4 flex flex-1 flex-col gap-5">
                <div>
                    <h2 id={`next-showing-${showing.id}`} className="h2 text-ink">
                        <time dateTime={showing.scheduledAt.toISOString()}>{whenLabel}</time>
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

                <div>
                    <p className="h5 text-ink">
                        {showing.configLabel} · {showing.locality}
                    </p>
                    <p className="body-sm mbs-1 text-ink-muted">
                        <Price amountInr={showing.amountInr} isRent={showing.isRent} />
                        <span aria-hidden> · </span>
                        <span>{showing.meetNote}</span>
                    </p>
                </div>

                <div className="pts-1 mbs-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
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
                                <a
                                    href={phoneHref}
                                    className={`
                                      inline-flex items-center gap-1 outline-none
                                      hover:text-ink
                                      focus-visible:ring-3 focus-visible:ring-ring/30
                                    `}
                                >
                                    <Phone
                                        aria-hidden
                                        className="block-3.5 inline-3.5"
                                        strokeWidth={2}
                                    />
                                    <PhoneNumber phoneDigits={showing.clientPhoneDigits} />
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
