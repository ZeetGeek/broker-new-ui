"use client";

import { useDraggable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

import { type OtherBuyer } from "@/features/pipeline/deal-attention";
import { DealCard, type DealCardHandlers } from "@/features/pipeline/deal-card";
import type { DealItem } from "@/features/pipeline/types";

export function DraggableDealCard({
    deal,
    handlers,
    isBusy,
    isPinned,
    otherBuyers,
    isHidden,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy: boolean;
    isPinned: boolean;
    otherBuyers: OtherBuyer[];
    isHidden: boolean;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: deal.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                isDragging ? "cursor-grabbing" : "cursor-grab",
                isHidden && "pointer-events-none absolute inset-0 opacity-0",
            )}
            {...listeners}
            {...attributes}
        >
            <DealCard
                deal={deal}
                handlers={handlers}
                isBusy={isBusy}
                isPinned={isPinned}
                otherBuyers={otherBuyers}
                isDragging={isDragging}
            />
        </div>
    );
}
