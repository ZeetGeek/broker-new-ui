"use client";

import { useState } from "react";

import { formatDateShort, formatShowingWhen, isSameCalendarDay } from "@/lib/format/date";
import { formatTelUrl } from "@/lib/format/phone";
import { plural } from "@/lib/format/plural";
import { brokerPipelineDealHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/empty-state";
import { ContactName } from "@/components/shared/contact-name";
import {
    type AppIcon,
    ArrowRight,
    CalendarCheck,
    CalendarClock,
    CallIcon,
    CircleCheck,
    Clock,
    HandCoins,
    PhoneCall,
} from "@/components/shared/icons";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";

import { AnalyticsCard } from "@/features/properties/property-analytics/analytics-card";
import {
    agoLabel,
    formatSideAmount,
    offerGapLabel,
    statusLabel,
    visitStatusLabel,
} from "@/features/properties/property-analytics/analytics-labels";
import type {
    AttentionItem,
    PropertyReport,
} from "@/features/properties/property-analytics/analytics-math";
import { isPreviewAnalyticsClient } from "@/features/properties/property-analytics/mock-property-analytics";

const COLLAPSED_COUNT = 5;

type Tone = "urgent" | "pending" | "brand" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
    // Orange only for time pressure: a visit today, a follow-up gone overdue.
    urgent: "bg-urgent-soft text-urgent",
    pending: "bg-pending/12 text-pending",
    brand: "bg-brand-soft text-brand-text",
    neutral: "bg-surface-muted text-ink-muted",
};

type Row = {
    icon: AppIcon;
    tone: Tone;
    title: string;
    detail: string;
    /** Calling is the next step; otherwise the deal page is. */
    call: boolean;
};

function describe(item: AttentionItem, closedWord: string, now: Date): Row {
    const { client } = item;
    switch (item.kind) {
        case "offer": {
            const offer = client.offer!;
            const gap = offerGapLabel(offer);
            return {
                icon: HandCoins,
                tone: "pending",
                title: `${formatSideAmount(offer.amountInr, offer.side)} offer waiting on the owner`,
                detail: gap ?? "Waiting for the owner to reply",
                call: false,
            };
        }
        case "visit_soon": {
            const visit = client.visit!;
            const status = visitStatusLabel(visit.status);
            return {
                icon: CalendarClock,
                tone: isSameCalendarDay(visit.at, now) ? "urgent" : "brand",
                title: `Site visit ${formatShowingWhen(visit.at, now)}`,
                detail: status ?? "Booked",
                call: true,
            };
        }
        case "visit_update":
            return {
                icon: CalendarCheck,
                tone: "neutral",
                title: `Visit on ${formatDateShort(client.visit!.at)} needs an update`,
                detail: "Mark how it went",
                call: false,
            };
        case "not_contacted":
            return {
                icon: PhoneCall,
                tone: "brand",
                title: "Not contacted yet",
                detail: client.addedAt ? `Added ${agoLabel(client.addedAt, now)}` : "New client",
                call: true,
            };
        case "quiet":
            return {
                icon: Clock,
                tone: "urgent",
                title: `No update for ${plural(client.idleDays ?? 0, "day")}`,
                detail: statusLabel(client.status, closedWord),
                call: true,
            };
    }
}

function AttentionRow({
    item,
    closedWord,
    now,
}: {
    item: AttentionItem;
    closedWord: string;
    now: Date;
}) {
    const { client } = item;
    const sample = isPreviewAnalyticsClient(client.id);
    const row = describe(item, closedWord, now);
    const dealHref = brokerPipelineDealHref(client.id);
    const canCall = row.call && client.phone != null;

    return (
        <li className="flex items-center gap-3 py-3 first:pbs-0 last:pbe-0">
            <span
                aria-hidden
                className={cn(
                    "flex shrink-0 items-center justify-center rounded-inner block-10 inline-10",
                    TONE_CLASS[row.tone],
                )}
            >
                <row.icon className="block-5 inline-5" strokeWidth={1.75} />
            </span>
            <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                <p className="body-sm font-semibold text-ink">{row.title}</p>
                <p className="body-sm text-ink-muted">
                    <ContactName
                        name={client.name}
                        contactId={client.clientId}
                        contactType={sample ? undefined : "buyer"}
                        className="font-medium text-ink hover:text-brand-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    />
                    {" · "}
                    {row.detail}
                </p>
            </div>
            {canCall ? (
                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    nativeButton={sample}
                    disabled={sample}
                    render={sample ? undefined : <a href={formatTelUrl(client.phone!)} />}
                    aria-label={`Call ${client.name}`}
                >
                    <CallIcon aria-hidden strokeWidth={1.75} />
                    Call
                </Button>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    nativeButton={sample}
                    disabled={sample}
                    render={sample ? undefined : <Link href={dealHref} />}
                    aria-label={`Open ${client.name}'s deal`}
                >
                    Open
                    <ArrowRight aria-hidden />
                </Button>
            )}
        </li>
    );
}

/**
 * The clients to act on today, one line each with the next step. Worked out
 * from stages, offers, visit dates and how long since the last update.
 */
export function AnalyticsAttention({
    report,
    now,
    className,
}: {
    report: PropertyReport;
    now: Date;
    className?: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const items = report.attention;
    const shown = expanded ? items : items.slice(0, COLLAPSED_COUNT);
    const hidden = items.length - shown.length;

    return (
        <AnalyticsCard
            title="Needs your attention"
            titleId="analytics-attention-heading"
            description={
                items.length > 0 ? `${plural(items.length, "client")} to follow up` : undefined
            }
            className={className}
        >
            {items.length === 0 ? (
                <EmptyState
                    size="card"
                    icon={CircleCheck}
                    heading="No follow-ups pending"
                    description="Every active client was updated in the last two weeks."
                />
            ) : (
                <>
                    <ul className="flex flex-col divide-y divide-border-warm">
                        {shown.map((item) => (
                            <AttentionRow
                                key={item.client.id}
                                item={item}
                                closedWord={report.closedWord}
                                now={now}
                            />
                        ))}
                    </ul>
                    {hidden > 0 || expanded ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="self-start"
                            onClick={() => setExpanded((open) => !open)}
                            aria-expanded={expanded}
                        >
                            {expanded ? "Show fewer" : `Show ${hidden} more`}
                        </Button>
                    ) : null}
                </>
            )}
        </AnalyticsCard>
    );
}
