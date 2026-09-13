"use client";

import { useMemo, useState } from "react";

import {
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import type { DealItem, DealStage } from "@/features/pipeline/types";
import { DEAL_STAGE_ORDER, isLiveStage } from "@/features/pipeline/types";

export function usePipelineDnd({
    deals,
    onDrop,
}: {
    deals: DealItem[];
    onDrop: (dealId: string, stage: DealStage) => void;
}) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overStage, setOverStage] = useState<DealStage | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const activeDeal = useMemo(
        () => deals.find((deal) => deal.id === activeId) ?? null,
        [activeId, deals],
    );

    function handleDragStart(event: DragStartEvent) {
        setActiveId(String(event.active.id));
    }

    function handleDragOver(event: DragOverEvent) {
        const overId = event.over?.id;
        if (overId && DEAL_STAGE_ORDER.includes(overId as DealStage)) {
            setOverStage(overId as DealStage);
            return;
        }

        const overDeal = deals.find((deal) => deal.id === overId);
        if (overDeal && isLiveStage(overDeal.status)) {
            setOverStage(overDeal.status);
            return;
        }

        setOverStage(null);
    }

    function handleDragEnd(event: DragEndEvent) {
        const dealId = String(event.active.id);
        const overId = event.over?.id;
        setActiveId(null);
        setOverStage(null);

        if (!overId) return;

        let target: DealStage | null = null;
        if (DEAL_STAGE_ORDER.includes(overId as DealStage)) {
            target = overId as DealStage;
        } else {
            const overDeal = deals.find((deal) => deal.id === overId);
            if (overDeal && isLiveStage(overDeal.status)) target = overDeal.status;
        }

        const current = deals.find((deal) => deal.id === dealId);
        if (!current || !target || current.status === target) return;

        onDrop(dealId, target);
    }

    function handleDragCancel() {
        setActiveId(null);
        setOverStage(null);
    }

    return {
        sensors,
        activeId,
        activeDeal,
        overStage,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDragCancel,
    };
}
