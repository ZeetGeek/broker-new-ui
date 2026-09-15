"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";

import { useDroppable } from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";

import { BROKER_MY_DEALS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { columnValue, type OtherBuyer } from "@/features/pipeline/deal-attention";
import type { DealCardHandlers } from "@/features/pipeline/deal-card";
import { DraggableDealCard } from "@/features/pipeline/draggable-deal-card";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealItem, DealStage } from "@/features/pipeline/types";

/**
 * The dashed slot a dragged card leaves behind. It measures its own sibling —
 * the dragged card is still mounted next to it, just positioned out of flow —
 * so the placeholder is exactly as tall as the card it stands in for whatever
 * the card's content happens to be.
 */
function DragGhost({ dealId }: { dealId: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [blockSize, setBlockSize] = useState<number>();

    useLayoutEffect(() => {
        const card = ref.current?.parentElement?.querySelector("article");
        if (card) setBlockSize(card.getBoundingClientRect().height);
    }, [dealId]);

    return (
        <div
            ref={ref}
            aria-hidden
            style={blockSize ? { blockSize } : undefined}
            className="rounded-card border border-dashed border-border-warm bg-surface-muted/60"
        />
    );
}

/**
 * Rent sits beside the sale total, deliberately quieter — the two are
 * different units (per month vs outright) and summing them would be a lie, so
 * the smaller type keeps them from reading as one figure.
 */
function RentTotal({ value }: { value: string }) {
    return <span className="body-sm tabular font-semibold text-ink-muted">{value}</span>;
}

export function PipelineColumn({
    stage,
    deals,
    handlers,
    busyId,
    pinnedDealIds,
    otherBuyersByDealId,
    isDropTarget,
    draggingId,
}: {
    stage: DealStage;
    deals: DealItem[];
    handlers: DealCardHandlers;
    busyId: string | null;
    pinnedDealIds: string[];
    otherBuyersByDealId: Record<string, OtherBuyer[]>;
    isDropTarget: boolean;
    draggingId: string | null;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: stage });
    const meta = DEAL_STAGE_META[stage];
    const highlighted = isDropTarget || isOver;
    const totals = columnValue(deals);

    return (
        <section
            ref={setNodeRef}
            className={cn(
                `
                  flex snap-start flex-col gap-3 rounded-card border p-3 transition-colors
                  duration-160 min-inline-72
                  lg:min-inline-0
                `,
                // Dashed only while it is a live drop target. A permanent
                // dashed edge on a filled column reads as an empty slot.
                highlighted ? "border-dashed border-brand bg-brand-soft/40" : meta.columnClass,
            )}
        >
            {/* Label above, money below. The value in this stage is the number
                a broker scans the board for, so it leads at heading size and
                the stage name sits above it as a quiet eyebrow — the count of
                deals rides alongside the money rather than competing with it. */}
            <header className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-inline-0">
                    <GripVertical
                        aria-hidden
                        className="mbs-0.5 shrink-0 text-ink-subtle block-4 inline-4"
                        strokeWidth={1.75}
                    />
                    <div className="min-inline-0">
                        {/* The stage hue lives on the label now. A filled pill
                            beside a heading-sized number read as two competing
                            marks. */}
                        <p className={cn("eyebrow truncate", meta.labelClass)}>{meta.label}</p>
                        <div className="mbs-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            {totals.sale || totals.rent ? (
                                <>
                                    {totals.sale ? (
                                        <span className="h6 tabular text-ink">{totals.sale}</span>
                                    ) : null}
                                    {totals.rent ? <RentTotal value={totals.rent} /> : null}
                                </>
                            ) : (
                                <span className="h6 tabular text-ink-subtle">—</span>
                            )}
                            <span className="body-sm tabular text-ink-muted">
                                {deals.length} {deals.length === 1 ? "deal" : "deals"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* The `+` is the whole menu. A dropdown whose only item was
                    "Add a deal", pointing at this same href, was two controls
                    for one action. */}
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                nativeButton={false}
                                aria-label={`Add a deal to ${meta.label}`}
                                className="shrink-0 text-ink-subtle hover:text-ink"
                                render={<Link href={BROKER_MY_DEALS_HREF} />}
                            />
                        }
                    >
                        <Plus aria-hidden strokeWidth={1.75} />
                    </TooltipTrigger>
                    <TooltipContent>Add deal</TooltipContent>
                </Tooltip>
            </header>

            {deals.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {deals.map((deal) => (
                        <div key={deal.id} className="relative">
                            {draggingId === deal.id ? (
                                // Holds the exact slot the dragged card left.
                                // The card goes `absolute` while dragging, so a
                                // fixed height here would collapse the column by
                                // the difference on every pick-up.
                                <DragGhost dealId={deal.id} />
                            ) : null}
                            <DraggableDealCard
                                deal={deal}
                                handlers={handlers}
                                isBusy={busyId === deal.id}
                                isPinned={pinnedDealIds.includes(deal.id)}
                                otherBuyers={otherBuyersByDealId[deal.id] ?? []}
                                isHidden={draggingId === deal.id}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <p
                    className={cn(
                        `
                          body-sm rounded-card border border-dashed border-border-warm px-3 py-8
                          text-center text-ink-muted
                        `,
                        highlighted && "border-brand text-brand-text",
                    )}
                >
                    {highlighted ? "Drop here" : "No deals here yet."}
                </p>
            )}
        </section>
    );
}
