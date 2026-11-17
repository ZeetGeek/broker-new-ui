import { plural } from "@/lib/format/plural";

import { EarningsCard } from "@/features/earnings/earnings-card";
import type { EarningsReport } from "@/features/earnings/earnings-math";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";

function BarRow({ label, count, total }: { label: string; count: number; total: number }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <li className="flex flex-col gap-1.5">
            <div className="body-sm flex items-baseline justify-between gap-3">
                <span className="text-ink">{label}</span>
                <span className="text-ink-muted tabular-nums">
                    <strong className="font-semibold text-ink">{count}</strong> · {pct}%
                </span>
            </div>
            <span
                aria-hidden
                className="block overflow-hidden rounded-full bg-surface-muted block-2"
            >
                <span
                    className="block rounded-full bg-ink-subtle/45 block-full"
                    style={{ inlineSize: `${Math.max(pct, 4)}%` }}
                />
            </span>
        </li>
    );
}

/** Why deals were lost, and at which stage they slipped. Neutral on purpose. */
export function EarningsLosses({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const { lostCount, lostReasons, lostWithoutReasonCount, lostFromStages } = report;

    return (
        <EarningsCard
            title="Why deals were lost"
            titleId="earnings-losses-heading"
            description={
                lostCount > 0 ? `${plural(lostCount, "deal")} lost in this period` : undefined
            }
            className={className}
        >
            {lostCount === 0 ? (
                <p className="body-sm text-ink-muted">No deals were lost in this period.</p>
            ) : (
                <>
                    {lostReasons.length > 0 ? (
                        <ul className="flex flex-col gap-3.5">
                            {lostReasons.map((row) => (
                                <BarRow
                                    key={row.key}
                                    label={row.label}
                                    count={row.count}
                                    total={lostCount}
                                />
                            ))}
                        </ul>
                    ) : null}
                    {lostWithoutReasonCount > 0 ? (
                        <p className="body-xs text-ink-muted">
                            {lostReasons.length > 0
                                ? `${plural(lostWithoutReasonCount, "deal")} had no reason saved.`
                                : "No reasons saved for these deals yet."}
                        </p>
                    ) : null}

                    {lostFromStages.length > 0 ? (
                        <div className="flex flex-col gap-2 border-bs border-border-warm pbs-4">
                            <h3 className="body-xs font-semibold text-ink-muted">
                                Where they slipped
                            </h3>
                            <ul className="flex flex-wrap gap-2">
                                {lostFromStages.map((row) => (
                                    <li
                                        key={row.stage}
                                        className="body-xs inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-ink"
                                    >
                                        {DEAL_STAGE_META[row.stage].label}
                                        <strong className="font-semibold tabular-nums">
                                            {row.count}
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </>
            )}
        </EarningsCard>
    );
}
