import { cn } from "@/lib/utils";

import { columnValue } from "@/features/pipeline/deal-attention";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealItem, DealStage } from "@/features/pipeline/types";

/** One stage heading and total layout across phone and desktop columns. */
export function PipelineStageHeader({
    stage,
    deals,
    labelId,
}: {
    stage: DealStage;
    deals: DealItem[];
    labelId: string;
}) {
    const meta = DEAL_STAGE_META[stage];
    const totals = columnValue(deals);
    return (
        <header className="min-inline-0">
            <h2 id={labelId} className={cn("eyebrow truncate", meta.labelClass)}>
                {meta.label}
            </h2>
            <div className="mbs-1 flex items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-inline-0">
                    {totals.sale ? (
                        <span className="h6 tabular text-ink">{totals.sale}</span>
                    ) : null}
                    {totals.rent ? (
                        <span className="body-sm tabular font-semibold text-ink-muted">
                            {totals.rent}
                        </span>
                    ) : null}
                    {!totals.sale && !totals.rent ? (
                        <span className="h6 text-ink-subtle">—</span>
                    ) : null}
                </div>
                {deals.length > 0 ? (
                    <span className="body-sm shrink-0 text-ink-muted tabular-nums">
                        {deals.length} {deals.length === 1 ? "deal" : "deals"}
                    </span>
                ) : null}
            </div>
        </header>
    );
}
