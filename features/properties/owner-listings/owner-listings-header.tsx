"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { countSheetFilters } from "@/features/properties/owner-listings/filter-owner-listings";
import { OwnerListingsFilterSheet } from "@/features/properties/owner-listings/owner-listings-filter-sheet";
import { OwnerListingsQuickChips } from "@/features/properties/owner-listings/owner-listings-quick-chips";
import { OwnerListingsSearchBand } from "@/features/properties/owner-listings/owner-listings-search-band";
import type {
    OwnerListingsBandFilters,
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingSort,
} from "@/features/properties/owner-listings/types";
import type { OwnerListingsView } from "@/features/properties/owner-listings/use-owner-listings-view";

export type OwnerListingsHeaderProps = {
    filters: OwnerListingsFilters;
    localityOptions: string[];
    filterContext: OwnerListingsFilterContext;
    onApplyBand: (band: OwnerListingsBandFilters) => void;
    onApplySheet: (patch: Partial<OwnerListingsFilters>) => void;
    onToggleQuickChip: (
        key: "yourAreas" | "newToday" | "slotsOpen" | "commissionSet" | "readyToMove",
    ) => void;
    onSortChange: (sort: OwnerListingSort) => void;
    view: OwnerListingsView;
    onViewChange: (view: OwnerListingsView) => void;
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
    filters,
    localityOptions,
    filterContext,
    onApplyBand,
    onApplySheet,
    onToggleQuickChip,
    onSortChange,
    view,
    onViewChange,
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
                includeTypeAndBhk={isMobile}
                onApply={onApplySheet}
            />
        </>
    );
}
