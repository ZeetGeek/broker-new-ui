"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
    EMPTY_PROPERTY_CRITERIA,
    normalizePropertyCriteria,
    propertyCriteriaCount,
} from "@/lib/properties/list-criteria";
import { cn } from "@/lib/utils";

import { FilterChip, filterChipClassName } from "@/components/shared/filter-chip";
import { ArrowDownUp, ChevronDown, Search, SlidersHorizontal } from "@/components/shared/icons";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { DealsFilters, DealSort } from "@/features/pipeline/types";
import { OwnerListingsFilterSheet } from "@/features/properties/owner-listings/owner-listings-filter-sheet";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";

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
            size="sm"
            value={draft}
            onValueChange={setDraft}
            placeholder="Search client, owner or area"
            aria-label="Search your deals"
            startIcon={Search}
            clearable
            wrapperClassName="rounded-control shadow-sm min-inline-44 inline-44 sm:min-inline-52 sm:inline-52 lg:min-inline-64 lg:inline-64"
            className="
              rounded-control border! border-border-warm bg-surface text-sm font-medium shadow-sm
              block-[38px]!
              hover:border-ink/25!
              focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20
            "
        />
    );
}

export function PipelineToolbar({
    filters,
    onPatch,
    leading,
}: {
    filters: DealsFilters;
    onPatch: (patch: Partial<DealsFilters>) => void;
    /** Page-specific controls beside Filters on the left. */
    leading?: ReactNode;
}) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const discoveryFilters = useMemo(
        () =>
            normalizePropertyCriteria({
                ...filters.propertyFilters,
                type: filters.dealType,
                where: filters.propertyFilters?.where ?? filters.locality,
            }),
        [filters.propertyFilters, filters.dealType, filters.locality],
    );
    const appliedFilters = useMemo(
        () => ({ ...DEFAULT_OWNER_LISTINGS_FILTERS, ...discoveryFilters }),
        [discoveryFilters],
    );
    const filterCount = propertyCriteriaCount(discoveryFilters);

    return (
        <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <FilterChip
                    label="Filters"
                    icon={SlidersHorizontal}
                    count={filterCount}
                    isActive={filterCount > 0}
                    clearable={filterCount > 0}
                    onClick={() => setSheetOpen(true)}
                    onClear={() =>
                        onPatch({
                            propertyFilters: { ...EMPTY_PROPERTY_CRITERIA },
                            dealType: "",
                            locality: "",
                            ownerName: "",
                        })
                    }
                    description="Location, budget and property filters"
                />
                {leading}
                <div className="ms-auto flex items-center gap-2">
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
                                                    filterChipClassName(filters.sort !== "recent"),
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
                            <TooltipContent side="bottom">
                                Change the order of the cards.
                            </TooltipContent>
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
            <OwnerListingsFilterSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                appliedFilters={appliedFilters}
                discoveryFilters={discoveryFilters}
                showDiscoveryFilters
                onApply={(patch, discovery) => {
                    const criteriaPatch = Object.fromEntries(
                        Object.keys(EMPTY_PROPERTY_CRITERIA)
                            .filter((key) => key in patch)
                            .map((key) => [key, patch[key as keyof typeof patch]]),
                    );
                    const next = normalizePropertyCriteria({ ...discovery, ...criteriaPatch });
                    onPatch({
                        propertyFilters: { ...next, type: "" },
                        dealType: next.type,
                        locality: "",
                        ownerName: "",
                    });
                }}
            />
        </>
    );
}
