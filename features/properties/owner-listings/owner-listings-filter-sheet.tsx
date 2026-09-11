"use client";

import { useMemo, useState } from "react";

import {
    BadgePercent,
    CalendarDays,
    DoorOpen,
    KeyRound,
    type LucideIcon,
    MapPinned,
    Ruler,
    XIcon,
} from "lucide-react";
import SimpleBar from "simplebar-react";

import { extractSheetFilters } from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import { AppModalFooter } from "@/components/shared/app-modal-footer";
import {
    Dialog,
    DialogClose,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { filterOwnerListings } from "@/features/properties/owner-listings/filter-owner-listings";
import type {
    OwnerListingItem,
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingsSheetFilters,
} from "@/features/properties/owner-listings/types";

import "simplebar-react/dist/simplebar.min.css";

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
        label: "Your areas first",
        description: "Show your service localities before others",
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
    minAreaSqft: "",
    maxAreaSqft: "",
    listedWithinDays: "",
    minCommissionPercent: "",
    yourAreas: false,
    newToday: false,
    slotsOpen: false,
    commissionSet: false,
    readyToMove: false,
};

const SELECT_TRANSITION =
    "transition-[background-color,border-color,color,box-shadow] duration-160";

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
                "flex flex-col gap-4 rounded-card border border-border-warm p-4 block-full sm:p-5",
                className,
            )}
        >
            <div className="flex shrink-0 flex-col gap-1">
                <h3 className="font-display text-base font-medium text-ink">{title}</h3>
                {subtitle ? <p className="body-sm text-ink-muted">{subtitle}</p> : null}
            </div>
            <div className="flex flex-1 flex-col gap-3 min-block-0">{children}</div>
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
                  inline-flex items-center justify-center rounded-control border px-3.5 py-2 text-sm
                  font-semibold whitespace-nowrap
                `,
                SELECT_TRANSITION,
                active
                    ? "border-brand bg-brand-soft text-brand-text"
                    : `
                      border-border-warm bg-transparent text-ink-muted
                      hover:border-brand/40 hover:text-ink
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
                `flex flex-col justify-center gap-2 rounded-inner border p-3.5 text-start block-full`,
                SELECT_TRANSITION,
                active
                    ? "border-brand bg-brand-soft text-brand-text"
                    : `
                      border-border-warm bg-transparent text-ink
                      hover:border-brand/40 hover:text-brand-text
                    `,
            )}
        >
            {Icon ? (
                <Icon
                    aria-hidden
                    className={cn("block-5 inline-5", active ? "text-brand" : "text-ink-muted")}
                    strokeWidth={1.75}
                />
            ) : null}
            <span className="text-sm font-semibold">{label}</span>
            {hint ? (
                <span className={cn("body-sm", active ? "text-brand-text/75" : "text-ink-muted")}>
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
    onCheckedChange,
}: {
    label: string;
    description: string;
    icon: LucideIcon;
    active: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <div
            className={cn(
                "flex items-start gap-3 rounded-inner border p-3.5 sm:p-4",
                SELECT_TRANSITION,
                active
                    ? "border-brand bg-transparent"
                    : "border-border-warm bg-transparent hover:border-brand/35",
            )}
        >
            <button
                type="button"
                className="flex flex-1 items-start gap-3 text-start min-inline-0"
                onClick={() => onCheckedChange(!active)}
            >
                <span
                    className={cn(
                        "flex shrink-0 items-center justify-center",
                        SELECT_TRANSITION,
                        active ? "text-brand" : "text-ink-muted",
                    )}
                >
                    <Icon aria-hidden className="block-5 inline-5" strokeWidth={1.75} />
                </span>
                <span className="flex flex-1 flex-col gap-0.5 min-inline-0">
                    <span
                        className={cn(
                            "text-sm font-semibold",
                            active ? "text-brand-text" : "text-ink",
                        )}
                    >
                        {label}
                    </span>
                    <span className="body-sm text-ink-muted">{description}</span>
                </span>
            </button>
            <Switch
                checked={active}
                onCheckedChange={onCheckedChange}
                aria-label={label}
                className="
                  mts-1
                  data-checked:border-brand data-checked:bg-brand
                  data-unchecked:border-border-warm data-unchecked:bg-border-warm/80
                "
            />
        </div>
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
            Boolean(draft.minAreaSqft) ||
            Boolean(draft.maxAreaSqft) ||
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
        onApply({
            ...draft,
            // Keep the New chip in sync with the Listed preset.
            newToday: draft.listedWithinDays === "7",
            cursor: "",
        });
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
                      flex flex-col gap-0 overflow-hidden border-border-warm bg-surface p-0
                      block-[min(90dvh,calc(100%-1.5rem))] inline-[min(64rem,calc(100vw-1.5rem))]
                      max-inline-[min(64rem,calc(100vw-1.5rem))]
                      sm:inline-[min(64rem,calc(100vw-3rem))]
                      sm:max-inline-[min(64rem,calc(100vw-3rem))]
                    `,
                )}
            >
                <DialogHeader
                    className="
                      shrink-0 flex-row items-center justify-between gap-4 border-be
                      border-border-warm bg-surface px-5 py-4 pe-5 text-start
                      sm:px-7 sm:py-5 sm:pe-7
                    "
                >
                    <div className="flex flex-col gap-1">
                        <DialogTitle className="
                          font-display text-base font-medium text-ink
                          sm:text-lg
                        ">
                            Advanced filters
                        </DialogTitle>
                        <p className="body-sm text-ink-muted">
                            Extra controls beyond the search bar — area, timing, commission, and
                            deal fit
                        </p>
                    </div>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <DialogClose
                                    className="
                                      flex shrink-0 items-center justify-center rounded-control border
                                      border-border-warm bg-surface text-ink-muted
                                      transition-[background-color,border-color,color,transform]
                                      duration-160 block-10 inline-10
                                      hover:border-brand/40 hover:bg-brand-soft
                                      hover:text-brand-text
                                      focus-visible:ring-2 focus-visible:ring-brand
                                      focus-visible:ring-offset-2 focus-visible:ring-offset-surface
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
                        <TooltipContent side="inline-start">
                            Close
                            <Kbd className="px-1.5 text-[10px] min-inline-4">Esc</Kbd>
                        </TooltipContent>
                    </Tooltip>
                </DialogHeader>

                <div className="flex-1 overflow-hidden bg-surface min-block-0">
                    <SimpleBar
                        className="app-modal-simplebar block-full"
                        style={{ maxHeight: "100%", height: "100%" }}
                        autoHide={false}
                    >
                        <div className="flex flex-col gap-4 p-5 sm:gap-5 sm:px-7 sm:py-6">
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
                                    <div
                                        className="
                                          grid flex-1 auto-rows-fr grid-cols-1 gap-2.5 min-block-0
                                          sm:grid-cols-3
                                        "
                                    >
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
                                    title="Commission"
                                    subtitle="Minimum rate the owner has shared"
                                    className="md:col-span-2"
                                >
                                    <div
                                        className="
                                          grid flex-1 auto-rows-fr grid-cols-2 gap-2.5 min-block-0
                                          sm:grid-cols-4
                                        "
                                    >
                                        {COMMISSION_PRESETS.map((preset) => (
                                            <OptionCard
                                                key={preset.value || "any"}
                                                label={preset.label}
                                                hint={preset.hint}
                                                active={draft.minCommissionPercent === preset.value}
                                                icon={BadgePercent}
                                                onClick={() =>
                                                    updateDraft({
                                                        minCommissionPercent: preset.value,
                                                    })
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
                                <div className="grid gap-2.5 sm:grid-cols-2">
                                    {DEAL_OPTIONS.map((option) => (
                                        <DealToggle
                                            key={option.key}
                                            label={option.label}
                                            description={option.description}
                                            icon={option.icon}
                                            active={draft[option.key]}
                                            onCheckedChange={(checked) =>
                                                updateDraft({ [option.key]: checked })
                                            }
                                        />
                                    ))}
                                </div>
                            </FilterPanel>
                        </div>
                    </SimpleBar>
                </div>

                <div className="shrink-0 border-bs border-border-warm bg-surface px-5 py-4 sm:px-7">
                    <AppModalFooter
                        secondaryLabel="Clear all"
                        secondaryDisabled={!hasDraftFilters}
                        onSecondary={handleClear}
                        primaryLabel={`Show ${previewCount} properties`}
                        onPrimary={handleApply}
                    />
                </div>
            </DialogPopup>
        </Dialog>
    );
}
