"use client";

import { type KeyboardEvent, useEffect, useId, useRef } from "react";

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
    panelId,
    idPrefix,
}: {
    active: DealStage;
    counts: StageCounts;
    onChange: (stage: DealStage) => void;
    className?: string;
    panelId?: string;
    idPrefix?: string;
}) {
    const generatedId = useId();
    const prefix = idPrefix ?? generatedId;
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const list = listRef.current;
        const selected = list?.querySelector<HTMLElement>('[aria-selected="true"]');
        if (!list || !selected) return;
        // Scroll only the tab strip; scrollIntoView can also move the whole page.
        const bounds = list.getBoundingClientRect();
        const tab = selected.getBoundingClientRect();
        if (tab.left < bounds.left) list.scrollLeft += tab.left - bounds.left;
        else if (tab.right > bounds.right) list.scrollLeft += tab.right - bounds.right;
    }, [active]);

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const index = DEAL_STAGE_ORDER.indexOf(active);
        const next =
            event.key === "ArrowRight"
                ? (index + 1) % DEAL_STAGE_ORDER.length
                : event.key === "ArrowLeft"
                  ? (index + DEAL_STAGE_ORDER.length - 1) % DEAL_STAGE_ORDER.length
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? DEAL_STAGE_ORDER.length - 1
                      : null;
        if (next == null) return;
        event.preventDefault();
        onChange(DEAL_STAGE_ORDER[next]);
        listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    }

    return (
        <div
            ref={listRef}
            role="tablist"
            aria-label="Deal stages"
            onKeyDown={onKeyDown}
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
                        id={`${prefix}-${stage}`}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={panelId}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onChange(stage)}
                        className={cn(
                            `
                              body-sm flex shrink-0 items-center gap-2 rounded-control px-4
                              transition-colors duration-160 block-control-lg
                              min-block-(--touch-target-min)
                              focus-visible:outline-2 focus-visible:-outline-offset-2
                              focus-visible:outline-ring
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
                        <span className={cn("tabular", !isActive && "text-ink-muted")}>
                            {counts[stage]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
