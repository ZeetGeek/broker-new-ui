import { formatPersonName } from "@/lib/format/person-name";
import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import { ClientPipelineInfo } from "@/components/shared/client-pipeline-info";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";

import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { type DealStatus, isLiveStage } from "@/features/pipeline/types";
import { AnalyticsCard } from "@/features/properties/property-analytics/analytics-card";
import {
    funnelStepLabel,
    statusDotClass,
    statusLabel,
} from "@/features/properties/property-analytics/analytics-labels";
import {
    type ClientRow,
    type FunnelStep,
    hasReachedMilestone,
    type PropertyReport,
    STATUS_ORDER,
} from "@/features/properties/property-analytics/analytics-math";

import styles from "./analytics.module.css";

const VISIBLE_CLIENTS = 3;

const MILESTONE_STATUS: Record<FunnelStep["key"], DealStatus> = {
    added: "new",
    visited: "visit",
    offered: "negotiation",
    won: "closed",
};

function pipelineClients(clients: ClientRow[]) {
    return clients.map((client) => ({
        id: client.id,
        contactId: client.clientId,
        name: client.name,
        stage:
            client.status === "visit"
                ? "site_visit"
                : client.status === "closed"
                  ? "closed_won"
                  : client.status === "lost"
                    ? "closed_lost"
                    : client.status,
    }));
}

/** Static avatars inside the count trigger; the parent opens the full client list. */
function JourneyClientPreview({ clients }: { clients: ClientRow[] }) {
    return (
        <>
            {clients.length > 0 && (
                <span aria-hidden className={styles.journeyClientAvatars}>
                    {clients.slice(0, VISIBLE_CLIENTS).map((client) => (
                        <UserAvatar key={client.id} name={client.name} size="xxs" />
                    ))}
                </span>
            )}
            <span
                className={cn(
                    styles.journeyClientText,
                    clients.length === 0 && styles.journeyEmpty,
                )}
            >
                {clients.length === 1
                    ? formatPersonName(clients[0].name)
                    : plural(clients.length, "Client")}
            </span>
        </>
    );
}

/** Historical milestones and current stages, grouped with distinct labels. */
export function AnalyticsFunnel({
    report,
    className,
}: {
    report: PropertyReport;
    className?: string;
}) {
    const stages = STATUS_ORDER.filter((status) => report.statusCounts[status] > 0);
    return (
        <AnalyticsCard
            title="Client journey"
            titleId="analytics-funnel-heading"
            description="Clients can appear at more than one milestone."
            className={className}
        >
            <ol className={styles.journeyRows}>
                {report.funnel.map((step) => {
                    const percent = Math.round(step.share * 100);
                    const label = funnelStepLabel(step.key, report.closedWord);
                    const clients = report.clients.filter((client) =>
                        hasReachedMilestone(client, step.key),
                    );
                    return (
                        <li key={step.key} className={styles.journeyRow}>
                            <span
                                className={cn("body-sm font-medium text-ink", styles.journeyLabel)}
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        styles.journeyDot,
                                        statusDotClass(MILESTONE_STATUS[step.key]),
                                    )}
                                />
                                {label}
                            </span>
                            <div className={styles.journeyMetrics}>
                                <ClientPipelineInfo
                                    clients={pipelineClients(clients)}
                                    enabled={clients.length > VISIBLE_CLIENTS}
                                    openOnHover
                                    triggerLabel={`${label}: ${clients.length === 1 ? `${formatPersonName(clients[0].name)}, ` : ""}${plural(step.count, "client")}, ${percent}% of all clients. View client pipeline stages`}
                                    heading={`${label} · ${plural(step.count, "client")}`}
                                    emptyMessage="No clients have reached this milestone yet."
                                    className={cn("body-sm", styles.journeyValue)}
                                >
                                    <JourneyClientPreview clients={clients} />
                                </ClientPipelineInfo>
                                <span className={cn("body-sm", styles.journeyShare)}>
                                    {percent}%<span className="sr-only"> of all clients</span>
                                </span>
                            </div>
                            <span aria-hidden className={styles.journeyTrack}>
                                <span
                                    className={cn(
                                        styles.journeyFill,
                                        statusDotClass(MILESTONE_STATUS[step.key]),
                                    )}
                                    style={{ inlineSize: `${percent}%` }}
                                />
                            </span>
                        </li>
                    );
                })}
            </ol>
            <div className={styles.stageSection}>
                <h3 className="body-sm font-semibold text-ink">Where clients are now</h3>
                {stages.length > 1 ? (
                    <div aria-hidden className={styles.stageDistribution}>
                        {stages.map((status) => (
                            <span
                                key={status}
                                className={cn("rounded-full", statusDotClass(status))}
                                style={{
                                    flexGrow: report.statusCounts[status],
                                }}
                            />
                        ))}
                    </div>
                ) : null}
                {stages.length ? (
                    <dl className={styles.stageLegend}>
                        {stages.map((status) => {
                            const clients = report.clients.filter(
                                (client) => client.status === status,
                            );
                            return (
                                <div key={status} className="body-sm">
                                    <dt className="text-ink-muted">
                                        <Badge
                                            color="stone"
                                            className={cn(
                                                "[--badge-dot:currentColor]",
                                                isLiveStage(status)
                                                    ? DEAL_STAGE_META[status].pillClass
                                                    : status === "closed"
                                                      ? "bg-brand-soft text-brand-text"
                                                      : undefined,
                                            )}
                                        >
                                            {statusLabel(status, report.closedWord)}
                                        </Badge>
                                    </dt>
                                    <dd>
                                        <ClientPipelineInfo
                                            clients={pipelineClients(clients)}
                                            enabled={clients.length > VISIBLE_CLIENTS}
                                            openOnHover
                                            triggerLabel={`${statusLabel(status, report.closedWord)}: ${clients.length === 1 ? `${formatPersonName(clients[0].name)}, ` : ""}${plural(report.statusCounts[status], "client")}. View client pipeline stages`}
                                            heading={`${statusLabel(status, report.closedWord)} · ${plural(report.statusCounts[status], "client")}`}
                                            className={cn(
                                                "body-sm font-semibold text-ink tabular-nums",
                                                styles.journeyValue,
                                            )}
                                        >
                                            <JourneyClientPreview clients={clients} />
                                        </ClientPipelineInfo>
                                    </dd>
                                </div>
                            );
                        })}
                    </dl>
                ) : (
                    <p className="body-sm text-ink-muted">No clients on this property yet.</p>
                )}
            </div>
        </AnalyticsCard>
    );
}
