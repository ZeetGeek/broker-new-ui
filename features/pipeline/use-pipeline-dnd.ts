"use client";

import { useCallback, useMemo, useState } from "react";

import {
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import type { DealItem, DealStage } from "@/features/pipeline/types";
import { DEAL_STAGE_ORDER, isLiveStage } from "@/features/pipeline/types";

/** Manual order per stage, by deal id. Empty until the broker drags something. */
export type StageOrder = Partial<Record<DealStage, string[]>>;

function isStageId(value: unknown): value is DealStage {
    return DEAL_STAGE_ORDER.includes(value as DealStage);
}

/**
 * Board drag-and-drop: move a deal between stages, and reorder within one.
 *
 * Two things worth knowing about the ordering half:
 *
 * 1. It is **local to the session.** The API has no rank or position field —
 *    a deal's place in a column is derived from the sort — so a manual order
 *    is held here in React state and layered over that sort. It survives
 *    refetches while the page is open and is gone on reload. Persisting it
 *    needs a backend field; see AGENTS.md on the repo boundary.
 * 2. `onDrop` still fires only on a **stage change**, because that is the only
 *    half the API can store. Reordering inside a column never calls it.
 */
export function usePipelineDnd({
    deals,
    onDrop,
}: {
    deals: DealItem[];
    onDrop: (dealId: string, stage: DealStage) => void;
}) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overStage, setOverStage] = useState<DealStage | null>(null);
    const [stageOrder, setStageOrder] = useState<StageOrder>({});

    // Mouse and touch are separated so touch can carry a hold delay: on a
    // phone the board scrolls under the finger, and a distance-only constraint
    // would turn every scroll into a drag. `tolerance` lets the finger wobble
    // during the hold without cancelling it.
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const activeDeal = useMemo(
        () => deals.find((deal) => deal.id === activeId) ?? null,
        [activeId, deals],
    );

    /** The stage a pointer position resolves to — a column, or a card in one. */
    const resolveStage = useCallback(
        (overId: string | number | undefined): DealStage | null => {
            if (overId == null) return null;
            if (isStageId(overId)) return overId;
            const overDeal = deals.find((deal) => deal.id === overId);
            return overDeal && isLiveStage(overDeal.status) ? overDeal.status : null;
        },
        [deals],
    );

    function handleDragStart(event: DragStartEvent) {
        setActiveId(String(event.active.id));
    }

    function handleDragOver(event: DragOverEvent) {
        setOverStage(resolveStage(event.over?.id));
    }

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const dealId = String(event.active.id);
            const overId = event.over?.id;
            setActiveId(null);
            setOverStage(null);

            const target = resolveStage(overId);
            const current = deals.find((deal) => deal.id === dealId);
            if (!current || !target || !isLiveStage(current.status)) return;

            // Across columns: the stage change is the whole story, and the API
            // owns it. Any manual order for the old column is left alone — the
            // dropped card simply leaves it.
            if (current.status !== target) {
                onDrop(dealId, target);
                return;
            }

            // Within one column: reorder locally. Dropping on the column
            // background rather than on a card is a no-op — there is no
            // meaningful index to move to.
            if (overId == null || isStageId(overId) || overId === dealId) return;

            setStageOrder((prev) => {
                const inStage = deals.filter((deal) => deal.status === target);
                const ids = orderStageIds(
                    inStage.map((deal) => deal.id),
                    prev[target],
                );
                const from = ids.indexOf(dealId);
                const to = ids.indexOf(String(overId));
                if (from === -1 || to === -1 || from === to) return prev;
                return { ...prev, [target]: arrayMove(ids, from, to) };
            });
        },
        [deals, onDrop, resolveStage],
    );

    function handleDragCancel() {
        setActiveId(null);
        setOverStage(null);
    }

    return {
        sensors,
        activeId,
        activeDeal,
        overStage,
        stageOrder,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDragCancel,
    };
}

/**
 * Applies a manual order to a stage's deals.
 *
 * Ids the manual order does not mention — a deal that arrived from the API, or
 * was dragged in from another column since — keep their sorted position at the
 * front rather than being dropped or silently sent to the end. A card must
 * never disappear because of a stale ordering entry.
 */
function orderStageIds(currentIds: string[], manual: string[] | undefined): string[] {
    if (!manual?.length) return currentIds;
    const present = new Set(currentIds);
    const ranked = manual.filter((id) => present.has(id));
    const rest = currentIds.filter((id) => !ranked.includes(id));
    return [...rest, ...ranked];
}

/** Orders one stage's deals by the session's manual order, when it has one. */
export function applyStageOrder(deals: DealItem[], manual: string[] | undefined): DealItem[] {
    if (!manual?.length) return deals;
    const byId = new Map(deals.map((deal) => [deal.id, deal]));
    return orderStageIds(
        deals.map((deal) => deal.id),
        manual,
    ).flatMap((id) => {
        const deal = byId.get(id);
        return deal ? [deal] : [];
    });
}
