"use client";

import type { DashboardOwnerSummary } from "@/lib/api/dashboard";
import { OWNER_PROPERTIES_HREF } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { TextLinkButton } from "@/components/shared/text-link-button";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";
import { MetricCell, MetricDivider, MetricStrip } from "./metric-strip";

const GLANCE_INFO = "A quick count of your listings, brokers, requests, and property deals closed.";

export type GlanceCardProps = {
    summary: DashboardOwnerSummary;
    className?: string;
};

/**
 * Owner analog of the broker Pipeline / Requests metric cards — same shell,
 * metric strip, and quiet footer; portal-specific numbers only.
 */
export function GlanceCard({ summary, className }: GlanceCardProps) {
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

            <MetricStrip label="Owner summary counts">
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
                    label="Closed"
                    value={summary.dealsClosed}
                    hint="Property deals closed on your listings."
                    valueClassName={summary.dealsClosed > 0 ? "text-success" : undefined}
                />
            </MetricStrip>

            <div className="mbs-auto flex flex-col gap-3 pt-4">
                <p className="body-sm text-ink-muted">
                    Keep listings current so brokers can represent them without calling you first.
                </p>
            </div>
        </section>
    );
}
