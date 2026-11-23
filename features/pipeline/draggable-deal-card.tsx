"use client";

import type { SyntheticEvent } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { measuredCssToRem } from "@/lib/styles/rem";
import { cn } from "@/lib/utils";

import { DealCard, type DealCardHandlers } from "@/features/pipeline/deal-card";
import type { DealItem } from "@/features/pipeline/types";

import styles from "./deal-card.module.css";

/** The card's background link can drag; its other links and controls stay independent. */
function canStartCardDrag(event: SyntheticEvent<HTMLElement>): boolean {
    if (event.defaultPrevented || !(event.target instanceof Element)) return false;
    const control = event.target.closest(
        "a, button, input, select, textarea, summary, [role='button'], [role='link'], [contenteditable]:not([contenteditable='false'])",
    );
    return !control || control === event.currentTarget || control.hasAttribute("data-card-link");
}

/**
 * A board card that can be reordered in its column and dragged to another.
 *
 * `useSortable` rather than `useDraggable`: sortable is what makes the other
 * cards slide out of the way under the pointer, which is the difference
 * between a card that jumps to a new place and one the broker can see landing.
 *
 * The whole card starts a drag after the sensor's distance/hold threshold.
 * Nested controls are excluded so contact actions and menus stay clickable.
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
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: deal.id,
        disabled: isBusy,
        attributes: { role: "group", roleDescription: "draggable deal" },
    });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            aria-label={`Reorder or move ${deal.buyer.name} on ${deal.property.title}`}
            data-dragging={isDragging || undefined}
            onMouseDown={(event) => {
                if (canStartCardDrag(event)) listeners?.onMouseDown?.(event);
            }}
            onTouchStart={(event) => {
                if (canStartCardDrag(event)) listeners?.onTouchStart?.(event);
            }}
            onKeyDown={(event) => {
                // Keyboard dragging belongs to the focused card, not its nested links/buttons.
                if (event.target === event.currentTarget) listeners?.onKeyDown?.(event);
            }}
            style={{
                // Transform and opacity only — docs/MOTION.md §4. dnd-kit
                // drives both on the compositor, so a column of cards reflows
                // without touching layout.
                transform: measuredCssToRem(CSS.Translate.toString(transform)),
                transition,
            }}
            // Keep native scrolling; TouchSensor distinguishes a hold from a swipe.
            // The dimmed placeholder comes from DealCard's `isDragging` style —
            // dimming here as well would stack the two opacities.
            className={cn(!isBusy && styles.draggable, isDragging && "relative z-10")}
        >
            <DealCard
                deal={deal}
                handlers={handlers}
                isBusy={isBusy}
                isPinned={isPinned}
                isDragging={isDragging}
            />
        </div>
    );
}
