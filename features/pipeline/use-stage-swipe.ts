"use client";

import { type TouchEvent, useRef } from "react";

import { DEAL_STAGE_ORDER, type DealStage } from "@/features/pipeline/types";

const SWIPE_PX = 50;
/** Horizontal travel must clearly beat vertical, so a diagonal scroll never flips stage. */
const HORIZONTAL_DOMINANCE = 1.5;

export function useStageSwipe(active: DealStage, onChange: (stage: DealStage) => void) {
    const start = useRef<{ x: number; y: number } | null>(null);

    function onTouchStart(event: TouchEvent) {
        const touch = event.touches[0];
        // A second finger (pinch-zoom) is not a swipe.
        start.current =
            touch && event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
    }

    function onTouchCancel() {
        start.current = null;
    }

    function onTouchEnd(event: TouchEvent) {
        if (start.current == null) return;
        const touch = event.changedTouches[0];
        const delta = (touch?.clientX ?? start.current.x) - start.current.x;
        const deltaY = (touch?.clientY ?? start.current.y) - start.current.y;
        start.current = null;

        if (Math.abs(delta) < SWIPE_PX) return;
        if (Math.abs(delta) < Math.abs(deltaY) * HORIZONTAL_DOMINANCE) return;

        const index = DEAL_STAGE_ORDER.indexOf(active);
        if (delta < 0 && index < DEAL_STAGE_ORDER.length - 1) {
            onChange(DEAL_STAGE_ORDER[index + 1]);
        }
        if (delta > 0 && index > 0) {
            onChange(DEAL_STAGE_ORDER[index - 1]);
        }
    }

    return { onTouchStart, onTouchEnd, onTouchCancel };
}
