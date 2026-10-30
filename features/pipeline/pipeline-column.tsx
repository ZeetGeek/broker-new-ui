"use client";

import { Fragment } from "react";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { columnValue } from "@/features/pipeline/deal-attention";
import type { DealCardHandlers } from "@/features/pipeline/deal-card";
import { DraggableDealCard } from "@/features/pipeline/draggable-deal-card";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealItem, DealStage } from "@/features/pipeline/types";

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
    isDropTarget,
    visibleLimit,
    onLoadMore,
}: {
    stage: DealStage;
    deals: DealItem[];
    handlers: DealCardHandlers;
    busyId: string | null;
    pinnedDealIds: string[];
    isDropTarget: boolean;
    visibleLimit: number;
    onLoadMore: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: stage });
    const meta = DEAL_STAGE_META[stage];
    const highlighted = isDropTarget || isOver;
    const totals = columnValue(deals);
    // Keep pins ahead of the manually ordered normal cards before limiting.
    const orderedDeals = [...deals].sort(
        (a, b) => Number(pinnedDealIds.includes(b.id)) - Number(pinnedDealIds.includes(a.id)),
    );
    const visibleDeals = orderedDeals.slice(0, visibleLimit);
    const remaining = deals.length - visibleDeals.length;

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
            </header>

            {deals.length > 0 ? (
                // SortableContext is what makes the neighbours slide aside
                // under the pointer instead of the card jumping to its new
                // slot on drop.
                <SortableContext
                    items={visibleDeals.map((deal) => deal.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-3">
                        {visibleDeals.map((deal, index) => (
                            <Fragment key={deal.id}>
                                {index > 0 &&
                                pinnedDealIds.includes(visibleDeals[index - 1].id) &&
                                !pinnedDealIds.includes(deal.id) ? (
                                    <Separator
                                        className={cn(
                                            meta.columnClass,
                                            "border-bs bg-transparent!",
                                        )}
                                    />
                                ) : null}
                                <DraggableDealCard
                                    deal={deal}
                                    handlers={handlers}
                                    isBusy={busyId === deal.id}
                                    isPinned={pinnedDealIds.includes(deal.id)}
                                />
                            </Fragment>
                        ))}
                    </div>
                </SortableContext>
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
            {remaining > 0 ? (
                <Button
                    variant="outline"
                    size="md"
                    className="inline-full"
                    onClick={onLoadMore}
                    aria-label={`Load more ${meta.label.toLowerCase()} deals`}
                >
                    Load more deals
                    <span className="body-xs font-normal text-ink-muted">
                        ({remaining} remaining)
                    </span>
                </Button>
            ) : null}
        </section>
    );
}
