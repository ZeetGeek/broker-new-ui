"use client";

import { useMemo } from "react";

import {
    type Announcements,
    closestCorners,
    defaultDropAnimationSideEffects,
    DndContext,
    DragOverlay,
} from "@dnd-kit/core";
import { useReducedMotion } from "motion/react";

import { DealCard, type DealCardHandlers } from "@/features/pipeline/deal-card";
import { PipelineColumn } from "@/features/pipeline/pipeline-column";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import {
    DEAL_STAGE_ORDER,
    type DealItem,
    type DealStage,
    isLiveStage,
} from "@/features/pipeline/types";
import { applyStageOrder, usePipelineDnd } from "@/features/pipeline/use-pipeline-dnd";

/**
 * The card settles into its new slot instead of vanishing from under the
 * pointer. 220ms on the project's standard ease — docs/MOTION.md — while the
 * placeholder it leaves behind fades out as the overlay lands on it.
 */
const DROP_ANIMATION = {
    duration: 220,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    sideEffects: defaultDropAnimationSideEffects({
        styles: { active: { opacity: "0.4" } },
    }),
};

/** Same drop, no travel. docs/MOTION.md §5: degrade to instant, never broken. */
const DROP_ANIMATION_REDUCED = { ...DROP_ANIMATION, duration: 0 };

/** Screen-reader copy for a deal: client and property, never the raw id. */
function dealLabel(deals: DealItem[], id: string | number): string {
    const deal = deals.find((item) => item.id === String(id));
    return deal ? `${deal.buyer.name}, ${deal.property.title}` : "deal";
}

/** Where a pointer sits: a column, or the column of the card under it. */
function stageLabel(deals: DealItem[], id: string | number | undefined): string | null {
    if (id == null) return null;
    if ((DEAL_STAGE_ORDER as readonly string[]).includes(String(id))) {
        return DEAL_STAGE_META[id as DealStage].label;
    }
    const deal = deals.find((item) => item.id === String(id));
    return deal && isLiveStage(deal.status) ? DEAL_STAGE_META[deal.status].label : null;
}

export function PipelineBoard({
    dealsByStage,
    allLiveDeals,
    handlers,
    busyId,
    pinnedDealIds,
    onDropDeal,
    stageLimits,
    onLoadMore,
}: {
    dealsByStage: Record<DealStage, DealItem[]>;
    allLiveDeals: DealItem[];
    handlers: DealCardHandlers;
    busyId: string | null;
    pinnedDealIds: string[];
    onDropDeal: (dealId: string, stage: DealStage) => void;
    stageLimits: Record<DealStage, number>;
    onLoadMore: (stage: DealStage) => void;
}) {
    const dnd = usePipelineDnd({
        deals: allLiveDeals,
        pinnedDealIds,
        onDrop: onDropDeal,
    });

    // dnd-kit animates the drop from JS, so CSS media queries never reach it.
    // Motion's hook follows the root <MotionConfig reducedMotion="user">.
    const reduceMotion = useReducedMotion() ?? false;

    const announcements = useMemo<Announcements>(
        () => ({
            onDragStart: ({ active }) => `Picked up ${dealLabel(allLiveDeals, active.id)}.`,
            onDragOver: ({ active, over }) => {
                const stage = stageLabel(allLiveDeals, over?.id);
                return stage
                    ? `${dealLabel(allLiveDeals, active.id)} is over ${stage}.`
                    : `${dealLabel(allLiveDeals, active.id)} is not over a stage.`;
            },
            onDragEnd: ({ active, over }) => {
                const stage = stageLabel(allLiveDeals, over?.id);
                return stage
                    ? `Dropped ${dealLabel(allLiveDeals, active.id)} in ${stage}.`
                    : `${dealLabel(allLiveDeals, active.id)} was dropped. It stays where it was.`;
            },
            onDragCancel: ({ active }) =>
                `Moving ${dealLabel(allLiveDeals, active.id)} was cancelled. It stays where it was.`,
        }),
        [allLiveDeals],
    );

    return (
        <DndContext
            sensors={dnd.sensors}
            collisionDetection={closestCorners}
            onDragStart={dnd.handleDragStart}
            onDragOver={dnd.handleDragOver}
            onDragEnd={dnd.handleDragEnd}
            onDragCancel={dnd.handleDragCancel}
            accessibility={{ announcements }}
        >
            <div
                className="
                  hidden snap-x snap-mandatory items-stretch gap-3 overflow-x-auto
                  md:flex
                  lg:grid lg:snap-none lg:grid-cols-4 lg:gap-card-grid lg:overflow-visible
                "
            >
                {DEAL_STAGE_ORDER.map((stage) => (
                    <PipelineColumn
                        key={stage}
                        stage={stage}
                        deals={applyStageOrder(dealsByStage[stage], dnd.stageOrder[stage])}
                        handlers={handlers}
                        busyId={busyId}
                        pinnedDealIds={pinnedDealIds}
                        isDropTarget={dnd.overStage === stage}
                        visibleLimit={stageLimits[stage]}
                        onLoadMore={() => onLoadMore(stage)}
                    />
                ))}
            </div>

            {/* The overlay copy is what actually follows the pointer — it is
                outside the column's overflow, so a card dragged past a column
                edge is never clipped. */}
            <DragOverlay dropAnimation={reduceMotion ? DROP_ANIMATION_REDUCED : DROP_ANIMATION}>
                {dnd.activeDeal ? (
                    <div className="rotate-2 cursor-grabbing shadow-lg">
                        <DealCard
                            deal={dnd.activeDeal}
                            handlers={handlers}
                            isPinned={pinnedDealIds.includes(dnd.activeDeal.id)}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
