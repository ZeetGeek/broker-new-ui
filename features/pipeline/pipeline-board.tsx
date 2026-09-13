"use client";

import { closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";

import type { OtherBuyer } from "@/features/pipeline/deal-attention";
import { DealCard, type DealCardHandlers } from "@/features/pipeline/deal-card";
import { PipelineColumn } from "@/features/pipeline/pipeline-column";
import { DEAL_STAGE_ORDER, type DealItem, type DealStage } from "@/features/pipeline/types";
import { usePipelineDnd } from "@/features/pipeline/use-pipeline-dnd";

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
                  hidden snap-x snap-mandatory gap-5 overflow-x-auto
                  md:flex
                  lg:grid lg:snap-none lg:grid-cols-4 lg:overflow-visible
                "
            >
                {DEAL_STAGE_ORDER.map((stage) => (
                    <PipelineColumn
                        key={stage}
                        stage={stage}
                        deals={dealsByStage[stage]}
                        handlers={handlers}
                        busyId={busyId}
                        pinnedDealIds={pinnedDealIds}
                        otherBuyersByDealId={otherBuyersByDealId}
                        isDropTarget={dnd.overStage === stage}
                        draggingId={dnd.activeId}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={null}>
                {dnd.activeDeal ? (
                    <div className="rotate-3 cursor-grabbing shadow-md">
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
