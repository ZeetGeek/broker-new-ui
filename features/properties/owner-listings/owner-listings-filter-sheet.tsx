"use client";

import { useMemo, useState } from "react";

import {
    BadgePercent,
    CalendarDays,
    Camera,
    DoorOpen,
    KeyRound,
    MapPinned,
    RotateCcw,
    Ruler,
    Search,
    XIcon,
    type LucideIcon,
} from "lucide-react";

import { extractSheetFilters } from "@/lib/format/owner-listings-labels";
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
import type {
    OwnerListingItem,
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingsSheetFilters,
} from "@/features/properties/owner-listings/types";

type AreaPreset = { min: string; max: string; label: string };
type ChoicePreset = { value: string; label: string; hint?: string };

const AREA_PRESETS: AreaPreset[] = [
    { min: "", max: "", label: "Any size" },
    { min: "", max: "500", label: "Under 500 sqft" },
    { min: "500", max: "1000", label: "500 – 1,000" },
    { min: "1000", max: "1500", label: "1,000 – 1,500" },
    { min: "1500", max: "2500", label: "1,500 – 2,500" },
    { min: "2500", max: "", label: "2,500+ sqft" },
];

const PHOTO_PRESETS: ChoicePreset[] = [
    { value: "", label: "Any", hint: "No photo minimum" },
    { value: "1", label: "Has photos", hint: "At least 1 photo" },
    { value: "5", label: "5+ photos", hint: "Stronger listing gallery" },
];

const LISTED_PRESETS: ChoicePreset[] = [
    { value: "", label: "Any time", hint: "All listing ages" },
    { value: "7", label: "Last 7 days", hint: "Fresh to the pool" },
    { value: "30", label: "Last 30 days", hint: "Still recent inventory" },
];

const COMMISSION_PRESETS: ChoicePreset[] = [
    { value: "", label: "Any", hint: "Commission optional" },
    { value: "1", label: "1%+", hint: "At least 1% shared" },
    { value: "2", label: "2%+", hint: "At least 2% shared" },
    { value: "3", label: "3%+", hint: "At least 3% shared" },
];

const DEAL_OPTIONS: {
    key: keyof Pick<
        OwnerListingsSheetFilters,
        "yourAreas" | "readyToMove" | "slotsOpen" | "commissionSet"
    >;
    label: string;
    description: string;
    icon: LucideIcon;
}[] = [
    {
        key: "yourAreas",
        label: "Your areas only",
        description: "Limit to your service localities",
        icon: MapPinned,
    },
    {
        key: "readyToMove",
        label: "Ready to move",
        description: "Immediate possession",
        icon: KeyRound,
    },
    {
        key: "slotsOpen",
        label: "Slots open",
        description: "Still taking broker requests",
        icon: DoorOpen,
    },
    {
        key: "commissionSet",
        label: "Commission set",
        description: "Owner already shared a rate",
        icon: BadgePercent,
    },
];

const EMPTY_SHEET_FILTERS: OwnerListingsSheetFilters = {
    q: "",
    minAreaSqft: "",
    maxAreaSqft: "",
    minPhotos: "",
    listedWithinDays: "",
    minCommissionPercent: "",
    yourAreas: false,
    newToday: false,
    slotsOpen: false,
    commissionSet: false,
    readyToMove: false,
};

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
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                "flex block-full flex-col gap-3 rounded-[1.25rem] bg-surface-muted/70 p-4 sm:p-5",
                className,
            )}
        >
            <div className="flex shrink-0 flex-col gap-1">
                <h3 className="font-display text-base font-medium text-ink">{title}</h3>
                {subtitle ? <p className="body-sm text-ink-muted">{subtitle}</p> : null}
            </div>
            <div className="flex min-block-0 flex-1 flex-col gap-3">{children}</div>
        </section>
    );
}

function ChoiceChip({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                `
                  inline-flex items-center justify-center rounded-full border px-3.5 py-2 text-sm
                  font-semibold whitespace-nowrap
                  transition-[background-color,border-color,color] duration-160
                `,
                active
                    ? "border-brand-ink bg-brand-ink text-surface"
                    : `
                      border-border-warm bg-surface text-ink-muted
                      hover:border-ink/20 hover:text-ink
                    `,
            )}
        >
            {label}
        </button>
    );
}

function OptionCard({
    label,
    hint,
    active,
    icon: Icon,
    onClick,
}: {
    label: string;
    hint?: string;
    active: boolean;
    icon?: LucideIcon;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                `
                  flex block-full flex-col justify-center gap-2 rounded-2xl border p-3.5 text-start
                  transition-[background-color,border-color,color] duration-160
                `,
                active
                    ? "border-brand-ink bg-brand-ink text-surface"
                    : "border-transparent bg-surface text-ink hover:border-border-warm",
            )}
        >
            {Icon ? (
                <Icon
                    aria-hidden
                    className={cn("block-5 inline-5", active ? "text-surface" : "text-ink-muted")}
                    strokeWidth={1.75}
                />
            ) : null}
            <span className="text-sm font-semibold">{label}</span>
            {hint ? (
                <span className={cn("body-sm", active ? "text-surface/75" : "text-ink-muted")}>
                    {hint}
                </span>
            ) : null}
        </button>
    );
}

function DealToggle({
    label,
    description,
    icon: Icon,
    active,
    onClick,
}: {
    label: string;
    description: string;
    icon: LucideIcon;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                `
                  flex items-start gap-3 rounded-2xl border p-3.5 text-start
                  transition-[background-color,border-color] duration-160
                `,
                active
                    ? "border-brand bg-brand-soft"
                    : "border-transparent bg-surface hover:border-border-warm",
            )}
        >
            <span
                className={cn(
                    "flex shrink-0 items-center justify-center rounded-full block-10 inline-10",
                    active ? "bg-brand text-surface" : "bg-surface-muted text-ink-muted",
                )}
            >
                <Icon aria-hidden className="block-4.5 inline-4.5" strokeWidth={1.75} />
            </span>
            <span className="flex min-inline-0 flex-1 flex-col gap-0.5">
                <span
                    className={cn("text-sm font-semibold", active ? "text-brand-text" : "text-ink")}
                >
                    {label}
                </span>
                <span className="body-sm text-ink-muted">{description}</span>
            </span>
            <span
                aria-hidden
                className={cn(
                    "relative mt-1 shrink-0 rounded-full transition-colors duration-160 block-5 inline-9",
                    active ? "bg-brand" : "bg-border-warm",
                )}
            >
                <span
                    className={cn(
                        `
                          absolute inset-bs-0.5 rounded-full bg-surface shadow-xs
                          transition-[inset-inline-start] duration-160
                          block-4 inline-4
                        `,
                        active ? "inset-is-[1.125rem]" : "inset-is-0.5",
                    )}
                />
            </span>
        </button>
    );
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
            Boolean(draft.minAreaSqft) ||
            Boolean(draft.maxAreaSqft) ||
            Boolean(draft.minPhotos) ||
            Boolean(draft.listedWithinDays) ||
            Boolean(draft.minCommissionPercent) ||
            draft.yourAreas ||
            draft.newToday ||
            draft.slotsOpen ||
            draft.commissionSet ||
            draft.readyToMove
        );
    }, [draft]);

    const updateDraft = (patch: Partial<OwnerListingsSheetFilters>) => {
        setDraft((prev) => ({ ...prev, ...patch }));
    };

    const setListedPreset = (value: string) => {
        updateDraft({
            listedWithinDays: value,
            newToday: value === "7",
        });
    };

    const handleApply = () => {
        onApply(draft);
        onOpenChange(false);
    };

    const handleClear = () => {
        setDraft(EMPTY_SHEET_FILTERS);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup
                showCloseButton={false}
                className={cn(
                    `
                      flex flex-col gap-0 overflow-hidden p-0
                      inline-[min(64rem,calc(100vw-1.5rem))]
                      max-inline-[min(64rem,calc(100vw-1.5rem))]
                      max-block-[min(90dvh,calc(100%-1.5rem))]
                      sm:inline-[min(64rem,calc(100vw-3rem))]
                      sm:max-inline-[min(64rem,calc(100vw-3rem))]
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
                    <div className="flex flex-col gap-1">
                        <DialogTitle className="font-display text-xl sm:text-2xl">
                            Advanced filters
                        </DialogTitle>
                        <p className="body-sm text-ink-muted">
                            Extra controls beyond the search bar — area, photos, timing, and deal
                            fit
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
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
                    <FilterPanel
                        title="Search"
                        subtitle="Find a locality, society name, or config label"
                    >
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
                    </FilterPanel>

                    <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                        <FilterPanel
                            title="Area"
                            subtitle="Built-up size that fits your client brief"
                        >
                            <div className="flex flex-1 flex-wrap content-start gap-2">
                                {AREA_PRESETS.map((preset) => {
                                    const active =
                                        draft.minAreaSqft === preset.min &&
                                        draft.maxAreaSqft === preset.max;
                                    return (
                                        <ChoiceChip
                                            key={preset.label}
                                            label={preset.label}
                                            active={active}
                                            onClick={() =>
                                                updateDraft({
                                                    minAreaSqft: preset.min,
                                                    maxAreaSqft: preset.max,
                                                })
                                            }
                                        />
                                    );
                                })}
                            </div>
                            <div className="mts-auto flex items-center gap-2 text-ink-muted">
                                <Ruler className="block-4 inline-4" strokeWidth={1.75} />
                                <span className="body-sm">Uses listing area in sqft</span>
                            </div>
                        </FilterPanel>

                        <FilterPanel
                            title="Listed"
                            subtitle="How fresh the listing should be"
                        >
                            <div className="grid min-block-0 flex-1 auto-rows-fr grid-cols-1 gap-2 sm:grid-cols-3">
                                {LISTED_PRESETS.map((preset) => (
                                    <OptionCard
                                        key={preset.value || "any"}
                                        label={preset.label}
                                        hint={preset.hint}
                                        active={draft.listedWithinDays === preset.value}
                                        icon={CalendarDays}
                                        onClick={() => setListedPreset(preset.value)}
                                    />
                                ))}
                            </div>
                        </FilterPanel>

                        <FilterPanel
                            title="Photos"
                            subtitle="Skip thin listings before you request"
                        >
                            <div className="grid min-block-0 flex-1 auto-rows-fr grid-cols-1 gap-2 sm:grid-cols-3">
                                {PHOTO_PRESETS.map((preset) => (
                                    <OptionCard
                                        key={preset.value || "any"}
                                        label={preset.label}
                                        hint={preset.hint}
                                        active={draft.minPhotos === preset.value}
                                        icon={Camera}
                                        onClick={() => updateDraft({ minPhotos: preset.value })}
                                    />
                                ))}
                            </div>
                        </FilterPanel>

                        <FilterPanel
                            title="Commission"
                            subtitle="Minimum rate the owner has shared"
                        >
                            <div className="grid min-block-0 flex-1 auto-rows-fr grid-cols-1 gap-2 sm:grid-cols-2">
                                {COMMISSION_PRESETS.map((preset) => (
                                    <OptionCard
                                        key={preset.value || "any"}
                                        label={preset.label}
                                        hint={preset.hint}
                                        active={draft.minCommissionPercent === preset.value}
                                        icon={BadgePercent}
                                        onClick={() =>
                                            updateDraft({ minCommissionPercent: preset.value })
                                        }
                                    />
                                ))}
                            </div>
                        </FilterPanel>
                    </div>

                    <FilterPanel
                        title="Deal fit"
                        subtitle="Broker-side signals that are not on the search bar"
                    >
                        <div className="grid gap-2 sm:grid-cols-2">
                            {DEAL_OPTIONS.map((option) => (
                                <DealToggle
                                    key={option.key}
                                    label={option.label}
                                    description={option.description}
                                    icon={option.icon}
                                    active={draft[option.key]}
                                    onClick={() =>
                                        updateDraft({ [option.key]: !draft[option.key] })
                                    }
                                />
                            ))}
                        </div>
                    </FilterPanel>
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
