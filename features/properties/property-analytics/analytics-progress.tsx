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

function Bar({ share, className }: { share: number; className: string }) {
    return (
        <span aria-hidden className="block overflow-hidden rounded-full bg-surface-muted block-2">
            {share > 0 ? (
                <span
                    className={cn("block rounded-full block-full min-inline-2", className)}
                    style={{ inlineSize: `${Math.min(100, share * 100)}%` }}
                />
            ) : null}
        </span>
    );
}

/**
 * How far clients got — added, booked a visit, made an offer, closed. A lost
 * client still counts for the steps they reached, so this shows where
 * interest turns into deals, not today's workload.
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
            title="How far clients got"
            titleId="analytics-funnel-heading"
            description="Counts every client who reached a step, including those lost later"
            className={className}
        >
            <ol className="flex flex-col gap-4">
                {funnel.map((step) => {
                    const label = funnelStepLabel(step.key, closedWord);
                    const percent = Math.round(step.share * 100);
                    return (
                        <li key={step.key} className="flex flex-col gap-1.5">
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="body-sm font-semibold text-ink">{label}</span>
                                {step.count > 0 ? (
                                    <span className="body-sm text-ink-muted tabular-nums">
                                        <span className="font-semibold text-ink">{step.count}</span>
                                        {step.key === "added" ? null : ` · ${percent}%`}
                                    </span>
                                ) : (
                                    <span className="body-sm text-ink-muted">None yet</span>
                                )}
                            </div>
                            <Bar
                                share={step.share}
                                className={step.key === "won" ? "bg-brand" : "bg-brand/70"}
                            />
                        </li>
                    );
                })}
            </ol>
            {drop ? <p className="body-sm text-ink-muted">{drop}</p> : null}
        </AnalyticsCard>
    );
}

/** Today's spread across the pipeline stages, in board order. Empty stages are left out. */
export function AnalyticsStages({
    report,
    className,
}: {
    report: PropertyReport;
    className?: string;
}) {
    const { statusCounts, closedWord, counts } = report;
    const rows = STATUS_ORDER.filter((status) => statusCounts[status] > 0);
    const max = Math.max(1, ...rows.map((status) => statusCounts[status]));

    return (
        <AnalyticsCard
            title="Where clients are now"
            titleId="analytics-stages-heading"
            description={`${plural(counts.total, "client")}, same stages as your pipeline`}
            className={className}
        >
            <dl className="flex flex-col gap-3.5">
                {rows.map((status) => (
                    <div key={status} className="flex items-center gap-3">
                        <dt className="body-sm flex shrink-0 items-center gap-2 font-medium text-ink inline-28">
                            <span
                                aria-hidden
                                className={cn(
                                    "shrink-0 rounded-full block-2 inline-2",
                                    statusDotClass(status),
                                )}
                            />
                            <span className="truncate">{statusLabel(status, closedWord)}</span>
                        </dt>
                        <dd className="flex flex-1 items-center gap-3 min-inline-0">
                            <span className="flex-1 min-inline-0">
                                <Bar
                                    share={statusCounts[status] / max}
                                    className={statusDotClass(status)}
                                />
                            </span>
                            <span className="body-sm text-end font-semibold text-ink tabular-nums min-inline-6">
                                {statusCounts[status]}
                            </span>
                        </dd>
                    </div>
                ))}
            </dl>
        </AnalyticsCard>
    );
}
