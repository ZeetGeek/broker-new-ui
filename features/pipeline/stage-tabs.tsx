"use client";

import { cn } from "@/lib/utils";

import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { DEAL_STAGE_ORDER, type DealStage, type StageCounts } from "@/features/pipeline/types";

/**
 * The mobile form of the board. A four-column drag surface does not fit a
 * 360px phone, so the stages become a scrollable row of tabs with one stage's
 * cards listed below — see docs/DESIGN.md §5.4.
 */
export function StageTabs({
    active,
    counts,
    onChange,
    className,
}: {
    active: DealStage;
    counts: StageCounts;
    onChange: (stage: DealStage) => void;
    className?: string;
}) {
    return (
        <div
            role="tablist"
            aria-label="Deal stages"
            className={cn(
                `
                  -mx-4 flex scrollbar-none gap-2 overflow-x-auto px-4 pbe-1
                  [-ms-overflow-style:none]
                  [&::-webkit-scrollbar]:hidden
                `,
                className,
            )}
        >
            {DEAL_STAGE_ORDER.map((stage) => {
                const meta = DEAL_STAGE_META[stage];
                const isActive = stage === active;

                return (
                    <button
                        key={stage}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(stage)}
                        className={cn(
                            `
                              body-sm flex shrink-0 items-center gap-2 rounded-control px-4
                              transition-colors duration-160 block-control-lg
                            `,
                            isActive
                                ? "bg-ink font-semibold text-surface"
                                : "bg-surface font-normal text-ink-muted hover:text-ink",
                        )}
                    >
                        <span
                            aria-hidden
                            className={cn("shrink-0 rounded-full block-2 inline-2", meta.dotClass)}
                        />
                        {meta.label}
                        <span className={cn("tabular", !isActive && "text-ink-subtle")}>
                            {counts[stage]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
