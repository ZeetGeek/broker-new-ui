import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import { AnalyticsCard } from "@/features/properties/property-analytics/analytics-card";
import {
    funnelStepLabel,
    statusDotClass,
    statusLabel,
} from "@/features/properties/property-analytics/analytics-labels";
import {
    type FunnelStep,
    type PropertyReport,
    STATUS_ORDER,
} from "@/features/properties/property-analytics/analytics-math";

const DROP_COPY: Record<Exclude<FunnelStep["key"], "added">, string> = {
    visited: "Most clients stop before booking a site visit.",
    offered: "Most clients stop between the visit and an offer.",
    won: "Most clients stop after making an offer.",
};

/** Where the most clients fell away, once there are enough to say. */
function biggestDrop(steps: FunnelStep[], total: number): string | null {
    if (total < 3) return null;
    let worst: { key: FunnelStep["key"]; lost: number } | null = null;
    for (let index = 1; index < steps.length; index += 1) {
        const lost = steps[index - 1].count - steps[index].count;
        if (lost >= 2 && (!worst || lost > worst.lost)) worst = { key: steps[index].key, lost };
    }
    if (!worst || worst.key === "added") return null;
    return DROP_COPY[worst.key];
}

/**
 * How far clients got — added, booked a visit, made an offer, closed. A lost
 * client still counts for the steps they reached.
 */
export function AnalyticsFunnel({
    report,
    className,
}: {
    report: PropertyReport;
    className?: string;
}) {
    const { funnel, counts, closedWord } = report;
    const drop = biggestDrop(funnel, counts.total);

    return (
        <AnalyticsCard
            title="Client journey"
            titleId="analytics-funnel-heading"
            description="How interest moved from a new client to a closed deal"
            className={className}
        >
            <ol className="grid grid-cols-4 items-end gap-3 block-52 sm:gap-4">
                {funnel.map((step) => {
                    const label = funnelStepLabel(step.key, closedWord);
                    const percent = Math.round(step.share * 100);
                    return (
                        <li key={step.key} className="flex flex-col gap-2 block-full min-inline-0">
                            <div className="flex flex-1 items-end overflow-hidden rounded-inner bg-surface-muted px-2 pbs-2">
                                {step.share > 0 ? (
                                    <span
                                        aria-hidden
                                        className={cn(
                                            "block inline-full min-block-3",
                                            step.key === "won" ? "bg-brand" : "bg-brand/55",
                                        )}
                                        style={{ blockSize: `${Math.max(8, percent)}%` }}
                                    />
                                ) : null}
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="h5 text-ink tabular-nums">{step.count}</span>
                                <span className="body-xs font-semibold text-ink">{label}</span>
                                <span className="body-xs text-ink-muted tabular-nums">
                                    {step.key === "added"
                                        ? "Starting point"
                                        : `${percent}% of clients`}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>
            {drop ? (
                <p className="body-sm rounded-inner bg-surface-muted px-3 py-2.5 text-ink-muted">
                    {drop}
                </p>
            ) : null}
        </AnalyticsCard>
    );
}

/** Current spread across the pipeline stages, including completed outcomes. */
export function AnalyticsStages({
    report,
    className,
}: {
    report: PropertyReport;
    className?: string;
}) {
    const { statusCounts, closedWord, counts } = report;
    const rows = STATUS_ORDER.filter((status) => statusCounts[status] > 0);

    return (
        <AnalyticsCard
            title="Current pipeline"
            titleId="analytics-stages-heading"
            description="Where every client is right now"
            className={cn("gap-5", className)}
        >
            <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <p className="h3 text-ink tabular-nums">{counts.active}</p>
                    <p className="body-sm text-ink-muted">Active clients still in play</p>
                </div>
                <p className="body-sm text-end text-ink-muted">
                    <strong className="font-semibold text-ink tabular-nums">{counts.total}</strong>{" "}
                    total
                </p>
            </div>

            <div
                aria-label={`${plural(counts.total, "client")} across ${plural(rows.length, "stage")}`}
                className="flex overflow-hidden rounded-full bg-surface-muted block-4"
                role="img"
            >
                {rows.map((status) => (
                    <span
                        key={status}
                        className={cn("block block-full", statusDotClass(status))}
                        style={{ inlineSize: `${(statusCounts[status] / counts.total) * 100}%` }}
                        title={`${statusLabel(status, closedWord)}: ${statusCounts[status]}`}
                    />
                ))}
            </div>

            <dl className="grid grid-cols-2 gap-4">
                {rows.map((status) => {
                    const share = Math.round((statusCounts[status] / counts.total) * 100);
                    return (
                        <div key={status} className="flex items-center gap-2 min-inline-0">
                            <span
                                aria-hidden
                                className={cn(
                                    "shrink-0 rounded-xs block-2 inline-2",
                                    statusDotClass(status),
                                )}
                            />
                            <div className="flex flex-1 items-baseline justify-between gap-2 min-inline-0">
                                <dt className="body-sm truncate font-medium text-ink">
                                    {statusLabel(status, closedWord)}
                                </dt>
                                <dd className="body-sm shrink-0 text-ink-muted tabular-nums">
                                    <strong className="font-semibold text-ink">
                                        {statusCounts[status]}
                                    </strong>{" "}
                                    · {share}%
                                </dd>
                            </div>
                        </div>
                    );
                })}
            </dl>
        </AnalyticsCard>
    );
}
