"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

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
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy: boolean;
    isPinned: boolean;
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
            // No `touch-none` here: only the handle needs it (it sets its own),
            // so a swipe that starts on the card face still scrolls the board.
            // The dimmed placeholder comes from DealCard's `isDragging` style —
            // dimming here as well would stack the two opacities.
            className={cn(isDragging && "relative z-10")}
        >
            <DealCard
                deal={deal}
                handlers={handlers}
                isBusy={isBusy}
                isPinned={isPinned}
                isDragging={isDragging}
                dragHandleRef={setActivatorNodeRef}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}
