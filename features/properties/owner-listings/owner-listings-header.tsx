"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { countSheetFilters } from "@/features/properties/owner-listings/filter-owner-listings";
import { OwnerListingsFilterSheet } from "@/features/properties/owner-listings/owner-listings-filter-sheet";
import { OwnerListingsIntro } from "@/features/properties/owner-listings/owner-listings-intro";
import { OwnerListingsQuickChips } from "@/features/properties/owner-listings/owner-listings-quick-chips";
import { OwnerListingsResultsBar } from "@/features/properties/owner-listings/owner-listings-results-bar";
import { OwnerListingsSearchBand } from "@/features/properties/owner-listings/owner-listings-search-band";
import type {
    OwnerListingsBandFilters,
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingSort,
} from "@/features/properties/owner-listings/types";

export type OwnerListingsHeaderProps = {
    userId: string | undefined;
    hasApprovedRepresentation: boolean;
    newThisWeekCount: number;
    filters: OwnerListingsFilters;
    serviceAreas: string[];
    localityOptions: string[];
    totalCount: number;
    isLoading?: boolean;
    filterContext: OwnerListingsFilterContext;
    onApplyBand: (band: OwnerListingsBandFilters) => void;
    onApplySheet: (patch: Partial<OwnerListingsFilters>) => void;
    onToggleQuickChip: (
        key: "yourAreas" | "newToday" | "slotsOpen" | "commissionSet" | "readyToMove",
    ) => void;
    onSortChange: (sort: OwnerListingSort) => void;
};

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 47.9375rem)");
        const update = () => setIsMobile(mediaQuery.matches);
        update();
        mediaQuery.addEventListener("change", update);
        return () => mediaQuery.removeEventListener("change", update);
    }, []);

    return isMobile;
}

export function OwnerListingsHeader({
    userId,
    hasApprovedRepresentation,
    newThisWeekCount,
    filters,
    serviceAreas,
    localityOptions,
    totalCount,
    isLoading = false,
    filterContext,
    onApplyBand,
    onApplySheet,
    onToggleQuickChip,
    onSortChange,
}: OwnerListingsHeaderProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const isMobile = useIsMobile();

    const sheetFilterCount = useMemo(
        () => countSheetFilters(filters, { includeTypeAndBhk: isMobile }),
        [filters, isMobile],
    );

    const handleOpenFilters = useCallback(() => {
        setSheetOpen(true);
    }, []);

    return (
        <>
            <div className="flex flex-col gap-3">
                <OwnerListingsIntro
                    userId={userId}
                    hasApprovedRepresentation={hasApprovedRepresentation}
                    newThisWeekCount={newThisWeekCount}
                    serviceAreas={serviceAreas}
                />

                <div className="sticky inset-bs-0 z-10 flex flex-col gap-3">
                    <OwnerListingsSearchBand
                        appliedFilters={filters}
                        localityOptions={localityOptions}
                        onApplyBand={onApplyBand}
                    />

                    <OwnerListingsQuickChips
                        filters={filters}
                        sheetFilterCount={sheetFilterCount}
                        onToggleQuickChip={onToggleQuickChip}
                        onOpenFilters={handleOpenFilters}
                    />
                </div>

                <OwnerListingsResultsBar
                    totalCount={totalCount}
                    filters={filters}
                    serviceAreas={serviceAreas}
                    isLoading={isLoading}
                    onSortChange={onSortChange}
                />
            </div>

            <OwnerListingsFilterSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                appliedFilters={filters}
                filterContext={filterContext}
                includeTypeAndBhk={isMobile}
                onApply={onApplySheet}
            />
        </>
    );
}
