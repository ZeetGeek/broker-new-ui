"use client";

import { useMemo, useState } from "react";

import {
    BadgePercent,
    Bath,
    BedDouble,
    Building2,
    CalendarDays,
    DoorOpen,
    Home,
    KeyRound,
    LandPlot,
    Minus,
    Plus,
    RotateCcw,
    Search,
    Sofa,
    Store,
    Tag,
    XIcon,
    type LucideIcon,
} from "lucide-react";

import { listingCompareAmountInr } from "@/lib/format/listing-availability";
import { extractSheetFilters, formatBudgetLabel } from "@/lib/format/owner-listings-labels";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { filterOwnerListings } from "@/features/properties/owner-listings/filter-owner-listings";
import {
    findBudgetStepIndex,
    getBudgetSteps,
} from "@/features/properties/owner-listings/owner-listings-budget-presets";
import type {
    OwnerListingFurnishing,
    OwnerListingItem,
    OwnerListingPropertyType,
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingsSheetFilters,
    OwnerListingTransactionType,
} from "@/features/properties/owner-listings/types";

const BHK_OPTIONS = ["1", "2", "3", "4", "5"] as const;

const LOOKING_FOR_OPTIONS: {
    value: OwnerListingTransactionType | "";
    label: string;
    description: string;
    icon: LucideIcon;
}[] = [
    {
        value: "",
        label: "Any deal",
        description: "Sale and rent listings together",
        icon: Home,
    },
    {
        value: "sale",
        label: "For sale",
        description: "Owner is looking for a buyer",
        icon: Tag,
    },
    {
        value: "rent",
        label: "For rent",
        description: "Owner is looking for a tenant",
        icon: KeyRound,
    },
];

const PROPERTY_TYPE_OPTIONS: {
    value: OwnerListingPropertyType | "";
    label: string;
    icon: LucideIcon;
}[] = [
    { value: "", label: "Any", icon: Building2 },
    { value: "apartment", label: "Apartment", icon: Building2 },
    { value: "villa", label: "Villa", icon: Home },
    { value: "penthouse", label: "Penthouse", icon: Building2 },
    { value: "shop", label: "Shop", icon: Store },
    { value: "office", label: "Office", icon: Building2 },
    { value: "plot", label: "Plot", icon: LandPlot },
];

const FURNISHING_OPTIONS: { value: OwnerListingFurnishing; label: string }[] = [
    { value: "furnished", label: "Furnished" },
    { value: "semi", label: "Semi-furnished" },
    { value: "unfurnished", label: "Unfurnished" },
];

const DEAL_OPTIONS: {
    key: keyof Pick<
        OwnerListingsSheetFilters,
        "readyToMove" | "slotsOpen" | "commissionSet" | "newToday"
    >;
    label: string;
    description: string;
    icon: LucideIcon;
}[] = [
    {
        key: "readyToMove",
        label: "Ready to move",
        description: "Immediate possession",
        icon: KeyRound,
    },
    {
        key: "slotsOpen",
        label: "Slots open",
        description: "Still taking requests",
        icon: DoorOpen,
    },
    {
        key: "commissionSet",
        label: "Commission set",
        description: "Owner shared a rate",
        icon: BadgePercent,
    },
    {
        key: "newToday",
        label: "New this week",
        description: "Listed in last 7 days",
        icon: CalendarDays,
    },
];

const EMPTY_SHEET_FILTERS: OwnerListingsSheetFilters = {
    q: "",
    propertyType: "",
    furnishing: "",
    type: "",
    bhk: [],
    min: "",
    max: "",
    newToday: false,
    slotsOpen: false,
    commissionSet: false,
    readyToMove: false,
};

const HISTOGRAM_BARS = 24;

export type OwnerListingsFilterSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appliedFilters: OwnerListingsFilters;
    filterContext: OwnerListingsFilterContext;
    listings: OwnerListingItem[];
    onApply: (patch: Partial<OwnerListingsFilters>) => void;
};

function FilterPanel({
    title,
    subtitle,
    children,
    className,
    action,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}) {
    return (
        <section
            className={cn(
                "flex flex-col gap-4 rounded-[1.25rem] bg-surface-muted/70 p-4 sm:p-5",
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-inline-0 flex-col gap-1">
                    <h3 className="font-display text-base font-medium text-ink">{title}</h3>
                    {subtitle ? <p className="body-sm text-ink-muted">{subtitle}</p> : null}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

function buildPriceHistogram(
    listings: OwnerListingItem[],
    type: OwnerListingTransactionType | "",
): number[] {
    const amounts = listings
        .map((item) => listingCompareAmountInr(item, type))
        .filter((amount) => amount > 0);

    if (amounts.length === 0) {
        return Array.from({ length: HISTOGRAM_BARS }, (_, index) =>
            Math.max(0.12, Math.sin((index / HISTOGRAM_BARS) * Math.PI) * 0.85),
        );
    }

    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const span = Math.max(max - min, 1);
    const buckets = Array.from({ length: HISTOGRAM_BARS }, () => 0);

    for (const amount of amounts) {
        const index = Math.min(
            HISTOGRAM_BARS - 1,
            Math.floor(((amount - min) / span) * HISTOGRAM_BARS),
        );
        buckets[index] += 1;
    }

    const peak = Math.max(...buckets, 1);
    return buckets.map((count) => Math.max(0.08, count / peak));
}

function averageListingPrice(
    listings: OwnerListingItem[],
    type: OwnerListingTransactionType | "",
): string | null {
    const amounts = listings
        .map((item) => listingCompareAmountInr(item, type))
        .filter((amount) => amount > 0);
    if (amounts.length === 0) return null;
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    return type === "rent" ? formatRentInr(average) : formatPriceInr(average);
}

export function OwnerListingsFilterSheet({
    open,
    onOpenChange,
    appliedFilters,
    filterContext,
    listings,
    onApply,
}: OwnerListingsFilterSheetProps) {
    const [draft, setDraft] = useState(() => extractSheetFilters(appliedFilters));
    const [draftSource, setDraftSource] = useState({ open: false, appliedFilters });

    if (open && (!draftSource.open || draftSource.appliedFilters !== appliedFilters)) {
        setDraftSource({ open: true, appliedFilters });
        setDraft(extractSheetFilters(appliedFilters));
    } else if (!open && draftSource.open) {
        setDraftSource({ open: false, appliedFilters });
    }

    const budgetSteps = useMemo(() => getBudgetSteps(draft.type), [draft.type]);
    const budgetStepIndex = useMemo(
        () => findBudgetStepIndex(draft.min, draft.max, budgetSteps),
        [budgetSteps, draft.max, draft.min],
    );
    const histogram = useMemo(
        () => buildPriceHistogram(listings, draft.type),
        [draft.type, listings],
    );
    const averagePrice = useMemo(
        () => averageListingPrice(listings, draft.type),
        [draft.type, listings],
    );

    const previewCount = useMemo(() => {
        const merged: OwnerListingsFilters = {
            ...appliedFilters,
            ...draft,
        };
        return filterOwnerListings(listings, merged, filterContext).totalCount;
    }, [appliedFilters, draft, filterContext, listings]);

    const hasDraftFilters = useMemo(() => {
        return (
            Boolean(draft.q.trim()) ||
            Boolean(draft.propertyType) ||
            Boolean(draft.furnishing) ||
            Boolean(draft.type) ||
            draft.bhk.length > 0 ||
            Boolean(draft.min) ||
            Boolean(draft.max) ||
            draft.newToday ||
            draft.slotsOpen ||
            draft.commissionSet ||
            draft.readyToMove
        );
    }, [draft]);

    const selectedFurnishingCount = draft.furnishing ? 1 : 0;
    const selectedDealCount = DEAL_OPTIONS.filter((option) => draft[option.key]).length;

    const updateDraft = (patch: Partial<OwnerListingsSheetFilters>) => {
        setDraft((prev) => ({ ...prev, ...patch }));
    };

    const setBudgetStep = (index: number) => {
        const step = budgetSteps[index] ?? budgetSteps[0];
        updateDraft({ min: step.min, max: step.max });
    };

    const nudgeBudget = (delta: number) => {
        setBudgetStep(Math.min(budgetSteps.length - 1, Math.max(0, budgetStepIndex + delta)));
    };

    const toggleBhk = (value: string) => {
        setDraft((prev) => {
            const exists = prev.bhk.includes(value);
            return {
                ...prev,
                bhk: exists ? prev.bhk.filter((item) => item !== value) : [...prev.bhk, value],
            };
        });
    };

    const nudgeBhkSelection = (delta: number) => {
        const current = draft.bhk[0] ? Number(draft.bhk[0]) : 0;
        const next = Math.min(5, Math.max(0, current + delta));
        updateDraft({ bhk: next === 0 ? [] : [String(next)] });
    };

    const handleApply = () => {
        onApply(draft);
        onOpenChange(false);
    };

    const handleClear = () => {
        setDraft(EMPTY_SHEET_FILTERS);
    };

    const budgetLabel = formatBudgetLabel(draft.min, draft.max, draft.type);
    const formatBound = draft.type === "rent" ? formatRentInr : formatPriceInr;
    const minDisplay = draft.min ? formatBound(Number(draft.min)) : "Min";
    const maxDisplay = draft.max ? formatBound(Number(draft.max)) : "Max";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup
                showCloseButton={false}
                className={cn(
                    `
                      flex flex-col gap-0 overflow-hidden p-0
                      inline-[min(72rem,calc(100vw-1.5rem))]
                      max-inline-[min(72rem,calc(100vw-1.5rem))]
                      max-block-[min(92dvh,calc(100%-1.5rem))]
                      sm:inline-[min(72rem,calc(100vw-3rem))]
                      sm:max-inline-[min(72rem,calc(100vw-3rem))]
                    `,
                )}
            >
                <DialogHeader
                    className="
                      shrink-0 flex-row items-center justify-between gap-4 border-be
                      border-border-warm px-5 py-4 pe-5 text-start
                      sm:px-7 sm:py-5 sm:pe-7
                    "
                >
                    <DialogTitle className="font-display text-xl sm:text-2xl">Filter</DialogTitle>
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <button
                                        type="button"
                                        aria-label="Reset filters"
                                        disabled={!hasDraftFilters}
                                        onClick={handleClear}
                                        className="
                                          flex items-center justify-center rounded-full border
                                          border-border-warm bg-surface text-ink-muted
                                          transition-[color,background-color,transform] duration-160
                                          block-10 inline-10
                                          hover:bg-surface-muted hover:text-ink
                                          focus-visible:ring-2 focus-visible:ring-brand
                                          disabled:opacity-40
                                          active:scale-[0.94]
                                        "
                                    >
                                        <RotateCcw
                                            className="block-4 inline-4"
                                            strokeWidth={1.75}
                                            aria-hidden
                                        />
                                    </button>
                                }
                            />
                            <TooltipContent side="bottom">Reset filters</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <DialogClose
                                        className="
                                          flex items-center justify-center rounded-full
                                          bg-brand-ink text-surface
                                          transition-[background-color,transform] duration-160
                                          block-10 inline-10
                                          hover:bg-brand-ink/90
                                          focus-visible:ring-2 focus-visible:ring-brand
                                          focus-visible:ring-offset-2
                                          focus-visible:ring-offset-surface
                                          active:scale-[0.94]
                                        "
                                    >
                                        <XIcon
                                            className="block-4.5 inline-4.5"
                                            strokeWidth={2}
                                            aria-hidden
                                        />
                                        <span className="sr-only">Close</span>
                                    </DialogClose>
                                }
                            />
                            <TooltipContent side="bottom">
                                Close
                                <Kbd className="px-1.5 text-[10px] min-inline-4">Esc</Kbd>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </DialogHeader>

                <div className="flex min-block-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 sm:gap-5 sm:px-7 sm:py-6">
                    <div className="rounded-[1.25rem] bg-surface-muted/70 p-3 sm:p-4">
                        <Input
                            size="lg"
                            value={draft.q}
                            onChange={(event) => updateDraft({ q: event.target.value })}
                            placeholder="Locality, society, or config"
                            aria-label="Search owner listings"
                            startIcon={Search}
                            clearable
                            className="border-border-warm bg-surface"
                        />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:gap-5">
                        <FilterPanel
                            title="Looking for"
                            subtitle="Sale, rent, or browse the full pool"
                        >
                            <div className="grid gap-2 sm:grid-cols-3">
                                {LOOKING_FOR_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    const active = draft.type === option.value;
                                    return (
                                        <button
                                            key={option.label}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() =>
                                                updateDraft({
                                                    type: option.value,
                                                    min: "",
                                                    max: "",
                                                })
                                            }
                                            className={cn(
                                                `
                                                  flex flex-col gap-3 rounded-2xl border p-3.5 text-start
                                                  transition-[background-color,border-color,color]
                                                  duration-160
                                                  min-block-28
                                                `,
                                                active
                                                    ? "border-brand-ink bg-brand-ink text-surface"
                                                    : `
                                                      border-transparent bg-surface text-ink
                                                      hover:border-border-warm
                                                    `,
                                            )}
                                        >
                                            <Icon
                                                aria-hidden
                                                className={cn(
                                                    "block-5 inline-5",
                                                    active ? "text-surface" : "text-ink-muted",
                                                )}
                                                strokeWidth={1.75}
                                            />
                                            <span className="flex flex-col gap-1">
                                                <span className="text-sm font-semibold">
                                                    {option.label}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "body-sm",
                                                        active
                                                            ? "text-surface/75"
                                                            : "text-ink-muted",
                                                    )}
                                                >
                                                    {option.description}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </FilterPanel>

                        <FilterPanel
                            title="Budget"
                            subtitle={
                                averagePrice
                                    ? `Average ask is ${averagePrice}`
                                    : "Pick a range that fits your clients"
                            }
                        >
                            <div className="flex flex-col gap-4">
                                <div
                                    className="flex items-end gap-1 px-1 min-block-20"
                                    aria-hidden
                                >
                                    {histogram.map((height, index) => {
                                        const highlight =
                                            budgetStepIndex === 0 ||
                                            Math.round(
                                                (index / (HISTOGRAM_BARS - 1)) *
                                                    (budgetSteps.length - 1),
                                            ) <= budgetStepIndex;
                                        return (
                                            <span
                                                key={index}
                                                className={cn(
                                                    "flex-1 rounded-full",
                                                    highlight ? "bg-brand/55" : "bg-border-warm",
                                                )}
                                                style={{ blockSize: `${height * 100}%` }}
                                            />
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        aria-label="Lower budget"
                                        onClick={() => nudgeBudget(-1)}
                                        disabled={budgetStepIndex <= 0}
                                        className="
                                          flex items-center justify-center rounded-full border
                                          border-border-warm bg-surface
                                          transition-[background-color,transform] duration-160
                                          block-9 inline-9
                                          hover:bg-surface-muted
                                          disabled:opacity-40
                                          active:scale-[0.94]
                                        "
                                    >
                                        <Minus className="block-4 inline-4" strokeWidth={1.75} />
                                    </button>
                                    <div className="relative h-1.5 flex-1 rounded-full bg-border-warm">
                                        <div
                                            className="absolute inset-bs-0 inset-is-0 rounded-full bg-brand-ink block-full"
                                            style={{
                                                inlineSize: `${(budgetStepIndex / Math.max(budgetSteps.length - 1, 1)) * 100}%`,
                                            }}
                                        />
                                        <span
                                            className="
                                              absolute inset-bs-1/2 rounded-full border-2
                                              border-brand-ink bg-surface shadow-sm
                                              block-4 inline-4 -translate-y-1/2
                                            "
                                            style={{
                                                insetInlineStart: `calc(${(budgetStepIndex / Math.max(budgetSteps.length - 1, 1)) * 100}% - 0.5rem)`,
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Raise budget"
                                        onClick={() => nudgeBudget(1)}
                                        disabled={budgetStepIndex >= budgetSteps.length - 1}
                                        className="
                                          flex items-center justify-center rounded-full border
                                          border-border-warm bg-surface
                                          transition-[background-color,transform] duration-160
                                          block-9 inline-9
                                          hover:bg-surface-muted
                                          disabled:opacity-40
                                          active:scale-[0.94]
                                        "
                                    >
                                        <Plus className="block-4 inline-4" strokeWidth={1.75} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-2xl border border-border-warm bg-surface px-3 py-2.5">
                                        <p className="eyebrow">Minimum</p>
                                        <p className="mts-1 text-sm font-semibold text-ink">
                                            {minDisplay}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-border-warm bg-surface px-3 py-2.5">
                                        <p className="eyebrow">Maximum</p>
                                        <p className="mts-1 text-sm font-semibold text-ink">
                                            {maxDisplay}
                                        </p>
                                    </div>
                                </div>
                                <p className="body-sm text-ink-muted">{budgetLabel}</p>
                            </div>
                        </FilterPanel>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_1fr] lg:gap-5">
                        <FilterPanel title="Rooms" subtitle="How many bedrooms your client needs">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-3 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <BedDouble
                                            className="text-ink-muted block-5 inline-5"
                                            strokeWidth={1.75}
                                            aria-hidden
                                        />
                                        <span className="text-sm font-semibold text-ink">BHK</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            aria-label="Fewer bedrooms"
                                            onClick={() => nudgeBhkSelection(-1)}
                                            className="
                                              flex items-center justify-center rounded-full border
                                              border-border-warm
                                              transition-[background-color,transform] duration-160
                                              block-8 inline-8
                                              hover:bg-surface-muted
                                              active:scale-[0.94]
                                            "
                                        >
                                            <Minus className="block-3.5 inline-3.5" />
                                        </button>
                                        <span className="tabular-nums text-lg font-semibold min-inline-8 text-center">
                                            {draft.bhk[0]
                                                ? String(draft.bhk[0]).padStart(2, "0")
                                                : "Any"}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label="More bedrooms"
                                            onClick={() => nudgeBhkSelection(1)}
                                            className="
                                              flex items-center justify-center rounded-full border
                                              border-border-warm
                                              transition-[background-color,transform] duration-160
                                              block-8 inline-8
                                              hover:bg-surface-muted
                                              active:scale-[0.94]
                                            "
                                        >
                                            <Plus className="block-3.5 inline-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {BHK_OPTIONS.map((value) => {
                                        const active = draft.bhk.includes(value);
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => toggleBhk(value)}
                                                className={cn(
                                                    `
                                                      rounded-full border px-3.5 py-2 text-sm
                                                      font-semibold
                                                      transition-[background-color,border-color,color]
                                                      duration-160
                                                    `,
                                                    active
                                                        ? "border-brand-ink bg-brand-ink text-surface"
                                                        : `
                                                          border-border-warm bg-surface text-ink-muted
                                                          hover:text-ink
                                                        `,
                                                )}
                                            >
                                                {value} BHK
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-2 text-ink-muted">
                                    <Bath className="block-4 inline-4" strokeWidth={1.75} />
                                    <span className="body-sm">
                                        Bathrooms follow the listing config
                                    </span>
                                </div>
                            </div>
                        </FilterPanel>

                        <FilterPanel title="Property type">
                            <div className="grid grid-cols-2 gap-2">
                                {PROPERTY_TYPE_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    const active = draft.propertyType === option.value;
                                    return (
                                        <button
                                            key={option.label}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => updateDraft({ propertyType: option.value })}
                                            className={cn(
                                                `
                                                  flex flex-col items-start gap-3 rounded-2xl border
                                                  px-3 py-3 text-start
                                                  transition-[background-color,border-color,color]
                                                  duration-160
                                                  min-block-22
                                                `,
                                                active
                                                    ? "border-brand-ink bg-brand-ink text-surface"
                                                    : `
                                                      border-transparent bg-surface text-ink
                                                      hover:border-border-warm
                                                    `,
                                            )}
                                        >
                                            <Icon
                                                aria-hidden
                                                className={cn(
                                                    "block-5 inline-5",
                                                    active ? "text-surface" : "text-ink-muted",
                                                )}
                                                strokeWidth={1.75}
                                            />
                                            <span className="text-sm font-semibold">
                                                {option.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </FilterPanel>

                        <div className="flex flex-col gap-4">
                            <FilterPanel
                                title="Furnishing"
                                action={
                                    <span className="body-sm text-ink-muted">
                                        {selectedFurnishingCount} selected
                                    </span>
                                }
                            >
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        aria-pressed={!draft.furnishing}
                                        onClick={() => updateDraft({ furnishing: "" })}
                                        className={cn(
                                            `
                                              inline-flex items-center gap-1.5 rounded-full border
                                              px-3 py-2 text-sm font-semibold
                                              transition-[background-color,border-color,color]
                                              duration-160
                                            `,
                                            !draft.furnishing
                                                ? "border-brand-ink bg-brand-ink text-surface"
                                                : "border-border-warm bg-surface text-ink-muted",
                                        )}
                                    >
                                        <Sofa className="block-3.5 inline-3.5" strokeWidth={1.75} />
                                        Any
                                    </button>
                                    {FURNISHING_OPTIONS.map((option) => {
                                        const active = draft.furnishing === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() =>
                                                    updateDraft({
                                                        furnishing: active ? "" : option.value,
                                                    })
                                                }
                                                className={cn(
                                                    `
                                                      inline-flex items-center gap-1.5 rounded-full
                                                      border px-3 py-2 text-sm font-semibold
                                                      transition-[background-color,border-color,color]
                                                      duration-160
                                                    `,
                                                    active
                                                        ? "border-brand-ink bg-brand-ink text-surface"
                                                        : `
                                                          border-border-warm bg-surface text-ink
                                                        `,
                                                )}
                                            >
                                                {option.label}
                                                {active ? (
                                                    <XIcon
                                                        className="block-3.5 inline-3.5"
                                                        strokeWidth={2}
                                                    />
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterPanel>

                            <FilterPanel
                                title="Deal options"
                                action={
                                    <span className="body-sm text-ink-muted">
                                        {selectedDealCount} selected
                                    </span>
                                }
                            >
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {DEAL_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        const active = draft[option.key];
                                        return (
                                            <button
                                                key={option.key}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() =>
                                                    updateDraft({
                                                        [option.key]: !draft[option.key],
                                                    })
                                                }
                                                className={cn(
                                                    `
                                                      flex flex-col gap-3 rounded-2xl border p-3
                                                      text-start
                                                      transition-[background-color,border-color,color]
                                                      duration-160
                                                      min-block-28
                                                    `,
                                                    active
                                                        ? "border-brand-ink bg-brand-ink text-surface"
                                                        : `
                                                          border-transparent bg-surface text-ink
                                                          hover:border-border-warm
                                                        `,
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <Icon
                                                        aria-hidden
                                                        className={cn(
                                                            "block-5 inline-5",
                                                            active
                                                                ? "text-surface"
                                                                : "text-ink-muted",
                                                        )}
                                                        strokeWidth={1.75}
                                                    />
                                                    <span
                                                        aria-hidden
                                                        className={cn(
                                                            `
                                                              relative rounded-full
                                                              transition-colors duration-160
                                                              block-5 inline-9
                                                            `,
                                                            active
                                                                ? "bg-brand"
                                                                : "bg-border-warm",
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                `
                                                                  absolute inset-bs-0.5 rounded-full
                                                                  bg-surface shadow-xs
                                                                  transition-[inset-inline-start]
                                                                  duration-160
                                                                  block-4 inline-4
                                                                `,
                                                                active
                                                                    ? "inset-ie-0.5"
                                                                    : "inset-is-0.5",
                                                            )}
                                                        />
                                                    </span>
                                                </div>
                                                <span className="flex flex-col gap-1">
                                                    <span className="text-sm font-semibold">
                                                        {option.label}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "body-sm",
                                                            active
                                                                ? "text-surface/75"
                                                                : "text-ink-muted",
                                                        )}
                                                    >
                                                        {option.description}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterPanel>
                        </div>
                    </div>
                </div>

                <div
                    className="
                      shrink-0 flex flex-col-reverse gap-3 border-bs border-border-warm bg-surface
                      px-5 py-4
                      sm:flex-row sm:items-center sm:justify-between sm:px-7
                    "
                >
                    <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        disabled={!hasDraftFilters}
                        className="text-ink-muted hover:text-ink"
                        onClick={handleClear}
                    >
                        Clear all
                    </Button>
                    <Button
                        type="button"
                        size="lg"
                        className="
                          bg-brand-ink text-surface rounded-full px-8
                          sm:min-inline-56
                          hover:bg-brand-ink/90
                        "
                        onClick={handleApply}
                    >
                        Show {previewCount} properties
                    </Button>
                </div>
            </DialogPopup>
        </Dialog>
    );
}
