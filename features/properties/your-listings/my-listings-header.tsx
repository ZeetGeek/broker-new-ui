"use client";

import { useEffect, useMemo, useState } from "react";

import { ArrowDownUp, ChevronDown, Plus, Search, SlidersHorizontal } from "lucide-react";

import type { MyListingsSummary } from "@/lib/api/my-listings";
import { formatSortLabel } from "@/lib/format/owner-listings-labels";
import { getShortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { FilterChip } from "@/components/shared/filter-chip";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { ownerListingsChipClassName } from "@/features/properties/owner-listings/owner-listings-chip-styles";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";
import type { MyListingsFilters, MyListingSort } from "@/features/properties/your-listings/types";

type StatusTab = "published" | "draft";

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

const BHK_OPTIONS = ["1", "2", "3", "4"];

function tabCount(summary: MyListingsSummary | null, key: StatusTab): number {
    if (!summary) return 0;
    return summary[key];
}

function countSheetFilters(filters: MyListingsFilters): number {
    let count = 0;
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
            wrapperClassName="
              min-inline-44 inline-44 shadow-sm
              sm:min-inline-52 sm:inline-52
              lg:min-inline-64 lg:inline-64
            "
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
    const [draft, setDraft] = useState(filters);
    const [wasOpen, setWasOpen] = useState(open);
    const [syncedFilters, setSyncedFilters] = useState(filters);

    // Reset draft when the sheet opens, or when applied filters change while open.
    if (open) {
        if (!wasOpen || filters !== syncedFilters) {
            setWasOpen(true);
            setSyncedFilters(filters);
            setDraft(filters);
        }
    } else if (wasOpen) {
        setWasOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup className="gap-0 p-0 max-inline-lg sm:max-inline-lg">
                <DialogHeader className="border-be border-border-warm px-5 py-4">
                    <DialogTitle>Filters</DialogTitle>
                    <DialogClose />
                </DialogHeader>
                <div className="flex flex-col gap-5 p-5">
                    <div className="flex flex-col gap-2">
                        <p className="body-sm font-semibold text-ink">Looking for</p>
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    ["", "Any"],
                                    ["sale", "Sale"],
                                    ["rent", "Rent"],
                                ] as const
                            ).map(([value, label]) => (
                                <button
                                    key={value || "any"}
                                    type="button"
                                    className={ownerListingsChipClassName(draft.type === value)}
                                    onClick={() => setDraft({ ...draft, type: value })}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="body-sm font-semibold text-ink">BHK</p>
                        <div className="flex flex-wrap gap-2">
                            {BHK_OPTIONS.map((value) => {
                                const active = draft.bhk.includes(value);
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        className={ownerListingsChipClassName(active)}
                                        onClick={() => {
                                            const bhk = active
                                                ? draft.bhk.filter((item) => item !== value)
                                                : [...draft.bhk, value];
                                            setDraft({ ...draft, bhk });
                                        }}
                                    >
                                        {value} BHK
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="border-bs border-border-warm/40 bg-surface px-5 py-4">
                    <AppModalFooter
                        secondaryLabel="Reset filter"
                        onSecondary={() =>
                            setDraft({
                                ...draft,
                                type: "",
                                bhk: [],
                                propertyType: "",
                            })
                        }
                        primaryLabel="Apply filters"
                        onPrimary={() => {
                            onApply({ ...draft, page: 1 });
                            onOpenChange(false);
                        }}
                    />
                </div>
            </DialogPopup>
        </Dialog>
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
                              min-inline-4
                              [box-shadow:none]
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
    onAddProperty?: () => void;
};

export function MyListingsHeader({
    filters,
    onFiltersChange,
    summary,
    isLoading = false,
    onAddProperty,
}: MyListingsHeaderProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const sheetFilterCount = useMemo(() => countSheetFilters(filters), [filters]);

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
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <OwnerListingsChipsCarousel>
                            <OwnerListingsChipsCarouselSlide>
                                <FilterChip
                                    label="Filters"
                                    icon={SlidersHorizontal}
                                    count={sheetFilterCount}
                                    isLoading={isLoading}
                                    isActive={sheetFilterCount > 0}
                                    clearable={sheetFilterCount > 0}
                                    onClick={() => setSheetOpen(true)}
                                    onClear={() =>
                                        onFiltersChange({
                                            ...filters,
                                            propertyType: "",
                                            bhk: [],
                                            type: "",
                                            page: 1,
                                        })
                                    }
                                    description="Sale/rent and BHK filters"
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
                                            isActive={active}
                                            onClick={() => selectStatusTab(tab.key)}
                                            description={tab.description}
                                        />
                                    </OwnerListingsChipsCarouselSlide>
                                );
                            })}
                        </OwnerListingsChipsCarousel>

                        <div className="flex shrink-0 items-center gap-2.5">
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
