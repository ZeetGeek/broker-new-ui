"use client";

import { useEffect, useMemo, useState } from "react";

import type { MyListingsSummary } from "@/lib/api/my-listings";
import { formatSortLabel } from "@/lib/format/owner-listings-labels";
import {
    EMPTY_PROPERTY_CRITERIA,
    normalizePropertyCriteria,
    propertyCriteriaCount,
} from "@/lib/properties/list-criteria";
import { getShortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { FilterChip } from "@/components/shared/filter-chip";
import {
    ArrowDownUp,
    ChevronDown,
    Plus,
    Search,
    SlidersHorizontal,
} from "@/components/shared/icons";
import { Skeleton } from "@/components/shared/skeleton";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ownerListingsChipClassName } from "@/features/properties/owner-listings/owner-listings-chip-styles";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";
import { OwnerListingsFilterSheet } from "@/features/properties/owner-listings/owner-listings-filter-sheet";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";
import type { MyListingsFilters, MyListingSort } from "@/features/properties/your-listings/types";

type StatusTab = "published" | "draft";

const SEARCH_WIDTH_CLASS =
    "flex-1 min-inline-0 inline-full shadow-sm sm:flex-none sm:min-inline-52 sm:inline-52 lg:min-inline-64 lg:inline-64";

const STATUS_TABS: {
    key: StatusTab;
    label: string;
    description: string;
}[] = [
    {
        key: "published",
        label: "Published",
        description: "Visible listings",
    },
    {
        key: "draft",
        label: "Draft",
        description: "Not published yet",
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
    return count;
}

function MyListingsQueryInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (q: string) => void;
}) {
    const [draft, setDraft] = useState(value);
    const [prevValue, setPrevValue] = useState(value);

    // Sync when the parent filter changes (e.g. Clear filters), not while typing.
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
            onValueChange={setDraft}
            placeholder="Search listings"
            aria-label="Search your listings"
            startIcon={Search}
            clearable
            wrapperClassName={SEARCH_WIDTH_CLASS}
            className="
              rounded-control border! border-border-warm bg-surface text-sm font-medium shadow-sm
              block-[38px]!
              hover:border-ink/25!
              focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20
            "
        />
    );
}

function MyListingsSortMenu({
    sort,
    onSortChange,
}: {
    sort: MyListingSort;
    onSortChange: (sort: MyListingSort) => void;
}) {
    const isDefaultSort = sort === "newest";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <button
                        type="button"
                        className={cn(
                            ownerListingsChipClassName(!isDefaultSort),
                            "gap-2",
                            isDefaultSort && "text-ink-muted",
                        )}
                    >
                        <ArrowDownUp
                            aria-hidden
                            className="text-brand block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        <span className="hidden sm:inline">{formatSortLabel(sort)}</span>
                        <span className="sm:hidden">Sort</span>
                        <ChevronDown
                            aria-hidden
                            className="opacity-60 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                    </button>
                }
            />
            <DropdownMenuContent align="end" className="min-inline-44">
                {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onSortChange(option.value)}
                        className={cn(sort === option.value && "font-semibold text-brand")}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function MyListingsFilterDialog({
    open,
    onOpenChange,
    filters,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: MyListingsFilters;
    onApply: (next: MyListingsFilters) => void;
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
            discoveryDescription="Narrow your listings by location, budget and property type."
            onApply={(patch, discovery) => {
                const criteriaPatch = Object.fromEntries(
                    Object.keys(EMPTY_PROPERTY_CRITERIA)
                        .filter((key) => key in patch)
                        .map((key) => [key, patch[key as keyof typeof patch]]),
                );
                const next = normalizePropertyCriteria({ ...discovery, ...criteriaPatch });
                onApply({
                    ...filters,
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

function AddPropertyToolbarButton({ onClick }: { onClick: () => void }) {
    const shortcut = getShortcut("add_property");

    return (
        <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={onClick}
            aria-label="Add property"
            className="hidden gap-2 px-3.5 block-[38px]! md:inline-flex"
        >
            <Plus aria-hidden strokeWidth={1.75} />
            Add property
            {shortcut ? (
                <KbdGroup className="gap-0.5">
                    {shortcut.displayKeys.map((key) => (
                        <Kbd
                            key={key}
                            className="
                              border-surface/25 bg-surface/15 px-1.5 text-[10px] text-surface
                              [box-shadow:none] min-inline-4
                            "
                        >
                            {key}
                        </Kbd>
                    ))}
                </KbdGroup>
            ) : null}
        </Button>
    );
}

export type MyListingsHeaderProps = {
    filters: MyListingsFilters;
    onFiltersChange: (next: MyListingsFilters) => void;
    summary: MyListingsSummary | null;
    isLoading?: boolean;
    isInitialLoading?: boolean;
    onAddProperty?: () => void;
};

export const MY_LISTINGS_TOOLBAR_CLASS =
    "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4";

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
            <div aria-hidden className={MY_LISTINGS_TOOLBAR_CLASS}>
                <div
                    className="
                  -my-1.5 flex flex-1 gap-2.5 overflow-hidden px-0.5 py-1.5 min-inline-0
                "
                >
                    <div className={ownerListingsChipClassName(false)}>
                        <Skeleton className="shrink-0 block-4 inline-4" />
                        <SkeletonLabel>Filters</SkeletonLabel>
                    </div>
                    {STATUS_TABS.map((tab) => (
                        <div key={tab.key} className={ownerListingsChipClassName(false)}>
                            <SkeletonLabel>{tab.label}</SkeletonLabel>
                            <span
                                className="
                              inline-flex shrink-0 items-center justify-center block-5 inline-8
                            "
                            >
                                <Skeleton className="block-4 inline-7" />
                            </span>
                        </div>
                    ))}
                </div>
                <div className="flex shrink-0 items-center gap-2.5 min-inline-0">
                    <div
                        className={cn(
                            SEARCH_WIDTH_CLASS,
                            `
                      flex items-center gap-2 rounded-control border border-border-warm bg-surface
                      px-3 block-[38px]
                    `,
                        )}
                    >
                        <Skeleton className="shrink-0 block-4 inline-4" />
                        <SkeletonLabel>Search listings</SkeletonLabel>
                    </div>
                    <div className={cn(ownerListingsChipClassName(false), "gap-2")}>
                        <Skeleton className="shrink-0 block-4 inline-4" />
                        <SkeletonLabel>
                            <span className="hidden sm:inline">Newest first</span>
                            <span
                                className="
                          sm:hidden
                        "
                            >
                                Sort
                            </span>
                        </SkeletonLabel>
                        <Skeleton className="shrink-0 block-3.5 inline-3.5" />
                    </div>
                    {showAddProperty ? (
                        <div
                            className="
                          hidden items-center gap-2 rounded-control bg-surface px-3.5 text-sm
                          font-semibold shadow-sm block-[38px]
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
                                            className="
                              invisible px-1.5 text-[10px] min-inline-4
                            "
                                        >
                                            {key}
                                        </Kbd>
                                    ))}
                                </KbdGroup>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export function MyListingsHeader({
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
                    <div className={MY_LISTINGS_TOOLBAR_CLASS}>
                        <OwnerListingsChipsCarousel>
                            <OwnerListingsChipsCarouselSlide>
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
                                            propertyType: "",
                                            propertyFilters: { ...EMPTY_PROPERTY_CRITERIA },
                                            bhk: [],
                                            type: "",
                                            page: 1,
                                        })
                                    }
                                    description="Location, budget and property filters"
                                />
                            </OwnerListingsChipsCarouselSlide>

                            {STATUS_TABS.map((tab) => {
                                const active = filters.status === tab.key;
                                return (
                                    <OwnerListingsChipsCarouselSlide key={tab.key}>
                                        <FilterChip
                                            label={tab.label}
                                            count={tabCount(summary, tab.key)}
                                            isLoading={isLoading}
                                            reserveCountSpace
                                            isActive={active}
                                            onClick={() => selectStatusTab(tab.key)}
                                            description={tab.description}
                                        />
                                    </OwnerListingsChipsCarouselSlide>
                                );
                            })}
                        </OwnerListingsChipsCarousel>

                        <div className="flex shrink-0 items-center gap-2.5 min-inline-0">
                            <MyListingsQueryInput
                                value={filters.q}
                                onChange={(q) => onFiltersChange({ ...filters, q, page: 1 })}
                            />
                            <MyListingsSortMenu
                                sort={filters.sort}
                                onSortChange={(sort) =>
                                    onFiltersChange({ ...filters, sort, page: 1 })
                                }
                            />
                            {onAddProperty ? (
                                <AddPropertyToolbarButton onClick={onAddProperty} />
                            ) : null}
                        </div>
                    </div>
                </TooltipProvider>
            </div>

            <MyListingsFilterDialog
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                filters={filters}
                onApply={onFiltersChange}
            />
        </>
    );
}
