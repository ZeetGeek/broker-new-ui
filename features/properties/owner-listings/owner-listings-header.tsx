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
import type { OwnerListingsView } from "@/features/properties/owner-listings/use-owner-listings-view";

export type OwnerListingsHeaderProps = {
    filters: OwnerListingsFilters;
    listings: OwnerListingItem[];
    filterContext: OwnerListingsFilterContext;
    chipCounts: QuickChipCounts;
    poolListings: OwnerListingItem[];
    isResultsLoading?: boolean;
    onApplyBand: (band: OwnerListingsBandFilters) => void;
    onApplySheet: (patch: Partial<OwnerListingsFilters>) => void;
    onToggleQuickChip: (
        key:
            | "yourAreas"
            | "newToday"
            | "slotsOpen"
            | "commissionSet"
            | "readyToMove"
            | "bookmarked",
    ) => void;
    onSortChange: (sort: OwnerListingSort) => void;
    view: OwnerListingsView;
    onViewChange: (view: OwnerListingsView) => void;
};

export function OwnerListingsHeader({
    filters,
    listings,
    filterContext,
    chipCounts,
    poolListings,
    isResultsLoading = false,
    onApplyBand,
    onApplySheet,
    onToggleQuickChip,
    onSortChange,
    view,
    onViewChange,
}: OwnerListingsHeaderProps) {
    const [sheetOpen, setSheetOpen] = useState(false);

    const sheetFilterCount = useMemo(() => countSheetFilters(filters), [filters]);

    const handleOpenFilters = useCallback(() => {
        setSheetOpen(true);
    }, []);

    return (
        <>
            <div className="sticky inset-bs-0 z-10 flex flex-col gap-6">
                <OwnerListingsSearchBand
                    appliedFilters={filters}
                    listings={listings}
                    serviceAreas={filterContext.serviceAreas}
                    onApplyBand={onApplyBand}
                />

                <OwnerListingsQuickChips
                    filters={filters}
                    chipCounts={chipCounts}
                    sheetFilterCount={sheetFilterCount}
                    isLoading={isResultsLoading}
                    onToggleQuickChip={onToggleQuickChip}
                    onOpenFilters={handleOpenFilters}
                    onQueryChange={(q) => onApplySheet({ q, cursor: "" })}
                    onSortChange={onSortChange}
                    view={view}
                    onViewChange={onViewChange}
                />
            </div>
            <OwnerListingsFilterSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                appliedFilters={filters}
                filterContext={filterContext}
                listings={poolListings}
                onApply={onApplySheet}
            />
        </>
    );
}
