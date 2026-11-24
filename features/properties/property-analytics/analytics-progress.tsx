import { cn } from "@/lib/utils";

import { AnalyticsCard } from "@/features/properties/property-analytics/analytics-card";
import {
    funnelStepLabel,
    statusDotClass,
    statusLabel,
} from "@/features/properties/property-analytics/analytics-labels";
import {
    type PropertyReport,
    STATUS_ORDER,
} from "@/features/properties/property-analytics/analytics-math";

import styles from "./analytics.module.css";

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
            description="How far clients have progressed on this property"
            className={className}
        >
            <ol className={styles.journeyRows}>
                {report.funnel.map((step) => {
                    const percent = Math.round(step.share * 100);
                    return (
                        <li key={step.key} className={styles.journeyRow}>
                            <span className="body-sm font-medium text-ink">
                                {funnelStepLabel(step.key, report.closedWord)}
                            </span>
                            <span className="body-sm flex items-baseline gap-3 tabular-nums">
                                <strong className="font-semibold text-ink">{step.count}</strong>
                                <span className="text-end text-ink-muted min-inline-9">
                                    {percent}%
                                </span>
                            </span>
                            <span aria-hidden className={styles.journeyTrack}>
                                <span
                                    className={styles.journeyFill}
                                    style={{ inlineSize: `${percent}%` }}
                                />
                            </span>
                        </li>
                    );
                })}
            </ol>
            <div className={styles.stageSection}>
                <h3 className="body-sm font-semibold text-ink">Current pipeline</h3>
                <div aria-hidden className="flex gap-1 overflow-hidden rounded-full block-2">
                    {stages.map((status) => (
                        <span
                            key={status}
                            className={cn("rounded-full", statusDotClass(status))}
                            style={{
                                inlineSize: `${(report.statusCounts[status] / Math.max(1, report.counts.total)) * 100}%`,
                            }}
                        />
                    ))}
                </div>
                <dl className={styles.stageLegend}>
                    {stages.map((status) => (
                        <div key={status} className="body-sm">
                            <span
                                aria-hidden
                                className={cn(
                                    "rounded-full block-2 inline-2",
                                    statusDotClass(status),
                                )}
                            />
                            <dt className="text-ink-muted">
                                {statusLabel(status, report.closedWord)}
                            </dt>
                            <dd className="font-semibold text-ink tabular-nums">
                                {report.statusCounts[status]}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </AnalyticsCard>
    );
}
