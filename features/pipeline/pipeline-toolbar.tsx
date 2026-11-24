"use client";

import { type ReactNode, useId, useMemo, useState } from "react";

import {
    EMPTY_PROPERTY_CRITERIA,
    normalizePropertyCriteria,
    propertyCriteriaCount,
} from "@/lib/properties/list-criteria";
import { CRM_SEARCH_HELP } from "@/lib/search/search-help";

import { FilterChip } from "@/components/shared/filter-chip";
import { SlidersHorizontal } from "@/components/shared/icons";
import { ListSearchField, ListToolbarSelect } from "@/components/shared/list-toolbar";
import { ResponsiveListToolbar } from "@/components/shared/responsive-list-toolbar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
    const [draftSort, setDraftSort] = useState(filters.sort);
    const sortId = useId();
    const openFilters = () => {
        setDraftSort(filters.sort);
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
            <div className={styles.mobile}>
                <ListSearchField
                    fullWidth
                    placeholder="Search deals"
                    aria-label="Search deals"
                    searchHelp={CRM_SEARCH_HELP.deals}
                    debounceMs={0}
                    value={filters.q}
                    onChange={(q) => onPatch({ q })}
                    className="text-base! min-block-(--touch-target-min)!"
                />
                <FilterChip
                    label="Filters"
                    icon={SlidersHorizontal}
                    count={filterCount}
                    isActive={filterCount > 0 || filters.sort !== "recent"}
                    onClick={openFilters}
                    description="Filter and sort deals"
                />
            </div>
            <div className={styles.desktop}>
                <ResponsiveListToolbar
                    selection={
                        <>
                            <FilterChip
                                label="Filters"
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

                            {leading}
                        </>
                    }
                    search={
                        <ListSearchField
                            fullWidth
                            searchHelp={CRM_SEARCH_HELP.deals}
                            aria-label="Search your deals"
                            debounceMs={0}
                            value={filters.q}
                            onChange={(q) => onPatch({ q })}
                        />
                    }
                    actions={
                        <ListToolbarSelect
                            label="Sort deals"
                            value={filters.sort}
                            options={SORT_OPTIONS}
                            defaultValue="recent"
                            mobileLabel="Sort"
                            tooltip="Change the order of the cards."
                            onChange={(sort) => onPatch({ sort })}
                        />
                    }
                />
            </div>
            <OwnerListingsFilterSheet
                applyLabel="Show deals"
                title={
                    <>
                        <span className="md:hidden">Filter and sort</span>
                        <span className="hidden md:inline">Filters</span>
                    </>
                }
                additionalFields={{
                    active: draftSort !== "recent",
                    onClear: () => setDraftSort("recent"),
                    content: (
                        <div className="flex flex-col gap-2 border-be border-border-warm py-4 md:hidden">
                            <label htmlFor={sortId} className="body-sm font-semibold text-ink">
                                Sort deals
                            </label>
                            <Select
                                items={SORT_OPTIONS}
                                value={draftSort}
                                onValueChange={(value) => {
                                    if (
                                        value &&
                                        SORT_OPTIONS.some((option) => option.value === value)
                                    )
                                        setDraftSort(value as DealSort);
                                }}
                            >
                                <SelectTrigger
                                    id={sortId}
                                    className="inline-full min-block-(--touch-target-min)"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SORT_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ),
                }}
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
                        sort: draftSort,
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
