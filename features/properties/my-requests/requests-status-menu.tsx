"use client";

import { useState } from "react";

import { ChevronDown, ListFilter } from "lucide-react";

import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    REQUEST_STAGE_META,
    REQUEST_STAGE_ORDER,
} from "@/features/properties/my-requests/request-stage-meta";
import type { RequestsSummary, RequestsViewFilter } from "@/features/properties/my-requests/types";
import { ownerListingsChipClassName } from "@/features/properties/owner-listings/owner-listings-chip-styles";

const VIEW_DESCRIPTIONS: Record<RequestsViewFilter, string> = {
    all: "Every request you have sent",
    pending: "Sent, but the owner has not replied",
    approved: "Request accepted, you can sell these",
    declined: "Rejected, you may still have attempts left",
    cancelled: "You cancelled these, attempts may remain",
    locked: "All attempts used, owner never replied",
    // These three are subsets of a stage above, so each says which one —
    // otherwise "Not opened" reads as a rival to "Waiting for reply".
    needs_buyer: "Accepted requests with no buyer added yet",
    not_opened: "Waiting requests the owner never opened",
};

const VIEW_LABELS: Record<RequestsViewFilter, string> = {
    all: "All requests",
    pending: REQUEST_STAGE_META.pending.label,
    approved: REQUEST_STAGE_META.approved.label,
    declined: REQUEST_STAGE_META.declined.label,
    cancelled: REQUEST_STAGE_META.cancelled.label,
    locked: REQUEST_STAGE_META.locked.label,
    needs_buyer: "Needs a buyer",
    not_opened: "Not opened yet",
};

/** Stage options first, then the three "needs your attention" shortcuts. */
const STAGE_VIEWS: RequestsViewFilter[] = ["all", ...REQUEST_STAGE_ORDER];
const FOCUS_VIEWS: RequestsViewFilter[] = ["needs_buyer", "not_opened"];

function countFor(summary: RequestsSummary | null, view: RequestsViewFilter): number {
    if (!summary) return 0;

    switch (view) {
        case "all":
            return summary.counts.all;
        case "needs_buyer":
            return summary.needsFollowUpCount;
        case "not_opened":
            return summary.unseenCount;
        default:
            return summary.counts[view];
    }
}

export type RequestsStatusMenuProps = {
    view: RequestsViewFilter;
    summary: RequestsSummary | null;
    isLoading?: boolean;
    onViewChange: (view: RequestsViewFilter) => void;
    className?: string;
};

function MenuRow({
    view,
    checked,
    count,
}: {
    view: RequestsViewFilter;
    checked: boolean;
    count: number;
}) {
    return (
        <DropdownMenuRadioItem
            value={view}
            className={cn(
                `
                  my-0.5 cursor-pointer! items-center gap-3 rounded-inner border border-transparent
                  px-2.5 py-2 pe-9 font-normal text-ink transition-[background-color,border-color]
                  duration-160
                `,
                "**:data-muted-line:text-ink-muted!",
                "**:data-[slot=dropdown-menu-radio-item-indicator]:text-brand",
                checked && "border-brand bg-brand-soft! text-ink!",
            )}
        >
            <span className="flex flex-1 flex-col gap-0.5 text-start min-inline-0">
                <span className="flex items-baseline gap-1.5">
                    <span className="truncate text-[15px] leading-snug font-medium">
                        {VIEW_LABELS[view]}
                    </span>
                    <span className="tabular shrink-0 text-[13px] text-ink-muted">{count}</span>
                </span>
                <span data-muted-line className="truncate text-[13px] leading-snug">
                    {VIEW_DESCRIPTIONS[view]}
                </span>
            </span>
        </DropdownMenuRadioItem>
    );
}

/**
 * The single filter control for this page — every way of narrowing the list
 * is one option here. Deliberately one-at-a-time: mixing a single-pick list
 * with multi-select toggles gave two identical-looking controls.
 */
export function RequestsStatusMenu({
    view,
    summary,
    isLoading = false,
    onViewChange,
    className,
}: RequestsStatusMenuProps) {
    const [open, setOpen] = useState(false);
    const isFiltered = view !== "all";

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                render={
                    <button
                        type="button"
                        aria-label="Choose which requests to show"
                        className={cn(
                            ownerListingsChipClassName(isFiltered),
                            "gap-2",
                            !isFiltered && "text-ink-muted",
                            className,
                        )}
                    >
                        <ListFilter
                            aria-hidden
                            className="text-brand block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        <span>{VIEW_LABELS[view]}</span>
                        {!isLoading ? (
                            <span
                                className={cn(
                                    "font-medium tabular-nums",
                                    isFiltered ? "text-brand-text/75" : "text-ink-muted",
                                )}
                            >
                                ( {countFor(summary, view)} )
                            </span>
                        ) : null}
                        <ChevronDown
                            aria-hidden
                            className="opacity-60 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                    </button>
                }
            />

            <DropdownMenuContent align="start" sideOffset={10} className="p-2 min-inline-72">
                <DropdownMenuRadioGroup
                    value={view}
                    onValueChange={(next) => {
                        onViewChange(next as RequestsViewFilter);
                        setOpen(false);
                    }}
                >
                    <p className="body-sm px-2.5 pbs-1 pbe-1 text-ink-muted">Request status</p>

                    {STAGE_VIEWS.map((option) => (
                        <MenuRow
                            key={option}
                            view={option}
                            checked={view === option}
                            count={countFor(summary, option)}
                        />
                    ))}

                    <DropdownMenuSeparator />

                    <p className="body-sm px-2.5 pbs-1 pbe-1 text-ink-muted">
                        Needs action from you
                    </p>

                    {FOCUS_VIEWS.map((option) => (
                        <MenuRow
                            key={option}
                            view={option}
                            checked={view === option}
                            count={countFor(summary, option)}
                        />
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
