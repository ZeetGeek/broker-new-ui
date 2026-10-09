"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

import { type OtherBuyer } from "@/features/pipeline/deal-attention";
import { DealCard, type DealCardHandlers } from "@/features/pipeline/deal-card";
import type { DealItem } from "@/features/pipeline/types";

/**
 * A board card that can be reordered in its column and dragged to another.
 *
 * `useSortable` rather than `useDraggable`: sortable is what makes the other
 * cards slide out of the way under the pointer, which is the difference
 * between a card that jumps to a new place and one the broker can see landing.
 *
 * Only the handle starts a drag. The card face stays clickable — it opens the
 * deal — and its call, WhatsApp and note buttons keep working, which a drag
 * listener on the whole card made unreliable on touch.
 */
export function DraggableDealCard({
    deal,
    handlers,
    isBusy,
    isPinned,
    otherBuyers,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy: boolean;
    isPinned: boolean;
    otherBuyers: OtherBuyer[];
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: deal.id, disabled: isBusy });

    return (
        <div
            ref={setNodeRef}
            style={{
                // Transform and opacity only — docs/MOTION.md §4. dnd-kit
                // drives both on the compositor, so a column of cards reflows
                // without touching layout.
                transform: CSS.Translate.toString(transform),
                transition,
            }}
            className={cn(
                "touch-none",
                // The original stays in the column as a dimmed placeholder
                // holding its own height, so nothing below it jumps while the
                // DragOverlay copy follows the pointer.
                isDragging && "relative z-10 opacity-40",
            )}
        >
            <DealCard
                deal={deal}
                handlers={handlers}
                isBusy={isBusy}
                isPinned={isPinned}
                otherBuyers={otherBuyers}
                isDragging={isDragging}
                dragHandleRef={setActivatorNodeRef}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}
