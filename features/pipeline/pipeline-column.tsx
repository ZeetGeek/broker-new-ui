"use client";

import Link from "next/link";

import { useDroppable } from "@dnd-kit/core";
import { GripVertical, MoreHorizontal, Plus } from "lucide-react";

import { BROKER_MY_DEALS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { columnValue, type OtherBuyer } from "@/features/pipeline/deal-attention";
import type { DealCardHandlers } from "@/features/pipeline/deal-card";
import { DraggableDealCard } from "@/features/pipeline/draggable-deal-card";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealItem, DealStage } from "@/features/pipeline/types";

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
                `flex snap-start flex-col gap-3 rounded-card p-3 min-inline-72 lg:min-inline-0`,
                highlighted
                    ? "border border-dashed border-brand bg-brand-soft/40"
                    : cn("border border-transparent", meta.trackClass),
            )}
        >
            <header className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-inline-0">
                    <GripVertical
                        aria-hidden
                        className="mbs-1 shrink-0 text-ink-subtle block-4 inline-4"
                        strokeWidth={1.75}
                    />
                    <div className="min-inline-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span
                                className={cn(
                                    "body-xs rounded-sm px-2 py-0.5 font-semibold",
                                    meta.pillClass,
                                )}
                            >
                                {meta.label}
                            </span>
                            <span className="body-sm tabular font-semibold text-ink">
                                {deals.length}
                            </span>
                        </div>
                        <div className="body-xs mbs-1 flex flex-col text-ink-muted">
                            {totals.sale || totals.rent ? (
                                <>
                                    {totals.sale ? (
                                        <span className="tabular">{totals.sale}</span>
                                    ) : null}
                                    {totals.rent ? (
                                        <span className="tabular">{totals.rent}</span>
                                    ) : null}
                                </>
                            ) : (
                                <span>—</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <DropdownMenuTrigger
                                        render={
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                aria-label={`${meta.label} column menu`}
                                                className="text-ink-muted"
                                            />
                                        }
                                    >
                                        <MoreHorizontal aria-hidden strokeWidth={1.75} />
                                    </DropdownMenuTrigger>
                                }
                            />
                            <TooltipContent>Column menu</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem render={<Link href={BROKER_MY_DEALS_HREF} />}>
                                Add a deal
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    nativeButton={false}
                                    aria-label={`Add a deal to ${meta.label}`}
                                    className="text-ink-muted"
                                    render={<Link href={BROKER_MY_DEALS_HREF} />}
                                />
                            }
                        >
                            <Plus aria-hidden strokeWidth={1.75} />
                        </TooltipTrigger>
                        <TooltipContent>Add deal</TooltipContent>
                    </Tooltip>
                </div>
            </header>

            {deals.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {deals.map((deal) => (
                        <div key={deal.id} className="relative">
                            {draggingId === deal.id ? (
                                <div
                                    aria-hidden
                                    className="
                                      rounded-card border border-dashed border-border-warm
                                      bg-surface-muted/60 block-48
                                    "
                                />
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
