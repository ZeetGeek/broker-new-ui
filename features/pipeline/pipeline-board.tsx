"use client";

import { useSyncExternalStore } from "react";

import {
    closestCorners,
    defaultDropAnimationSideEffects,
    DndContext,
    DragOverlay,
} from "@dnd-kit/core";

import type { OtherBuyer } from "@/features/pipeline/deal-attention";
import { DealCard, type DealCardHandlers } from "@/features/pipeline/deal-card";
import { PipelineColumn } from "@/features/pipeline/pipeline-column";
import { DEAL_STAGE_ORDER, type DealItem, type DealStage } from "@/features/pipeline/types";
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

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * dnd-kit drives its drop animation as a Web Animation from JS, so the CSS
 * `prefers-reduced-motion` blocks in globals.css never reach it — the setting
 * has to be read in JS and handed to the overlay.
 *
 * `useSyncExternalStore` rather than an effect: matchMedia is exactly the
 * external mutable source it exists for, and it keeps the value correct on the
 * first paint instead of after one.
 */
function subscribeReducedMotion(onChange: () => void): () => void {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

function getReducedMotion(): boolean {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** The server cannot know the preference; the client corrects it on hydration. */
function getReducedMotionServer(): boolean {
    return false;
}

export function PipelineBoard({
    dealsByStage,
    allLiveDeals,
    handlers,
    busyId,
    pinnedDealIds,
    otherBuyersByDealId,
    onDropDeal,
}: {
    dealsByStage: Record<DealStage, DealItem[]>;
    allLiveDeals: DealItem[];
    handlers: DealCardHandlers;
    busyId: string | null;
    pinnedDealIds: string[];
    otherBuyersByDealId: Record<string, OtherBuyer[]>;
    onDropDeal: (dealId: string, stage: DealStage) => void;
}) {
    const dnd = usePipelineDnd({
        deals: allLiveDeals,
        onDrop: onDropDeal,
    });

    const reduceMotion = useSyncExternalStore(
        subscribeReducedMotion,
        getReducedMotion,
        getReducedMotionServer,
    );

    return (
        <DndContext
            sensors={dnd.sensors}
            collisionDetection={closestCorners}
            onDragStart={dnd.handleDragStart}
            onDragOver={dnd.handleDragOver}
            onDragEnd={dnd.handleDragEnd}
            onDragCancel={dnd.handleDragCancel}
        >
            <div
                className="
                  hidden snap-x snap-mandatory items-start gap-3 overflow-x-auto
                  md:flex
                  lg:grid lg:snap-none lg:grid-cols-4 lg:gap-4 lg:overflow-visible
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
                        otherBuyersByDealId={otherBuyersByDealId}
                        isDropTarget={dnd.overStage === stage}
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
                            otherBuyers={otherBuyersByDealId[dnd.activeDeal.id] ?? []}
                            isDragging
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
