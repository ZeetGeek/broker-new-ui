"use client";

import Link from "next/link";

import { CalendarClock, Send } from "lucide-react";

import type { DashboardOwnerSummary } from "@/lib/api/dashboard";
import { formatRelativePast, formatShowingWhen } from "@/lib/format/date";
import {
    OWNER_PROPERTIES_HREF,
    OWNER_VISITS_HREF,
    ownerPropertyDetailHref,
    ownerRequestsHref,
    ownerVisitsHref,
} from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { TextLinkButton } from "@/components/shared/text-link-button";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";
import type { OwnerGlanceInvite, OwnerGlanceVisit } from "./map-dashboard";
import { MetricCell, MetricDivider, MetricStrip } from "./metric-strip";

const GLANCE_INFO =
    "A quick count of your listings, brokers, requests, visits, and closed deals — plus what is coming up.";

const MAX_GLANCE_ROWS = 5;

export type GlanceCardProps = {
    summary: DashboardOwnerSummary;
    visits: OwnerGlanceVisit[];
    invites: OwnerGlanceInvite[];
    now: Date;
    className?: string;
};

function GlanceVisitRow({ visit, now }: { visit: OwnerGlanceVisit; now: Date }) {
    return (
        <li>
            <Link
                href={ownerVisitsHref("scheduled")}
                className="
                  flex items-start gap-3 rounded-inner py-2.5 outline-none min-inline-0
                  hover:bg-surface-muted/80
                  focus-visible:ring-2 focus-visible:ring-ring
                "
            >
                <CalendarClock
                    aria-hidden
                    className="mbs-0.5 shrink-0 text-ink-muted block-4 inline-4"
                    strokeWidth={1.75}
                />
                <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                    <p className="body truncate font-semibold text-ink">{visit.propertyTitle}</p>
                    <p className="body-sm truncate text-ink-muted">
                        {visit.brokerName}
                        <span aria-hidden> · </span>
                        {formatShowingWhen(visit.scheduledAt, now)}
                    </p>
                </div>
                <span className="body-xs shrink-0 whitespace-nowrap text-ink-subtle">
                    {visit.statusLabel}
                </span>
            </Link>
        </li>
    );
}

function GlanceInviteRow({ invite, now }: { invite: OwnerGlanceInvite; now: Date }) {
    const relative = invite.createdAt != null ? formatRelativePast(invite.createdAt, now) : null;

    return (
        <li>
            <Link
                href={
                    invite.propertyId
                        ? ownerPropertyDetailHref(invite.propertyId)
                        : ownerRequestsHref("invitations")
                }
                className="
                  flex items-start gap-3 rounded-inner py-2.5 outline-none min-inline-0
                  hover:bg-surface-muted/80
                  focus-visible:ring-2 focus-visible:ring-ring
                "
            >
                <Send
                    aria-hidden
                    className="mbs-0.5 shrink-0 text-ink-muted block-4 inline-4"
                    strokeWidth={1.75}
                />
                <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                    <p className="body truncate font-semibold text-ink">{invite.propertyTitle}</p>
                    <p className="body-sm truncate text-ink-muted">
                        Invite pending
                        {invite.message ? (
                            <>
                                <span aria-hidden> · </span>
                                {invite.message}
                            </>
                        ) : null}
                    </p>
                </div>
                {relative ? (
                    <time
                        className="body-xs shrink-0 whitespace-nowrap text-ink-subtle"
                        dateTime={invite.createdAt?.toISOString()}
                    >
                        {relative}
                    </time>
                ) : null}
            </Link>
        </li>
    );
}

/**
 * Owner analog of the broker Pipeline / Requests metric cards — same shell,
 * metric strip, and a scrollable body so the fixed card height is used.
 */
export function GlanceCard({ summary, visits, invites, now, className }: GlanceCardProps) {
    const visitRows = visits.slice(0, MAX_GLANCE_ROWS);
    const inviteSlots = Math.max(0, MAX_GLANCE_ROWS - visitRows.length);
    const inviteRows = invites.slice(0, inviteSlots);
    const hasRows = visitRows.length > 0 || inviteRows.length > 0;
    const remaining =
        Math.max(0, visits.length - visitRows.length) +
        Math.max(0, invites.length - inviteRows.length);

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="owner-glance-heading"
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <CardLabel info={GLANCE_INFO}>
                    <span id="owner-glance-heading">At a glance</span>
                </CardLabel>
                <TextLinkButton href={OWNER_PROPERTIES_HREF}>Your properties</TextLinkButton>
            </div>

            <MetricStrip label="Owner summary counts" className="mbs-3">
                <MetricCell
                    label="Listed"
                    value={summary.propertiesListed}
                    hint="Properties you have listed on the platform."
                />
                <MetricDivider />
                <MetricCell
                    label="Brokers"
                    value={summary.activeBrokers}
                    hint="Brokers currently approved to represent your properties."
                />
                <MetricDivider />
                <MetricCell
                    label="Waiting"
                    value={summary.pendingRequests}
                    hint="Broker requests waiting for your reply."
                    valueClassName={summary.pendingRequests > 0 ? "text-pending" : undefined}
                />
                <MetricDivider />
                <MetricCell
                    label="Visits"
                    value={summary.visitsScheduled}
                    hint="Site visits scheduled on your listings."
                />
                <MetricDivider />
                <MetricCell
                    label="Closed"
                    value={summary.dealsClosed}
                    hint="Property deals closed on your listings."
                    valueClassName={summary.dealsClosed > 0 ? "text-success" : undefined}
                />
            </MetricStrip>

            <div className="mbs-2 flex flex-1 flex-col overflow-hidden min-block-0">
                {hasRows ? (
                    <>
                        <p className="eyebrow shrink-0 text-ink-muted">Coming up</p>
                        <div
                            className="
                              mbs-1 flex-1 overflow-y-auto overscroll-contain scrollbar-none
                              [-ms-overflow-style:none] min-block-0
                              [&::-webkit-scrollbar]:hidden
                            "
                        >
                            <ul className="flex flex-col divide-y divide-border-warm">
                                {visitRows.map((visit) => (
                                    <GlanceVisitRow key={visit.id} visit={visit} now={now} />
                                ))}
                                {inviteRows.map((invite) => (
                                    <GlanceInviteRow key={invite.id} invite={invite} now={now} />
                                ))}
                            </ul>
                        </div>
                        {remaining > 0 ? (
                            <TextLinkButton
                                href={
                                    visits.length > visitRows.length
                                        ? OWNER_VISITS_HREF
                                        : ownerRequestsHref("invitations")
                                }
                                className="mbs-2 shrink-0"
                            >
                                {remaining === 1 ? "1 more" : `${remaining} more`}
                            </TextLinkButton>
                        ) : null}
                    </>
                ) : (
                    <div className="mbs-auto flex flex-col gap-2 pt-2">
                        <p className="body-sm text-pretty text-ink-muted">
                            Upcoming showings and broker invites will show here. Keep listings
                            current so brokers can represent them without calling you first.
                        </p>
                        <TextLinkButton href={OWNER_VISITS_HREF}>Manage visits</TextLinkButton>
                    </div>
                )}
            </div>
        </section>
    );
}
