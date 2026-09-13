"use client";

import { type TouchEvent, useRef } from "react";

import { DEAL_STAGE_ORDER, type DealStage } from "@/features/pipeline/types";

const SWIPE_PX = 50;

export function useStageSwipe(active: DealStage, onChange: (stage: DealStage) => void) {
    const startX = useRef<number | null>(null);

    function onTouchStart(event: TouchEvent) {
        startX.current = event.touches[0]?.clientX ?? null;
    }

    function onTouchEnd(event: TouchEvent) {
        if (startX.current == null) return;
        const endX = event.changedTouches[0]?.clientX ?? startX.current;
        const delta = endX - startX.current;
        startX.current = null;

        if (Math.abs(delta) < SWIPE_PX) return;

        const index = DEAL_STAGE_ORDER.indexOf(active);
        if (delta < 0 && index < DEAL_STAGE_ORDER.length - 1) {
            onChange(DEAL_STAGE_ORDER[index + 1]);
        }
        if (delta > 0 && index > 0) {
            onChange(DEAL_STAGE_ORDER[index - 1]);
        }
    }

    return { onTouchStart, onTouchEnd };
}
