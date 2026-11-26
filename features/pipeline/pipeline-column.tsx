"use client";

import { Fragment, useId } from "react";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import type { DealCardHandlers } from "@/features/pipeline/deal-card";
import { DraggableDealCard } from "@/features/pipeline/draggable-deal-card";
import { PipelineStageHeader } from "@/features/pipeline/pipeline-stage-header";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealItem, DealStage } from "@/features/pipeline/types";

import styles from "./pipeline-board.module.css";

export function PipelineColumn({
    stage,
    deals,
    handlers,
    busyId,
    pendingDealId,
    pinnedDealIds,
    isDropTarget,
    visibleLimit,
    onLoadMore,
}: {
    stage: DealStage;
    deals: DealItem[];
    handlers: DealCardHandlers;
    busyId: string | null;
    pendingDealId?: string;
    pinnedDealIds: string[];
    isDropTarget: boolean;
    visibleLimit: number;
    onLoadMore: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: stage });
    const meta = DEAL_STAGE_META[stage];
    const labelId = useId();
    const highlighted = isDropTarget || isOver;
    // Keep pins ahead of the manually ordered normal cards before limiting.
    const orderedDeals = [...deals].sort(
        (a, b) => Number(pinnedDealIds.includes(b.id)) - Number(pinnedDealIds.includes(a.id)),
    );
    const visibleDeals = orderedDeals.slice(0, visibleLimit);
    // The dropped card must have a destination node for the drop animation,
    // including when this column already fills its initial batch of cards.
    const pendingDeal = orderedDeals.find((deal) => deal.id === pendingDealId);
    if (pendingDeal && !visibleDeals.some((deal) => deal.id === pendingDeal.id)) {
        visibleDeals.push(pendingDeal);
    }
    const remaining = deals.length - visibleDeals.length;

    return (
        <section
            ref={setNodeRef}
            aria-labelledby={labelId}
            className={cn(
                `
                  flex snap-start flex-col gap-3 rounded-card border p-3 transition-colors
                  duration-160
                `,
                styles.column,
                // Dashed only while it is a live drop target. A permanent
                // dashed edge on a filled column reads as an empty slot.
                highlighted ? "border-dashed border-brand bg-brand-soft/40" : meta.columnClass,
            )}
        >
            <PipelineStageHeader stage={stage} deals={deals} labelId={labelId} />

            {deals.length > 0 ? (
                // SortableContext is what makes the neighbours slide aside
                // under the pointer instead of the card jumping to its new
                // slot on drop.
                <SortableContext
                    items={visibleDeals.map((deal) => deal.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-3">
                        {visibleDeals.map((deal, index) => (
                            <Fragment key={deal.id}>
                                {index > 0 &&
                                pinnedDealIds.includes(visibleDeals[index - 1].id) &&
                                !pinnedDealIds.includes(deal.id) ? (
                                    <Separator
                                        className={cn(
                                            meta.columnClass,
                                            "border-bs bg-transparent!",
                                        )}
                                    />
                                ) : null}
                                <DraggableDealCard
                                    deal={deal}
                                    handlers={handlers}
                                    isBusy={busyId === deal.id}
                                    isPinned={pinnedDealIds.includes(deal.id)}
                                />
                            </Fragment>
                        ))}
                    </div>
                </SortableContext>
            ) : (
                <p
                    className={cn(
                        `
                          body-sm rounded-card border border-dashed border-border-warm px-3 py-8
                          text-center text-ink-muted
                        `,
                        highlighted && "border-brand text-brand-text",
                    )}
                >
                    {highlighted ? "Drop here" : meta.emptyHint}
                </p>
            )}
            {remaining > 0 ? (
                <Button
                    variant="outline"
                    size="md"
                    className="shadow-md inline-full hover:shadow-lg"
                    onClick={onLoadMore}
                    // Starts with the visible text so voice control can target it.
                    aria-label={`Load more deals in ${meta.label}`}
                >
                    Load more deals
                    <span className="body-xs rounded-full bg-ink/5 px-1.5 font-semibold text-ink-muted tabular-nums min-inline-5">
                        {remaining}
                    </span>
                </Button>
            ) : null}
        </section>
    );
}
