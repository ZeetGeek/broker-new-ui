"use client";

import { useEffect, useState } from "react";

import { Search, SlidersHorizontal } from "lucide-react";

import { FilterChip } from "@/components/shared/filter-chip";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";

import type {
    QuickChipCounts,
    QuickChipKey,
} from "@/features/properties/owner-listings/build-quick-chip-counts";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";
import { OwnerListingsSortMenu } from "@/features/properties/owner-listings/owner-listings-sort-menu";
import type {
    OwnerListingsFilters,
    OwnerListingSort,
} from "@/features/properties/owner-listings/types";

type QuickChipConfig = {
    key: QuickChipKey;
    label: string;
    mobileLabel: string;
    description: string;
};

/** Listed-age ("New this week") lives in Advanced filters → Listed. */
const QUICK_CHIPS: QuickChipConfig[] = [
    {
        key: "readyToMove",
        label: "Ready to move",
        mobileLabel: "Move-in",
        description: "Available for immediate possession",
    },
];

export type OwnerListingsQuickChipsProps = {
    filters: OwnerListingsFilters;
    chipCounts: QuickChipCounts;
    sheetFilterCount: number;
    /** Matching listings — same N as “Show N properties” in the sheet. */
    filtersMatchCount: number;
    isLoading?: boolean;
    onToggleQuickChip: (key: QuickChipKey) => void;
    onOpenFilters: () => void;
    onClearSheetFilters?: () => void;
    onQueryChange: (q: string) => void;
    onSortChange: (sort: OwnerListingSort) => void;
};

function OwnerListingsQueryInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (q: string) => void;
}) {
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
            placeholder="Search listings"
            aria-label="Search owner listings"
            startIcon={Search}
            clearable
            wrapperClassName="
              min-inline-44 inline-44 shadow-sm
              sm:min-inline-52 sm:inline-52
              lg:min-inline-64 lg:inline-64
            "
            className="
              rounded-control border! border-border-warm bg-surface text-sm font-medium shadow-sm
              block-[38px]!
              hover:border-ink/25!
              focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20
            "
        />
    );
}

export function OwnerListingsQuickChips({
    filters,
    chipCounts,
    sheetFilterCount,
    filtersMatchCount,
    isLoading = false,
    onToggleQuickChip,
    onOpenFilters,
    onClearSheetFilters,
    onQueryChange,
    onSortChange,
}: OwnerListingsQuickChipsProps) {
    return (
        <TooltipProvider>
            <div className="flex items-center justify-between gap-3 sm:gap-4">
                <OwnerListingsChipsCarousel>
                    <OwnerListingsChipsCarouselSlide>
                        <FilterChip
                            label="Filters"
                            icon={SlidersHorizontal}
                            count={filtersMatchCount}
                            isLoading={isLoading}
                            isActive={sheetFilterCount > 0}
                            clearable={sheetFilterCount > 0 && Boolean(onClearSheetFilters)}
                            onClick={onOpenFilters}
                            onClear={onClearSheetFilters}
                            description="Advanced filters — area, timing, and commission"
                        />
                    </OwnerListingsChipsCarouselSlide>

                    {QUICK_CHIPS.map((chip) => (
                        <OwnerListingsChipsCarouselSlide key={chip.key}>
                            <FilterChip
                                label={chip.label}
                                mobileLabel={chip.mobileLabel}
                                count={chipCounts[chip.key]}
                                isLoading={isLoading}
                                isActive={filters[chip.key]}
                                clearable
                                onClick={() => onToggleQuickChip(chip.key)}
                                description={chip.description}
                            />
                        </OwnerListingsChipsCarouselSlide>
                    ))}
                </OwnerListingsChipsCarousel>

                <div className="flex shrink-0 items-center gap-2.5">
                    <OwnerListingsQueryInput value={filters.q} onChange={onQueryChange} />
                    <OwnerListingsSortMenu filters={filters} onSortChange={onSortChange} />
                </div>
            </div>
        </TooltipProvider>
    );
}
