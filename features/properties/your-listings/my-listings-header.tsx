"use client";

import { useMemo, useState } from "react";

import type { MyListingsSummary } from "@/lib/api/my-listings";
import {
    EMPTY_PROPERTY_CRITERIA,
    normalizePropertyCriteria,
    propertyCriteriaCount,
} from "@/lib/properties/list-criteria";
import { CRM_SEARCH_HELP } from "@/lib/search/search-help";
import { getShortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { FilterChip } from "@/components/shared/filter-chip";
import { SlidersHorizontal } from "@/components/shared/icons";
import {
    ListAddButton,
    ListSearchField,
    ListToolbarSelect,
} from "@/components/shared/list-toolbar";
import {
    ResponsiveListStatus,
    ResponsiveListToolbar,
} from "@/components/shared/responsive-list-toolbar";
import { Skeleton } from "@/components/shared/skeleton";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ownerListingsChipClassName } from "@/features/properties/owner-listings/owner-listings-chip-styles";
import { OwnerListingsFilterSheet } from "@/features/properties/owner-listings/owner-listings-filter-sheet";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";
import type { MyListingsFilters, MyListingSort } from "@/features/properties/your-listings/types";

type StatusTab = "published" | "draft" | "sold" | "deleted";

const STATUS_TABS: {
    key: StatusTab;
    label: string;
    description: string;
    dotClassName: string;
}[] = [
    {
        key: "published",
        label: "Published",
        description: "Visible listings",
        dotClassName: "bg-emerald-400",
    },
    {
        key: "draft",
        label: "Draft",
        description: "Not published yet",
        dotClassName: "bg-yellow-300",
    },
    {
        key: "sold",
        label: "Sold",
        description: "Properties marked as sold",
        dotClassName: "bg-amber-500",
    },
    {
        key: "deleted",
        label: "Deleted",
        description: "Restore a property or delete it permanently",
        dotClassName: "bg-red-400",
    },
];

const SORT_OPTIONS: { value: MyListingSort; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "price_asc", label: "Price low" },
    { value: "price_desc", label: "Price high" },
];

function tabCount(summary: MyListingsSummary | null, key: StatusTab): number | undefined {
    if (!summary) return undefined;
    return summary[key];
}

function countSheetFilters(filters: MyListingsFilters): number {
    let count = propertyCriteriaCount(filters.propertyFilters);
    if (filters.propertyType) count += 1;
    if (filters.bhk.length > 0) count += 1;
    if (filters.type) count += 1;
    if (filters.ownerId) count += 1;
    if (filters.clientId) count += 1;
    return count;
}

function MyListingsFilterDialog({
    showPeopleFilters,
    open,
    onOpenChange,
    filters,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: MyListingsFilters;
    onApply: (next: MyListingsFilters) => void;
    showPeopleFilters: boolean;
}) {
    const discoveryFilters = useMemo(
        () =>
            normalizePropertyCriteria({
                ...filters.propertyFilters,
                type: filters.type,
                ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
                ...(filters.bhk.length ? { bhk: filters.bhk } : {}),
            }),
        [filters.propertyFilters, filters.type, filters.propertyType, filters.bhk],
    );
    const appliedFilters = useMemo(
        () => ({ ...DEFAULT_OWNER_LISTINGS_FILTERS, ...discoveryFilters }),
        [discoveryFilters],
    );

    return (
        <OwnerListingsFilterSheet
            open={open}
            onOpenChange={onOpenChange}
            appliedFilters={appliedFilters}
            discoveryFilters={discoveryFilters}
            showDiscoveryFilters
            peopleFilterScope={showPeopleFilters ? "my-listings" : undefined}
            peopleFilters={showPeopleFilters ? filters : undefined}
            discoveryDescription="Narrow your listings by location, budget and property type."
            onApply={(patch, discovery, people) => {
                const criteriaPatch = Object.fromEntries(
                    Object.keys(EMPTY_PROPERTY_CRITERIA)
                        .filter((key) => key in patch)
                        .map((key) => [key, patch[key as keyof typeof patch]]),
                );
                const next = normalizePropertyCriteria({ ...discovery, ...criteriaPatch });
                onApply({
                    ...filters,
                    ...(showPeopleFilters
                        ? { ownerId: people?.ownerId ?? "", clientId: people?.clientId ?? "" }
                        : {}),
                    type: next.type,
                    propertyType: "",
                    bhk: [],
                    propertyFilters: { ...next, type: "" },
                    page: 1,
                });
            }}
        />
    );
}

export type MyListingsHeaderProps = {
    showPeopleFilters?: boolean;
    filters: MyListingsFilters;
    onFiltersChange: (next: MyListingsFilters) => void;
    summary: MyListingsSummary | null;
    isLoading?: boolean;
    isInitialLoading?: boolean;
    onAddProperty?: () => void;
};

function SkeletonLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="relative inline-block">
            <span className="invisible">{children}</span>
            <Skeleton className="absolute inset-x-0 inset-bs-1/2 -translate-y-1/2 block-3" />
        </span>
    );
}

export function MyListingsToolbarSkeleton({
    showAddProperty = true,
}: {
    showAddProperty?: boolean;
}) {
    const shortcut = getShortcut("add_property");

    return (
        <div role="status" aria-busy="true" className="sticky inset-bs-0 z-10">
            <span className="sr-only">Loading listing controls</span>
            <div aria-hidden>
                <ResponsiveListToolbar
                    selection={
                        <>
                            <div
                                className={ownerListingsChipClassName(false, {
                                    interactive: false,
                                })}
                            >
                                <Skeleton className="shrink-0 block-4 inline-4" />
                                <SkeletonLabel>Filters</SkeletonLabel>
                            </div>
                            <div
                                className={cn(
                                    ownerListingsChipClassName(false, { interactive: false }),
                                    "flex-1 min-inline-0 sm:flex-none",
                                )}
                            >
                                <SkeletonLabel>Published</SkeletonLabel>
                                <Skeleton className="ms-auto shrink-0 block-4 inline-7" />
                                <Skeleton className="shrink-0 block-3.5 inline-3.5" />
                            </div>
                        </>
                    }
                    search={
                        <div className="flex items-center gap-2 rounded-control border border-border-warm bg-surface px-3 shadow-sm list-control min-inline-0">
                            <Skeleton className="shrink-0 block-4 inline-4" />
                            <Skeleton className="block-3 inline-1/2" />
                        </div>
                    }
                    actions={
                        <>
                            <div
                                className={cn(
                                    ownerListingsChipClassName(false, { interactive: false }),
                                    "gap-2",
                                )}
                            >
                                <Skeleton className="shrink-0 block-4 inline-4" />
                                <SkeletonLabel>
                                    <span className="hidden sm:inline">Newest first</span>
                                    <span className="sm:hidden">Sort</span>
                                </SkeletonLabel>
                                <Skeleton className="shrink-0 block-3.5 inline-3.5" />
                            </div>
                            {showAddProperty ? (
                                <div
                                    className="
                              hidden items-center gap-2 rounded-control bg-surface px-3.5 text-sm
                              font-semibold shadow-sm list-control
                              md:inline-flex
                            "
                                >
                                    <Skeleton className="shrink-0 block-4 inline-4" />
                                    <SkeletonLabel>Add property</SkeletonLabel>
                                    {shortcut ? (
                                        <KbdGroup className="gap-0.5">
                                            {shortcut.displayKeys.map((key) => (
                                                <Kbd
                                                    key={key}
                                                    className="invisible px-1.5 text-[10px] min-inline-4"
                                                >
                                                    {key}
                                                </Kbd>
                                            ))}
                                        </KbdGroup>
                                    ) : null}
                                </div>
                            ) : null}
                        </>
                    }
                />
            </div>
        </div>
    );
}

export function MyListingsHeader({
    showPeopleFilters = false,
    filters,
    onFiltersChange,
    summary,
    isLoading = false,
    isInitialLoading = false,
    onAddProperty,
}: MyListingsHeaderProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const sheetFilterCount = useMemo(() => countSheetFilters(filters), [filters]);

    if (isInitialLoading)
        return <MyListingsToolbarSkeleton showAddProperty={Boolean(onAddProperty)} />;

    function selectStatusTab(key: StatusTab) {
        if (filters.status === key) return;
        onFiltersChange({
            ...filters,
            status: key,
            page: 1,
        });
    }

    return (
        <>
            <div className="sticky inset-bs-0 z-10">
                <TooltipProvider>
                    <ResponsiveListToolbar
                        selection={
                            <>
                                <FilterChip
                                    label="Filters"
                                    icon={SlidersHorizontal}
                                    count={sheetFilterCount}
                                    isActive={sheetFilterCount > 0}
                                    clearable={sheetFilterCount > 0}
                                    onClick={() => setSheetOpen(true)}
                                    onClear={() =>
                                        onFiltersChange({
                                            ...filters,
                                            ownerId: "",
                                            clientId: "",
                                            propertyType: "",
                                            propertyFilters: { ...EMPTY_PROPERTY_CRITERIA },
                                            bhk: [],
                                            type: "",
                                            page: 1,
                                        })
                                    }
                                    description="Location, budget and property filters"
                                />
                                <ResponsiveListStatus
                                    label="Status"
                                    mobileDrawer
                                    value={filters.status}
                                    options={STATUS_TABS.map((tab) => ({
                                        value: tab.key,
                                        label: tab.label,
                                        dotClassName: tab.dotClassName,
                                        count: tabCount(summary, tab.key),
                                    }))}
                                    isLoading={isLoading}
                                    onChange={(value) => {
                                        const selected = STATUS_TABS.find(
                                            (tab) => tab.key === value,
                                        );
                                        if (selected) selectStatusTab(selected.key);
                                    }}
                                >
                                    {STATUS_TABS.map((tab) => {
                                        const active = filters.status === tab.key;
                                        const count = tabCount(summary, tab.key);
                                        return (
                                            <div key={tab.key}>
                                                <FilterChip
                                                    label={
                                                        <span className="inline-flex items-center gap-2.5">
                                                            <span
                                                                aria-hidden
                                                                className={cn(
                                                                    "shrink-0 rounded-full block-1.5 inline-1.5",
                                                                    tab.dotClassName,
                                                                )}
                                                            />
                                                            {tab.label}
                                                        </span>
                                                    }
                                                    count={count}
                                                    isLoading={isLoading}
                                                    isActive={active}
                                                    onClick={() => selectStatusTab(tab.key)}
                                                    description={tab.description}
                                                />
                                            </div>
                                        );
                                    })}
                                </ResponsiveListStatus>
                            </>
                        }
                        search={
                            <ListSearchField
                                fullWidth
                                searchHelp={CRM_SEARCH_HELP.listings}
                                aria-label="Search your listings"
                                // Searched on the server, so wait for a pause in typing.
                                debounceMs={500}
                                value={filters.q}
                                onChange={(q) => onFiltersChange({ ...filters, q, page: 1 })}
                            />
                        }
                        actions={
                            <>
                                <ListToolbarSelect
                                    label="Sort listings"
                                    mobileDrawer
                                    options={SORT_OPTIONS}
                                    defaultValue="newest"
                                    mobileLabel="Sort"
                                    value={filters.sort}
                                    onChange={(sort) =>
                                        onFiltersChange({ ...filters, sort, page: 1 })
                                    }
                                />
                                {onAddProperty ? (
                                    <ListAddButton
                                        label="Add property"
                                        shortcutId="add_property"
                                        onClick={onAddProperty}
                                        className="hidden md:inline-flex"
                                    />
                                ) : null}
                            </>
                        }
                    />
                </TooltipProvider>
            </div>

            <MyListingsFilterDialog
                showPeopleFilters={showPeopleFilters}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                filters={filters}
                onApply={onFiltersChange}
            />
        </>
    );
}
