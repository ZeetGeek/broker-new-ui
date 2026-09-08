"use client";

import { useEffect, useState } from "react";

import { ArrowDownUp, ChevronDown, LayoutGrid, List, Search } from "lucide-react";

import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { DealsFilters, DealSort, DealsView } from "@/features/pipeline/types";

const SORT_OPTIONS: { value: DealSort; label: string }[] = [
    { value: "recent", label: "Newest first" },
    { value: "stalled", label: "Quietest first" },
    { value: "visit_soon", label: "Visit soonest" },
    { value: "price_desc", label: "Costliest first" },
    { value: "price_asc", label: "Cheapest first" },
];

function sortLabel(sort: DealSort): string {
    return SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Newest first";
}

const CHIP_CLASS = `
  body-sm flex shrink-0 items-center gap-2 rounded-control border border-border-warm bg-surface
  px-4 font-medium text-ink transition-colors duration-160 block-control-lg
  hover:border-ink/25
`;

/** Search is debounced so typing does not refetch on every keystroke. */
function PipelineQueryInput({ value, onChange }: { value: string; onChange: (q: string) => void }) {
    const [draft, setDraft] = useState(value);
    const [prevValue, setPrevValue] = useState(value);

    // An external change (cleared filters) wins over a stale draft.
    if (value !== prevValue) {
        setPrevValue(value);
        setDraft(value);
    }

    useEffect(() => {
        if (draft === value) return;
        const timer = window.setTimeout(() => onChange(draft), 300);
        return () => window.clearTimeout(timer);
    }, [draft, onChange, value]);

    return (
        <Input
            size="sm"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search buyer, owner or area"
            aria-label="Search your deals"
            startIcon={Search}
            clearable
            wrapperClassName="
              min-inline-44 inline-44 shadow-sm
              sm:min-inline-52 sm:inline-52
              lg:min-inline-64 lg:inline-64
            "
            className="
              rounded-full border! border-border-warm bg-surface text-sm font-medium shadow-sm
              block-[38px]!
              hover:border-ink/25!
              focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20
            "
        />
    );
}

export function PipelineHeader({
    filters,
    view,
    onViewChange,
    onPatch,
}: {
    filters: DealsFilters;
    view: DealsView;
    onViewChange: (view: DealsView) => void;
    onPatch: (patch: Partial<DealsFilters>) => void;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div
                role="group"
                aria-label="Which deals to show"
                className="flex items-center gap-1 rounded-control bg-surface-muted p-1"
            >
                {(
                    [
                        { value: "board", label: "Running", icon: LayoutGrid },
                        { value: "done", label: "Finished", icon: List },
                    ] as const
                ).map((option) => {
                    const Icon = option.icon;
                    const isActive = view === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onViewChange(option.value)}
                            className={cn(
                                `
                                  body-sm flex items-center gap-2 rounded-control px-3.5
                                  transition-colors duration-160 block-control-sm
                                `,
                                isActive
                                    ? "bg-surface font-semibold text-ink shadow-xs"
                                    : "font-normal text-ink-muted hover:text-ink",
                            )}
                        >
                            <Icon aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                            {option.label}
                        </button>
                    );
                })}
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
                <PipelineQueryInput value={filters.q} onChange={(q) => onPatch({ q })} />

                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <DropdownMenuTrigger
                                    render={
                                        <button
                                            type="button"
                                            className={cn(
                                                CHIP_CLASS,
                                                filters.sort === "recent" && "text-ink-muted",
                                            )}
                                        />
                                    }
                                >
                                    <ArrowDownUp
                                        aria-hidden
                                        className="text-brand block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                    <span className="hidden sm:inline">
                                        {sortLabel(filters.sort)}
                                    </span>
                                    <span className="sm:hidden">Sort</span>
                                    <ChevronDown
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                </DropdownMenuTrigger>
                            }
                        />
                        <TooltipContent side="bottom">Change the order of the cards.</TooltipContent>
                    </Tooltip>

                    <DropdownMenuContent align="end">
                        {SORT_OPTIONS.map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() => onPatch({ sort: option.value })}
                                className={cn(filters.sort === option.value && "font-semibold")}
                            >
                                {option.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
