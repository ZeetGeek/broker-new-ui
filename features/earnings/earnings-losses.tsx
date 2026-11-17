import { cn } from "@/lib/utils";

import { EarningsCard } from "@/features/earnings/earnings-card";
import type { EarningsReport } from "@/features/earnings/earnings-math";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function BarRow({
    label,
    count,
    max,
    barClass,
}: {
    label: string;
    count: number;
    max: number;
    barClass: string;
}) {
    return (
        <li className="flex flex-col gap-1.5">
            <div className="body-sm flex items-baseline justify-between gap-3">
                <span className="text-ink">{label}</span>
                <span className="font-semibold text-ink tabular-nums">{count}</span>
            </div>
            <span
                aria-hidden
                className="block overflow-hidden rounded-full bg-surface-muted block-1.5"
            >
                <span
                    className={cn("block rounded-full block-full", barClass)}
                    style={{ inlineSize: `${(count / Math.max(1, max)) * 100}%` }}
                />
            </span>
        </li>
    );
}

/** Why deals were lost, and at which stage they slipped. */
export function EarningsLosses({ report }: { report: EarningsReport }) {
    const { lostCount, lostReasons, lostWithoutReasonCount, lostFromStages } = report;
    const reasonMax = Math.max(0, ...lostReasons.map((r) => r.count));
    const stageMax = Math.max(0, ...lostFromStages.map((r) => r.count));

    return (
        <EarningsCard
            title="Why deals were lost"
            titleId="earnings-losses-heading"
            description={
                lostCount > 0 ? `${plural(lostCount, "deal")} lost in this period` : undefined
            }
            className="lg:col-span-5"
        >
            {lostCount === 0 ? (
                <p className="body-sm text-ink-muted">No deals were lost in this period.</p>
            ) : (
                <>
                    <div className="flex flex-col gap-3">
                        <h3 className="body-sm font-medium text-ink">Reason</h3>
                        {lostReasons.length > 0 ? (
                            <ul className="flex flex-col gap-3">
                                {lostReasons.map((row) => (
                                    <BarRow
                                        key={row.key}
                                        label={row.label}
                                        count={row.count}
                                        max={reasonMax}
                                        barClass="bg-danger-mid"
                                    />
                                ))}
                            </ul>
                        ) : null}
                        {lostWithoutReasonCount > 0 ? (
                            <p className="text-xs text-ink-muted">
                                {lostReasons.length > 0
                                    ? `${plural(lostWithoutReasonCount, "deal")} had no reason saved.`
                                    : "No reasons saved for these deals yet."}
                            </p>
                        ) : null}
                    </div>

                    {lostFromStages.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            <h3 className="body-sm font-medium text-ink">Stage it was lost at</h3>
                            <ul className="flex flex-col gap-3">
                                {lostFromStages.map((row) => (
                                    <BarRow
                                        key={row.stage}
                                        label={DEAL_STAGE_META[row.stage].label}
                                        count={row.count}
                                        max={stageMax}
                                        barClass={DEAL_STAGE_META[row.stage].dotClass}
                                    />
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </>
            )}
        </EarningsCard>
    );
}
