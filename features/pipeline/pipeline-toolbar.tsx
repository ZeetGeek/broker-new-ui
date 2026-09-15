"use client";

import { type ReactNode, useEffect, useState } from "react";

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

import type {
    DealBoardLayout,
    DealsFilters,
    DealSort,
    DealTypeFilter,
} from "@/features/pipeline/types";

const SORT_OPTIONS: { value: DealSort; label: string }[] = [
    { value: "recent", label: "Newest first" },
    { value: "stalled", label: "Quietest first" },
    { value: "visit_soon", label: "Visit soonest" },
    { value: "price_desc", label: "Costliest first" },
    { value: "price_asc", label: "Cheapest first" },
];

const TYPE_OPTIONS: { value: DealTypeFilter; label: string }[] = [
    { value: "", label: "All types" },
    { value: "sale", label: "Sale" },
    { value: "rent", label: "Rent" },
];

function sortLabel(sort: DealSort): string {
    return SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Newest first";
}

const CHIP_CLASS = `
  body-sm flex shrink-0 items-center gap-1.5 rounded-control border border-border-warm bg-surface
  px-3 font-medium text-ink transition-colors duration-160 block-control-md
  hover:border-ink/25
`;

function PipelineQueryInput({ value, onChange }: { value: string; onChange: (q: string) => void }) {
    const [draft, setDraft] = useState(value);
    const [prevValue, setPrevValue] = useState(value);

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
            size="default"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search buyer, owner or area"
            aria-label="Search your deals"
            startIcon={Search}
            clearable
            wrapperClassName="min-inline-44 inline-44 sm:min-inline-52 sm:inline-52 lg:min-inline-64 lg:inline-64"
            className="
              rounded-control border! border-border-warm bg-surface font-medium shadow-sm
              hover:border-ink/25!
              focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20
            "
        />
    );
}

function FilterMenu({
    label,
    valueLabel,
    isDefault,
    children,
}: {
    label: string;
    valueLabel: string;
    isDefault: boolean;
    children: ReactNode;
}) {
    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <DropdownMenuTrigger
                            render={
                                <button
                                    type="button"
                                    className={cn(CHIP_CLASS, isDefault && "text-ink-muted")}
                                />
                            }
                        >
                            <span className="hidden sm:inline">{valueLabel}</span>
                            <span className="sm:hidden">{label}</span>
                            <ChevronDown
                                aria-hidden
                                className="block-4 inline-4"
                                strokeWidth={1.75}
                            />
                        </DropdownMenuTrigger>
                    }
                />
                <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">{children}</DropdownMenuContent>
        </DropdownMenu>
    );
}

export function PipelineToolbar({
    filters,
    boardLayout,
    localities,
    owners,
    onPatch,
    onBoardLayoutChange,
    trailing,
}: {
    filters: DealsFilters;
    boardLayout: DealBoardLayout;
    localities: string[];
    owners: string[];
    onPatch: (patch: Partial<DealsFilters>) => void;
    onBoardLayoutChange: (layout: DealBoardLayout) => void;
    /**
     * Pushed to the end of the same row. The summary chips live here so the
     * board opens with one control line instead of two.
     */
    trailing?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <PipelineQueryInput value={filters.q} onChange={(q) => onPatch({ q })} />

            <FilterMenu
                label="Deal type"
                valueLabel={
                    TYPE_OPTIONS.find((option) => option.value === filters.dealType)?.label ??
                    "All types"
                }
                isDefault={filters.dealType === ""}
            >
                {TYPE_OPTIONS.map((option) => (
                    <DropdownMenuItem
                        key={option.value || "all"}
                        onClick={() => onPatch({ dealType: option.value })}
                        className={cn(filters.dealType === option.value && "font-semibold")}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </FilterMenu>

            <FilterMenu
                label="Area"
                valueLabel={filters.locality || "Area"}
                isDefault={!filters.locality}
            >
                <DropdownMenuItem
                    onClick={() => onPatch({ locality: "" })}
                    className={cn(!filters.locality && "font-semibold")}
                >
                    All areas
                </DropdownMenuItem>
                {localities.map((locality) => (
                    <DropdownMenuItem
                        key={locality}
                        onClick={() => onPatch({ locality })}
                        className={cn(filters.locality === locality && "font-semibold")}
                    >
                        {locality}
                    </DropdownMenuItem>
                ))}
            </FilterMenu>

            <FilterMenu
                label="Owner"
                valueLabel={filters.ownerName || "Owner"}
                isDefault={!filters.ownerName}
            >
                <DropdownMenuItem
                    onClick={() => onPatch({ ownerName: "" })}
                    className={cn(!filters.ownerName && "font-semibold")}
                >
                    All owners
                </DropdownMenuItem>
                {owners.map((owner) => (
                    <DropdownMenuItem
                        key={owner}
                        onClick={() => onPatch({ ownerName: owner })}
                        className={cn(filters.ownerName === owner && "font-semibold")}
                    >
                        {owner}
                    </DropdownMenuItem>
                ))}
            </FilterMenu>

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
                                <span className="hidden sm:inline">{sortLabel(filters.sort)}</span>
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

            <div
                role="group"
                aria-label="Board or list"
                className="flex items-center gap-1 rounded-control bg-surface-muted p-1"
            >
                {(
                    [
                        { value: "board", label: "Board", icon: LayoutGrid },
                        { value: "list", label: "List", icon: List },
                    ] as const
                ).map((option) => {
                    const Icon = option.icon;
                    const isActive = boardLayout === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onBoardLayoutChange(option.value)}
                            className={cn(
                                `
                                  body-sm flex items-center gap-1.5 rounded-control px-3
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

            {trailing ? <div className="ms-auto flex items-center gap-2">{trailing}</div> : null}
        </div>
    );
}
