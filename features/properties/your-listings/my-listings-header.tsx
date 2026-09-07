"use client";

import { useEffect, useMemo, useState } from "react";

import { ArrowDownUp, ChevronDown, Search, SlidersHorizontal } from "lucide-react";

import type { MyListingsSummary } from "@/lib/api/my-listings";
import { formatSortLabel } from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import { AppModalFooter } from "@/components/shared/app-modal-footer";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
    formatChipCount,
    ownerListingsChipClassName,
    ownerListingsChipCountClassName,
} from "@/features/properties/owner-listings/owner-listings-chip-styles";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";
import { OwnerListingsViewToggle } from "@/features/properties/owner-listings/owner-listings-view-toggle";
import type {
    MyListingsFilters,
    MyListingSort,
    MyListingStatus,
} from "@/features/properties/your-listings/types";
import type { MyListingsView } from "@/features/properties/your-listings/use-my-listings-view";

type ChipKey = "sale" | "rent" | "published" | "draft" | "unpublished";

const QUICK_CHIPS: {
    key: ChipKey;
    label: string;
    mobileLabel: string;
    description: string;
}[] = [
    {
        key: "sale",
        label: "For sale",
        mobileLabel: "Sale",
        description: "Listings offered for sale",
    },
    {
        key: "rent",
        label: "For rent",
        mobileLabel: "Rent",
        description: "Listings offered for rent",
    },
    {
        key: "published",
        label: "Published",
        mobileLabel: "Live",
        description: "Visible listings",
    },
    {
        key: "draft",
        label: "Draft",
        mobileLabel: "Draft",
        description: "Not published yet",
    },
    {
        key: "unpublished",
        label: "Unpublished",
        mobileLabel: "Off",
        description: "Taken off the market",
    },
];

const SORT_OPTIONS: { value: MyListingSort; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "price_asc", label: "Price low" },
    { value: "price_desc", label: "Price high" },
];

const BHK_OPTIONS = ["1", "2", "3", "4"];

function chipIsActive(filters: MyListingsFilters, key: ChipKey): boolean {
    if (key === "sale" || key === "rent") return filters.type === key;
    return filters.status === key;
}

function chipCount(summary: MyListingsSummary | null, key: ChipKey): number {
    if (!summary) return 0;
    return summary[key];
}

function countSheetFilters(filters: MyListingsFilters): number {
    let count = 0;
    if (filters.propertyType) count += 1;
    if (filters.bhk.length > 0) count += 1;
    if (filters.type) count += 1;
    if (filters.status) count += 1;
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

    useEffect(() => {
        setDraft(value);
    }, [value]);

    useEffect(() => {
        if (draft === value) return;
        const timer = window.setTimeout(() => onChange(draft), 300);
        return () => window.clearTimeout(timer);
    }, [draft, onChange, value]);

    return (
        <Input
            size="sm"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
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
              rounded-full border! border-border-warm bg-surface text-sm font-medium shadow-sm
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

    useEffect(() => {
        if (open) setDraft(filters);
    }, [filters, open]);

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

                    <div className="flex flex-col gap-2">
                        <p className="body-sm font-semibold text-ink">Status</p>
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    ["", "Any"],
                                    ["published", "Published"],
                                    ["draft", "Draft"],
                                    ["unpublished", "Unpublished"],
                                ] as const
                            ).map(([value, label]) => (
                                <button
                                    key={value || "any-status"}
                                    type="button"
                                    className={ownerListingsChipClassName(draft.status === value)}
                                    onClick={() =>
                                        setDraft({
                                            ...draft,
                                            status: value as MyListingStatus | "",
                                        })
                                    }
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="border-bs border-border-warm/40 bg-surface px-5 py-4">
                    <AppModalFooter
                        secondaryLabel="Clear all"
                        onSecondary={() =>
                            setDraft({
                                ...draft,
                                type: "",
                                bhk: [],
                                status: "",
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

export type MyListingsHeaderProps = {
    filters: MyListingsFilters;
    onFiltersChange: (next: MyListingsFilters) => void;
    view: MyListingsView;
    onViewChange: (view: MyListingsView) => void;
    summary: MyListingsSummary | null;
    isLoading?: boolean;
};

export function MyListingsHeader({
    filters,
    onFiltersChange,
    view,
    onViewChange,
    summary,
    isLoading = false,
}: MyListingsHeaderProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const sheetFilterCount = useMemo(() => countSheetFilters(filters), [filters]);

    function toggleChip(key: ChipKey) {
        if (key === "sale" || key === "rent") {
            onFiltersChange({
                ...filters,
                type: filters.type === key ? "" : key,
                page: 1,
            });
            return;
        }
        onFiltersChange({
            ...filters,
            status: filters.status === key ? "" : key,
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
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <button
                                                type="button"
                                                className={cn(
                                                    ownerListingsChipClassName(
                                                        sheetFilterCount > 0,
                                                    ),
                                                    "gap-2",
                                                )}
                                                onClick={() => setSheetOpen(true)}
                                                aria-pressed={sheetFilterCount > 0}
                                            >
                                                <SlidersHorizontal
                                                    aria-hidden
                                                    className={cn(
                                                        "block-4 inline-4",
                                                        sheetFilterCount > 0
                                                            ? "text-brand-text"
                                                            : "text-brand",
                                                    )}
                                                    strokeWidth={1.75}
                                                />
                                                <span>Filters</span>
                                                {sheetFilterCount > 0 ? (
                                                    <span
                                                        className={ownerListingsChipCountClassName(
                                                            true,
                                                        )}
                                                    >
                                                        {formatChipCount(
                                                            sheetFilterCount,
                                                            isLoading,
                                                        )}
                                                    </span>
                                                ) : null}
                                            </button>
                                        }
                                    />
                                    <TooltipContent side="bottom">
                                        Sale/rent, BHK, and status filters
                                    </TooltipContent>
                                </Tooltip>
                            </OwnerListingsChipsCarouselSlide>

                            {QUICK_CHIPS.map((chip) => {
                                const active = chipIsActive(filters, chip.key);
                                return (
                                    <OwnerListingsChipsCarouselSlide key={chip.key}>
                                        <Tooltip>
                                            <TooltipTrigger
                                                render={
                                                    <button
                                                        type="button"
                                                        className={ownerListingsChipClassName(
                                                            active,
                                                        )}
                                                        onClick={() => toggleChip(chip.key)}
                                                        aria-pressed={active}
                                                    >
                                                        <span className="md:hidden">
                                                            {chip.mobileLabel}
                                                        </span>
                                                        <span className="hidden md:inline">
                                                            {chip.label}
                                                        </span>
                                                        <span
                                                            className={ownerListingsChipCountClassName(
                                                                active,
                                                            )}
                                                        >
                                                            {formatChipCount(
                                                                chipCount(summary, chip.key),
                                                                isLoading,
                                                            )}
                                                        </span>
                                                    </button>
                                                }
                                            />
                                            <TooltipContent side="bottom">
                                                {chip.description}
                                            </TooltipContent>
                                        </Tooltip>
                                    </OwnerListingsChipsCarouselSlide>
                                );
                            })}
                        </OwnerListingsChipsCarousel>

                        <div className="flex shrink-0 items-center gap-2.5">
                            <MyListingsQueryInput
                                value={filters.q}
                                onChange={(q) => onFiltersChange({ ...filters, q, page: 1 })}
                            />
                            <OwnerListingsViewToggle view={view} onViewChange={onViewChange} />
                            <MyListingsSortMenu
                                sort={filters.sort}
                                onSortChange={(sort) =>
                                    onFiltersChange({ ...filters, sort, page: 1 })
                                }
                            />
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
