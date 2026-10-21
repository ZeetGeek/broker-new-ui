"use client";

import { useCallback, useMemo, useState } from "react";

import type { QuickChipCounts } from "@/features/properties/owner-listings/build-quick-chip-counts";
import { countSheetFilters } from "@/features/properties/owner-listings/filter-owner-listings";
import { OwnerListingsFilterSheet } from "@/features/properties/owner-listings/owner-listings-filter-sheet";
import { OwnerListingsQuickChips } from "@/features/properties/owner-listings/owner-listings-quick-chips";
import { OwnerListingsSearchBand } from "@/features/properties/owner-listings/owner-listings-search-band";
import type {
    OwnerListingItem,
    OwnerListingsBandFilters,
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingSort,
} from "@/features/properties/owner-listings/types";

export type OwnerListingsHeaderProps = {
    filters: OwnerListingsFilters;
    listings: OwnerListingItem[];
    filterContext: OwnerListingsFilterContext;
    chipCounts?: QuickChipCounts;
    readyToMoveCount?: number;
    isReadyToMoveCountLoading?: boolean;
    totalCount: number;
    locationsLoading: boolean;
    locationsError: boolean;
    onRetryLocations: () => void;
    isResultsLoading?: boolean;
    onApplyBand: (band: OwnerListingsBandFilters) => void;
    onApplySheet: (patch: Partial<OwnerListingsFilters>) => void;
    onToggleQuickChip: (
        key: "yourAreas" | "newToday" | "slotsOpen" | "commissionSet" | "readyToMove",
    ) => void;
    onSortChange: (sort: OwnerListingSort) => void;
};

export function OwnerListingsHeader({
    filters,
    listings,
    filterContext,
    chipCounts,
    readyToMoveCount,
    isReadyToMoveCountLoading,
    totalCount,
    locationsLoading,
    locationsError,
    onRetryLocations,
    isResultsLoading = false,
    onApplyBand,
    onApplySheet,
    onToggleQuickChip,
    onSortChange,
}: OwnerListingsHeaderProps) {
    const [sheetOpen, setSheetOpen] = useState(false);

    const sheetFilterCount = useMemo(() => countSheetFilters(filters), [filters]);

    const handleOpenFilters = useCallback(() => {
        setSheetOpen(true);
    }, []);

    const handleClearSheetFilters = useCallback(() => {
        onApplySheet({
            listedWithinDays: "",
            minCommissionPercent: "",
            maxCommissionPercent: "",
            minCommissionAmount: "",
            maxCommissionAmount: "",
            bhk: [],
            furnishing: "",
            readyToMove: false,
            cursor: "",
        });
    }, [onApplySheet]);

    return (
        <>
            <div className="sticky inset-bs-0 z-10 flex flex-col gap-6">
                <OwnerListingsSearchBand
                    appliedFilters={filters}
                    listings={listings}
                    locationsLoading={locationsLoading}
                    locationsError={locationsError}
                    onRetryLocations={onRetryLocations}
                    serviceAreas={filterContext.serviceAreas}
                    onApplyBand={onApplyBand}
                />

                <OwnerListingsQuickChips
                    filters={filters}
                    chipCounts={chipCounts}
                    readyToMoveCount={readyToMoveCount}
                    isReadyToMoveCountLoading={isReadyToMoveCountLoading}
                    sheetFilterCount={sheetFilterCount}
                    filtersMatchCount={totalCount}
                    isLoading={isResultsLoading}
                    onToggleQuickChip={onToggleQuickChip}
                    onOpenFilters={handleOpenFilters}
                    onClearSheetFilters={handleClearSheetFilters}
                    onQueryChange={(q) => onApplySheet({ q, cursor: "" })}
                    onSortChange={onSortChange}
                />
            </div>
            <OwnerListingsFilterSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                appliedFilters={filters}
                onApply={onApplySheet}
            />
        </>
    );
}
