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

function visitPriority(client: ClientRow): number {
    if (client.visit?.upcoming) return 0;
    if (client.visit?.needsUpdate) return 1;
    return 2;
}

/** A compact visit row, prioritising upcoming and unresolved appointments. */
function VisitRow({ client, now }: { client: ClientRow; now: Date }) {
    const visit = client.visit!;
    const label = visit.upcoming
        ? formatShowingWhen(visit.at, now)
        : `On ${formatDateShort(visit.at)}`;
    const status = visit.needsUpdate
        ? "Needs update"
        : (visitStatusLabel(visit.status) ?? (visit.upcoming ? "Booked" : "Visit logged"));
    const Icon = visit.upcoming ? CalendarClock : visit.needsUpdate ? Clock : CircleCheck;

    return (
        <li className="flex items-center gap-3 py-3 first:pbs-0 last:pbe-0">
            <span
                aria-hidden
                className={cn(
                    "flex shrink-0 items-center justify-center rounded-inner block-10 inline-10",
                    visit.upcoming
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
                    contactType="buyer"
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
                nativeButton={false}
                render={<Link href={brokerPipelineDealHref(client.id)} />}
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
    const needsUpdate = report.clients.filter((client) => client.visit?.needsUpdate).length;
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
            title="Site visit performance"
            titleId="analytics-visits-heading"
            description="Bookings and outcomes for this property"
            className={className}
        >
            <div className="flex flex-col gap-3 rounded-inner bg-surface-muted p-4">
                <div className="flex items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <p className="h3 text-ink tabular-nums">
                            {report.visits.clientsVisited} of {report.counts.total}
                        </p>
                        <p className="body-sm text-ink-muted">Clients have booked a visit</p>
                    </div>
                    <span className="body font-semibold text-brand tabular-nums">
                        {visitedPercent}%
                    </span>
                </div>
                <span
                    aria-hidden
                    className="block overflow-hidden rounded-full bg-border-warm block-2"
                >
                    <span
                        className="block rounded-full bg-brand block-full"
                        style={{ inlineSize: `${visitedPercent}%` }}
                    />
                </span>
            </div>

            <dl className="grid grid-cols-3 divide-x divide-border-warm text-center">
                <div className="px-2">
                    <dt className="body-xs text-ink-muted">Total visits</dt>
                    <dd className="h5 mbs-1 text-ink tabular-nums">{report.visits.total}</dd>
                </div>
                <div className="px-2">
                    <dt className="body-xs text-ink-muted">Upcoming</dt>
                    <dd className="h5 mbs-1 text-ink tabular-nums">{report.visits.upcoming}</dd>
                </div>
                <div className="px-2">
                    <dt className="body-xs text-ink-muted">Needs update</dt>
                    <dd
                        className={cn(
                            "h5 mbs-1 tabular-nums",
                            needsUpdate > 0 ? "text-urgent" : "text-ink",
                        )}
                    >
                        {needsUpdate}
                    </dd>
                </div>
            </dl>

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
                <p className="body-sm flex items-start gap-2 text-ink-muted">
                    <CalendarCheck aria-hidden className="mbs-px shrink-0 block-4 inline-4" />
                    No visits booked yet. Visit activity appears here once a client is scheduled.
                </p>
            )}

            {report.visits.total > 0 && report.visits.clientsVisited === 0 ? (
                <p className="body-xs text-ink-muted">
                    {plural(report.visits.total, "visit")} recorded without a linked client.
                </p>
            ) : null}
        </AnalyticsCard>
    );
}
