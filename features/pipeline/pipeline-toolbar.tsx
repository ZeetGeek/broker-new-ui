"use client";

import { type ReactNode, useMemo, useState } from "react";

import {
    EMPTY_PROPERTY_CRITERIA,
    normalizePropertyCriteria,
    propertyCriteriaCount,
} from "@/lib/properties/list-criteria";
import { CRM_SEARCH_HELP } from "@/lib/search/search-help";

import { FilterChip } from "@/components/shared/filter-chip";
import { SlidersHorizontal } from "@/components/shared/icons";
import { ListSearchField, ListToolbarSelect } from "@/components/shared/list-toolbar";

import type { DealsFilters, DealSort } from "@/features/pipeline/types";
import { OwnerListingsFilterSheet } from "@/features/properties/owner-listings/owner-listings-filter-sheet";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";

import styles from "./pipeline-toolbar.module.css";

const SORT_OPTIONS: { value: DealSort; label: string }[] = [
    { value: "recent", label: "Newest first" },
    { value: "stalled", label: "Longest in stage" },
    { value: "visit_soon", label: "Visit soonest" },
    { value: "price_desc", label: "Costliest first" },
    { value: "price_asc", label: "Cheapest first" },
];

/** Updates as the broker types. The pipeline page debounces the request itself. */

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
    const openFilters = () => {
        setSheetOpen(true);
    };
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
    const filterCount =
        propertyCriteriaCount(discoveryFilters) +
        Number(Boolean(filters.ownerId)) +
        Number(Boolean(filters.clientId));

    return (
        <>
            <div className={styles.toolbar}>
                <div className={styles.status}>{leading}</div>
                <div className={styles.filters}>
                    <FilterChip
                        label="Filters"
                        mobileLabel={<span className="sr-only">Filters</span>}
                        aria-label={filterCount ? `Filters, ${filterCount} applied` : "Filters"}
                        icon={SlidersHorizontal}
                        count={filterCount}
                        isActive={filterCount > 0}
                        clearable={filterCount > 0}
                        onClick={openFilters}
                        onClear={() =>
                            onPatch({
                                propertyFilters: { ...EMPTY_PROPERTY_CRITERIA },
                                dealType: "",
                                locality: "",
                                ownerName: "",
                                ownerId: "",
                                clientId: "",
                            })
                        }
                        description="Location, budget and property filters"
                    />
                </div>
                <div className={styles.search}>
                    <ListSearchField
                        fullWidth
                        searchHelp={CRM_SEARCH_HELP.deals}
                        aria-label="Search your deals"
                        // Searched on the server, so wait for a pause in typing.
                        debounceMs={0}
                        placeholder="Search clients or properties"
                        value={filters.q}
                        onChange={(q) => onPatch({ q })}
                    />
                </div>
                <div className={styles.sort}>
                    <ListToolbarSelect
                        mobileDrawer
                        label="Sort deals"
                        value={filters.sort}
                        options={SORT_OPTIONS}
                        defaultValue="recent"
                        mobileLabel="Sort"
                        className={styles.sortButton}
                        tooltip="Change the order of the cards."
                        onChange={(sort) => onPatch({ sort })}
                    />
                </div>
            </div>
            <OwnerListingsFilterSheet
                applyLabel="Show deals"
                title="Filters"
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                appliedFilters={appliedFilters}
                discoveryFilters={discoveryFilters}
                showDiscoveryFilters
                peopleFilterScope="pipeline"
                peopleFilters={filters}
                onApply={(patch, discovery, people) => {
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
                        ownerId: people?.ownerId ?? "",
                        clientId: people?.clientId ?? "",
                    });
                }}
            />
        </>
    );
}
