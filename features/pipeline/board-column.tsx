"use client";

import { type DragEvent, useState } from "react";

import { cn } from "@/lib/utils";

import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { DealCard, type DealCardHandlers } from "@/features/pipeline/deal-card";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealItem, DealStage } from "@/features/pipeline/types";

/**
 * One kanban column. Drag-and-drop uses the native HTML5 API rather than a
 * library: every card also carries a menu and a "move to next stage" button,
 * so dragging is an accelerator for mouse users and never the only way to
 * move a deal. That keeps the board usable on a phone and with a keyboard.
 */
export function BoardColumn({
    stage,
    deals,
    handlers,
    busyId,
    onDropDeal,
}: {
    stage: DealStage;
    deals: DealItem[];
    handlers: DealCardHandlers;
    busyId: string | null;
    onDropDeal: (dealId: string, stage: DealStage) => void;
}) {
    const [isOver, setIsOver] = useState(false);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const meta = DEAL_STAGE_META[stage];

    function handleDragOver(event: DragEvent<HTMLDivElement>) {
        // Preventing default is what marks this a valid drop target.
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        if (!isOver) setIsOver(true);
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setIsOver(false);

        const dealId = event.dataTransfer.getData("text/deal-id");
        if (dealId) onDropDeal(dealId, stage);
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={() => setIsOver(false)}
            onDrop={handleDrop}
            className={cn(
                `flex flex-col gap-3 rounded-card p-2 transition-colors duration-160 min-inline-0`,
                isOver ? "bg-brand-soft/60" : "bg-surface-muted/40",
            )}
        >
            <div className="flex items-center justify-between gap-2 px-1 pbs-1">
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <div className="flex cursor-help items-center gap-2 min-inline-0">
                                <span
                                    aria-hidden
                                    className={cn(
                                        "shrink-0 rounded-full block-2 inline-2",
                                        meta.dotClass,
                                    )}
                                />
                                <h3 className="body-sm truncate font-semibold text-ink">
                                    {meta.label}
                                </h3>
                            </div>
                        }
                    />
                    <TooltipContent side="bottom">{meta.hint}</TooltipContent>
                </Tooltip>

                <span className="body-xs tabular shrink-0 text-ink-muted">{deals.length}</span>
            </div>

            {deals.length > 0 ? (
                <WindowVirtualGrid
                    items={deals}
                    getKey={(deal) => deal.id}
                    estimateRowHeight={520}
                    gap={10}
                    overscan={2}
                    ariaLabel={`${meta.label} deals`}
                    renderItem={(deal) => (
                        <div
                            draggable
                            onDragStart={(event) => {
                                event.dataTransfer.setData("text/deal-id", deal.id);
                                event.dataTransfer.effectAllowed = "move";
                                setDraggingId(deal.id);
                            }}
                            onDragEnd={() => setDraggingId(null)}
                        >
                            <DealCard
                                deal={deal}
                                handlers={handlers}
                                isBusy={busyId === deal.id}
                                isDragging={draggingId === deal.id}
                            />
                        </div>
                    )}
                />
            ) : (
                <p
                    className={cn(
                        `
                          body-xs rounded-inner border border-dashed border-border-warm px-3 py-6
                          text-center text-ink-subtle
                        `,
                        isOver && "border-brand text-brand-text",
                    )}
                >
                    {isOver ? `Move here` : `Nothing in ${meta.label.toLowerCase()}`}
                </p>
            )}
        </div>
    );
}
