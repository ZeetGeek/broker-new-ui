"use client";

import { SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

import type { QuickChipCounts, QuickChipKey } from "@/features/properties/owner-listings/build-quick-chip-counts";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";
import {
    formatChipCount,
    ownerListingsChipClassName,
    ownerListingsChipCountClassName,
} from "@/features/properties/owner-listings/owner-listings-chip-styles";
import { OwnerListingsSortMenu } from "@/features/properties/owner-listings/owner-listings-sort-menu";
import type { OwnerListingSort, OwnerListingsFilters } from "@/features/properties/owner-listings/types";
import type { OwnerListingsView } from "@/features/properties/owner-listings/use-owner-listings-view";
import { OwnerListingsViewToggle } from "@/features/properties/owner-listings/owner-listings-view-toggle";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        label: "New today",
        mobileLabel: "New",
        description: "Listed in the last 24 hours",
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
    onSortChange: (sort: OwnerListingSort) => void;
    view: OwnerListingsView;
    onViewChange: (view: OwnerListingsView) => void;
};

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
            <TooltipContent side="bottom">More filters — type, furnishing, and search</TooltipContent>
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
    onSortChange,
    view,
    onViewChange,
}: OwnerListingsQuickChipsProps) {
    return (
        <TooltipProvider>
            <div className="flex items-center justify-between gap-4">
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
                    <OwnerListingsViewToggle view={view} onViewChange={onViewChange} />
                    <OwnerListingsSortMenu filters={filters} onSortChange={onSortChange} />
                </div>
            </div>
        </TooltipProvider>
    );
}
