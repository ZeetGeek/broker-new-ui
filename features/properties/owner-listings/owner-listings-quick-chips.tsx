"use client";

import { useEffect, useState } from "react";

import { Search, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type {
    QuickChipCounts,
    QuickChipKey,
} from "@/features/properties/owner-listings/build-quick-chip-counts";
import {
    formatChipCount,
    ownerListingsChipClassName,
    ownerListingsChipCountClassName,
} from "@/features/properties/owner-listings/owner-listings-chip-styles";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";
import { OwnerListingsSortMenu } from "@/features/properties/owner-listings/owner-listings-sort-menu";
import { OwnerListingsViewToggle } from "@/features/properties/owner-listings/owner-listings-view-toggle";
import type {
    OwnerListingsFilters,
    OwnerListingSort,
} from "@/features/properties/owner-listings/types";
import type { OwnerListingsView } from "@/features/properties/owner-listings/use-owner-listings-view";

type QuickChipConfig = {
    key: QuickChipKey;
    label: string;
    mobileLabel: string;
    description: string;
};

const QUICK_CHIPS: QuickChipConfig[] = [
    {
        key: "yourAreas",
        label: "Your areas",
        mobileLabel: "Areas",
        description: "Only listings in your service areas",
    },
    {
        key: "newToday",
        label: "New this week",
        mobileLabel: "New",
        description: "Created in the last 7 days",
    },
    {
        key: "slotsOpen",
        label: "Slots open",
        mobileLabel: "Slots",
        description: "Broker slots still available",
    },
    {
        key: "commissionSet",
        label: "Commission set",
        mobileLabel: "Commission",
        description: "Owner has set a commission",
    },
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
    isLoading?: boolean;
    onToggleQuickChip: (key: QuickChipKey) => void;
    onOpenFilters: () => void;
    onQueryChange: (q: string) => void;
    onSortChange: (sort: OwnerListingSort) => void;
    view: OwnerListingsView;
    onViewChange: (view: OwnerListingsView) => void;
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
            onChange={(event) => setDraft(event.target.value)}
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
              rounded-full border! border-border-warm bg-surface text-sm font-medium shadow-sm
              block-[38px]!
              hover:border-ink/25!
              focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20
            "
        />
    );
}

function QuickChipButton({
    chip,
    count,
    isActive,
    isLoading,
    onClick,
}: {
    chip: QuickChipConfig;
    count: number;
    isActive: boolean;
    isLoading?: boolean;
    onClick: () => void;
}) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <button
                        type="button"
                        className={ownerListingsChipClassName(isActive)}
                        onClick={onClick}
                        aria-pressed={isActive}
                    >
                        <span className="md:hidden">{chip.mobileLabel}</span>
                        <span className="hidden md:inline">{chip.label}</span>
                        <span className={ownerListingsChipCountClassName(isActive)}>
                            {formatChipCount(count, isLoading)}
                        </span>
                    </button>
                }
            />
            <TooltipContent side="bottom">{chip.description}</TooltipContent>
        </Tooltip>
    );
}

function FiltersChipButton({
    sheetFilterCount,
    isLoading,
    onClick,
}: {
    sheetFilterCount: number;
    isLoading?: boolean;
    onClick: () => void;
}) {
    const isActive = sheetFilterCount > 0;

    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <button
                        type="button"
                        className={cn(ownerListingsChipClassName(isActive), "gap-2")}
                        onClick={onClick}
                        aria-pressed={isActive}
                    >
                        <SlidersHorizontal
                            aria-hidden
                            className={cn(
                                "block-4 inline-4",
                                isActive ? "text-brand-text" : "text-brand",
                            )}
                            strokeWidth={1.75}
                        />
                        <span>Filters</span>
                        {sheetFilterCount > 0 ? (
                            <span className={ownerListingsChipCountClassName(isActive)}>
                                {formatChipCount(sheetFilterCount, isLoading)}
                            </span>
                        ) : null}
                    </button>
                }
            />
            <TooltipContent side="bottom">
                Advanced filters — area, timing, commission, and deal fit
            </TooltipContent>
        </Tooltip>
    );
}

export function OwnerListingsQuickChips({
    filters,
    chipCounts,
    sheetFilterCount,
    isLoading = false,
    onToggleQuickChip,
    onOpenFilters,
    onQueryChange,
    onSortChange,
    view,
    onViewChange,
}: OwnerListingsQuickChipsProps) {
    return (
        <TooltipProvider>
            <div className="flex items-center justify-between gap-3 sm:gap-4">
                <OwnerListingsChipsCarousel>
                    <OwnerListingsChipsCarouselSlide>
                        <FiltersChipButton
                            sheetFilterCount={sheetFilterCount}
                            isLoading={isLoading}
                            onClick={onOpenFilters}
                        />
                    </OwnerListingsChipsCarouselSlide>

                    {QUICK_CHIPS.filter(
                        (chip) => chip.key !== "yourAreas" || chipCounts.yourAreas > 0,
                    ).map((chip) => (
                        <OwnerListingsChipsCarouselSlide key={chip.key}>
                            <QuickChipButton
                                chip={chip}
                                count={chipCounts[chip.key]}
                                isActive={filters[chip.key]}
                                isLoading={isLoading}
                                onClick={() => onToggleQuickChip(chip.key)}
                            />
                        </OwnerListingsChipsCarouselSlide>
                    ))}
                </OwnerListingsChipsCarousel>

                <div className="flex shrink-0 items-center gap-2.5">
                    <OwnerListingsQueryInput value={filters.q} onChange={onQueryChange} />
                    <OwnerListingsViewToggle view={view} onViewChange={onViewChange} />
                    <OwnerListingsSortMenu filters={filters} onSortChange={onSortChange} />
                </div>
            </div>
        </TooltipProvider>
    );
}
