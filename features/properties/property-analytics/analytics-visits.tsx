import { formatDateShort, formatShowingWhen } from "@/lib/format/date";
import { plural } from "@/lib/format/plural";
import { brokerPipelineDealHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

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
        <li className="flex items-center gap-3 py-3 first:pbs-0 last:pbe-0">
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
                    className="body-sm truncate font-semibold text-ink hover:text-brand-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
                <p className="body-sm truncate text-ink-muted">
                    {label} · {status}
                </p>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                aria-label={`Open ${client.name}'s deal`}
                nativeButton={sample}
                disabled={sample}
                render={sample ? undefined : <Link href={brokerPipelineDealHref(client.id)} />}
            >
                Open
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
            description="Bookings and the latest visit updates"
            className={className}
        >
            <dl className={styles.visitMetrics}>
                <div>
                    <dt className="body-xs text-ink-muted">Total visits</dt>
                    <dd className="h3 text-ink tabular-nums">{report.visits.total}</dd>
                </div>
                <div>
                    <dt className="body-xs text-ink-muted">Upcoming</dt>
                    <dd className="h3 text-ink tabular-nums">{report.visits.upcoming}</dd>
                </div>
                <div>
                    <dt className="body-xs text-ink-muted">Needs update</dt>
                    <dd
                        className={cn(
                            "h3 tabular-nums",
                            needsUpdate > 0 ? "text-urgent" : "text-ink",
                        )}
                    >
                        {needsUpdate}
                    </dd>
                </div>
            </dl>
            {report.visits.total > 0 ? (
                <div className="flex flex-col gap-2 border-bs border-border-warm pbs-4">
                    <p className="body-sm text-ink-muted">
                        <strong className="font-semibold text-ink">
                            {report.visits.clientsVisited} of {report.counts.total}
                        </strong>{" "}
                        clients booked a visit
                        <span className="float-end font-semibold text-brand tabular-nums">
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
                    <h3 className="body-sm font-semibold text-ink">Next and latest visits</h3>
                    <ul className="flex flex-col divide-y divide-border-warm">
                        {visitRows.map((client) => (
                            <VisitRow key={client.id} client={client} now={now} />
                        ))}
                    </ul>
                </div>
            ) : (
                <div className={styles.quietState}>
                    <CalendarCheck aria-hidden className="block-5 inline-5" />
                    <div className="flex flex-col gap-1">
                        <p className="body-sm font-medium text-ink">No visits booked yet</p>
                        <p className="body-sm text-ink-muted">
                            Schedule a visit from a client’s deal to see it here.
                        </p>
                    </div>
                </div>
            )}

            {report.visits.total > 0 && report.visits.clientsVisited === 0 ? (
                <p className="body-xs text-ink-muted">
                    {plural(report.visits.total, "visit")} recorded without a linked client.
                </p>
            ) : null}
        </AnalyticsCard>
    );
}
