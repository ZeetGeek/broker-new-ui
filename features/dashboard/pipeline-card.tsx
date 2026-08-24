import { cn } from "@/lib/utils";

import { PIPELINE_STAGES } from "@/config/constants";

import { CardLabel } from "./card-label";
import type { PipelineStageCount } from "./mock-data";

export type PipelineCardProps = {
    activeClientCount: number;
    stages: PipelineStageCount[];
    className?: string;
};

export function PipelineCard({ activeClientCount, stages, className }: PipelineCardProps) {
    const maxCount = Math.max(...stages.map((s) => s.count), 1);
    const countById = new Map(stages.map((s) => [s.stageId, s.count]));

    return (
        <section
            className={cn("flex flex-col rounded-card bg-surface p-4 shadow-sm md:p-5", className)}
        >
            <div className="flex items-baseline justify-between gap-3">
                <CardLabel>Pipeline</CardLabel>
                <p className="body-sm tabular font-medium text-ink-muted">
                    {activeClientCount} active clients
                </p>
            </div>

            <ul className="mbs-5 flex flex-col gap-3">
                {PIPELINE_STAGES.map((stage, index) => {
                    const count = countById.get(stage.id) ?? 0;
                    const widthPct = Math.max((count / maxCount) * 100, count > 0 ? 8 : 0);
                    const isLead = index === 0;

                    return (
                        <li key={stage.id} className="flex items-center gap-3">
                            <span className="body-sm shrink-0 text-ink-muted inline-28">
                                {stage.label}
                            </span>
                            <div className="flex-1 min-inline-0">
                                <div
                                    className={cn(
                                        "rounded-full block-2",
                                        isLead ? "bg-brand" : "bg-brand-deep/80",
                                    )}
                                    style={{ width: `${widthPct}%` }}
                                    aria-hidden
                                />
                            </div>
                            <span
                                className="
                              tabular body-sm text-end font-semibold text-ink inline-6
                            "
                            >
                                {count}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
