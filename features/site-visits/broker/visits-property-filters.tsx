"use client";

import { useMemo } from "react";

import {
    EMPTY_PROPERTY_CRITERIA,
    normalizePropertyCriteria,
    type PropertyListCriteria,
} from "@/lib/properties/list-criteria";

import { OwnerListingsFilterSheet } from "@/features/properties/owner-listings/owner-listings-filter-sheet";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";

export function VisitsPropertyFiltersDialog({
    open,
    onOpenChange,
    filters,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: PropertyListCriteria;
    onApply: (next: PropertyListCriteria) => void;
}) {
    const appliedFilters = useMemo(
        () => ({ ...DEFAULT_OWNER_LISTINGS_FILTERS, ...filters }),
        [filters],
    );
    return (
        <OwnerListingsFilterSheet
            open={open}
            onOpenChange={onOpenChange}
            appliedFilters={appliedFilters}
            discoveryFilters={filters}
            showDiscoveryFilters
            discoveryDescription="Narrow your visits by location, budget and property type."
            onApply={(patch, discovery) => {
                const criteriaPatch = Object.fromEntries(
                    Object.keys(EMPTY_PROPERTY_CRITERIA)
                        .filter((key) => key in patch)
                        .map((key) => [key, patch[key as keyof typeof patch]]),
                );
                onApply(normalizePropertyCriteria({ ...discovery, ...criteriaPatch }));
            }}
        />
    );
}
