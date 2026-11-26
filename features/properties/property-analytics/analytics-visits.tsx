import { formatDateShort, formatShowingWhen } from "@/lib/format/date";
import { plural } from "@/lib/format/plural";
import { brokerPipelineDealHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/empty-state";
import { ContactName } from "@/components/shared/contact-name";
import {
    ArrowRight,
    CalendarCheck,
    CalendarClock,
    CircleCheck,
    Clock,
} from "@/components/shared/icons";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";

import { AnalyticsCard } from "@/features/properties/property-analytics/analytics-card";
import { visitStatusLabel } from "@/features/properties/property-analytics/analytics-labels";
import type {
    ClientRow,
    PropertyReport,
} from "@/features/properties/property-analytics/analytics-math";
import { isPreviewAnalyticsClient } from "@/features/properties/property-analytics/mock-property-analytics";

import styles from "./analytics.module.css";

function visitPriority(client: ClientRow): number {
    if (client.visit?.running) return 0;
    if (client.visit?.upcoming) return 1;
    if (client.visit?.needsUpdate) return 2;
    return 3;
}

/** A compact visit row, prioritising upcoming and unresolved appointments. */
function VisitRow({ client, now }: { client: ClientRow; now: Date }) {
    const sample = isPreviewAnalyticsClient(client.id);
    const visit = client.visit!;
    const label = visit.upcoming
        ? formatShowingWhen(visit.at, now)
        : `On ${formatDateShort(visit.at)}`;
    const status = visit.running
        ? "Happening now"
        : visit.needsUpdate
          ? "Needs update"
          : (visitStatusLabel(visit.status) ?? (visit.upcoming ? "Booked" : "Visit logged"));
    const Icon =
        visit.upcoming || visit.running ? CalendarClock : visit.needsUpdate ? Clock : CircleCheck;

    return (
        <li className={styles.visitRow}>
            <span
                aria-hidden
                className={cn(
                    "flex shrink-0 items-center justify-center rounded-inner block-10 inline-10",
                    visit.upcoming || visit.running
                        ? "bg-brand-soft text-brand-text"
                        : visit.needsUpdate
                          ? "bg-urgent-soft text-urgent"
                          : "bg-surface-muted text-ink-muted",
                )}
            >
                <Icon className="block-5 inline-5" strokeWidth={1.75} />
            </span>
            <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                <ContactName
                    name={client.name}
                    contactId={client.clientId}
                    contactType={sample ? undefined : "buyer"}
                    className="body-sm font-semibold wrap-anywhere text-ink hover:text-brand-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
                <p className="body-sm wrap-anywhere text-ink-muted">{label}</p>
                <p
                    className={cn(
                        "body-xs font-medium",
                        visit.needsUpdate ? "text-urgent" : "text-ink-muted",
                    )}
                >
                    {status}
                </p>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className={styles.visitRowAction}
                aria-label={`Open ${client.name}'s deal`}
                nativeButton={sample}
                disabled={sample}
                render={sample ? undefined : <Link href={brokerPipelineDealHref(client.id)} />}
            >
                Open deal
                <ArrowRight aria-hidden />
            </Button>
        </li>
    );
}

/** Visit volume, reach and the next appointments for this property. */
export function AnalyticsVisits({
    report,
    now,
    className,
}: {
    report: PropertyReport;
    now: Date;
    className?: string;
}) {
    const visitedShare =
        report.counts.total > 0 ? report.visits.clientsVisited / report.counts.total : 0;
    const visitedPercent = Math.round(visitedShare * 100);
    const needsUpdate = report.visits.needsUpdate;
    const visitRows = report.clients
        .filter((client) => client.visit != null)
        .sort((a, b) => {
            const priority = visitPriority(a) - visitPriority(b);
            if (priority !== 0) return priority;
            if (a.visit?.upcoming && b.visit?.upcoming) {
                return a.visit.at.getTime() - b.visit.at.getTime();
            }
            return (b.visit?.at.getTime() ?? 0) - (a.visit?.at.getTime() ?? 0);
        })
        .slice(0, 3);

    return (
        <AnalyticsCard
            title="Site visits"
            titleId="analytics-visits-heading"
            description="Upcoming visits and outcomes to record."
            className={className}
        >
            <dl className={styles.visitMetrics}>
                <div>
                    <dt className="body-sm text-ink-muted">Total visits</dt>
                    <dd
                        className={cn(
                            "h3 tabular-nums",
                            report.visits.total > 0 ? "text-ink" : "text-ink-subtle",
                        )}
                    >
                        {report.visits.total}
                    </dd>
                </div>
                <div>
                    <dt className="body-sm text-ink-muted">Upcoming</dt>
                    <dd
                        className={cn(
                            "h3 tabular-nums",
                            report.visits.upcoming > 0 ? "text-ink" : "text-ink-subtle",
                        )}
                    >
                        {report.visits.upcoming}
                    </dd>
                </div>
                <div>
                    <dt className="body-sm text-ink-muted">Outcome needed</dt>
                    <dd
                        className={cn(
                            "h3 tabular-nums",
                            needsUpdate > 0 ? "text-urgent" : "text-ink-subtle",
                        )}
                    >
                        {needsUpdate}
                    </dd>
                </div>
            </dl>
            {report.visits.total > 0 ? (
                <div className="flex flex-col gap-2">
                    <p className={cn("body-sm text-ink-muted", styles.visitReach)}>
                        <span>
                            <strong className="font-semibold text-ink">
                                {report.visits.clientsVisited} of {report.counts.total}
                            </strong>{" "}
                            clients booked a visit
                        </span>
                        <span className="font-semibold text-brand tabular-nums">
                            {visitedPercent}%
                        </span>
                    </p>
                    <span
                        aria-hidden
                        className="overflow-hidden rounded-full bg-surface-muted block-2"
                    >
                        <span
                            className="block rounded-full bg-brand block-full"
                            style={{ inlineSize: `${visitedPercent}%` }}
                        />
                    </span>
                </div>
            ) : null}

            {visitRows.length > 0 ? (
                <div className="flex flex-col gap-2 border-bs border-border-warm pbs-4">
                    <h3 className="body-sm font-semibold text-ink">Upcoming and recent visits</h3>
                    <ul className="flex flex-col divide-y divide-border-warm">
                        {visitRows.map((client) => (
                            <VisitRow key={client.id} client={client} now={now} />
                        ))}
                    </ul>
                </div>
            ) : (
                <EmptyState
                    size="card"
                    icon={CalendarCheck}
                    heading={
                        report.visits.total > 0
                            ? "No appointment details available"
                            : "Book the first site visit"
                    }
                    description={
                        report.visits.total > 0
                            ? "Visits are recorded, but their dates and outcomes aren't available here."
                            : "Choose a client below, then open their deal to schedule a visit."
                    }
                    action={
                        report.visits.total === 0 && report.counts.total > 0
                            ? {
                                  label: "Choose a client",
                                  icon: ArrowRight,
                                  href: "#analytics-clients-heading",
                              }
                            : undefined
                    }
                />
            )}

            {report.visits.total > 0 && report.visits.clientsVisited === 0 ? (
                <p className="body-xs text-ink-muted">
                    {plural(report.visits.total, "visit")} recorded without a linked client.
                </p>
            ) : null}
        </AnalyticsCard>
    );
}
