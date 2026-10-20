"use client";

import { useMemo, useState } from "react";

import {
    BadgePercent,
    BedDouble,
    CalendarDays,
    type AppIcon,
    KeyRound,
    Sofa,
    XIcon,
} from "@/components/shared/icons";
import SimpleBar from "simplebar-react";

import { formatInr } from "@/lib/format/inr";
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
import { RangeSlider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { filterOwnerListings } from "@/features/properties/owner-listings/filter-owner-listings";
import {
    ownerListingsFilterVisibility,
    stripHiddenOwnerListingsFilters,
} from "@/features/properties/owner-listings/filter-visibility";
import {
    type OwnerListingFurnishing,
    type OwnerListingItem,
    type OwnerListingsFilterContext,
    type OwnerListingsFilters,
    type OwnerListingsSheetFilters,
    type OwnerListingTransactionType,
    RENT_COMMISSION_RANGE,
    SALE_COMMISSION_RANGE,
} from "@/features/properties/owner-listings/types";

import "simplebar-react/dist/simplebar.min.css";

type ChoicePreset = { value: string; label: string; hint?: string };

const LISTED_PRESETS: ChoicePreset[] = [
    { value: "", label: "Any time", hint: "All listing ages" },
    { value: "7", label: "Last 7 days", hint: "Fresh to the pool" },
    { value: "30", label: "Last 30 days", hint: "Still recent inventory" },
];

const COMMISSION_TYPES: { value: OwnerListingTransactionType; label: string }[] = [
    { value: "sale", label: "Sale" },
    { value: "rent", label: "Rent" },
];

const BHK_OPTIONS = [
    { value: "1", label: "1 BHK" },
    { value: "2", label: "2 BHK" },
    { value: "3", label: "3 BHK" },
    { value: "4", label: "4 BHK" },
    { value: "5", label: "5+ BHK" },
] as const;

const FURNISHING_OPTIONS: { value: OwnerListingFurnishing | ""; label: string }[] = [
    { value: "", label: "Any" },
    { value: "furnished", label: "Furnished" },
    { value: "semi", label: "Semi-furnished" },
    { value: "unfurnished", label: "Unfurnished" },
];

const EMPTY_COMMISSION_RANGE = {
    minCommissionPercent: "",
    maxCommissionPercent: "",
    minCommissionAmount: "",
    maxCommissionAmount: "",
} satisfies Partial<OwnerListingsSheetFilters>;

/** A thumb resting on its slider end means that side is unbounded (""). */
function rangeToDraft(
    [low, high]: readonly number[],
    bounds: { min: number; max: number },
    decimals: number,
): [string, string] {
    const round = (value: number) => Number(value.toFixed(decimals));
    const min = round(low ?? bounds.min);
    const max = round(high ?? bounds.max);
    return [min <= bounds.min ? "" : String(min), max >= bounds.max ? "" : String(max)];
}

function draftToRange(
    min: string,
    max: string,
    bounds: { min: number; max: number },
): [number, number] {
    const low = min ? Number(min) : bounds.min;
    const high = max ? Number(max) : bounds.max;
    return [
        Number.isFinite(low) ? Math.max(bounds.min, low) : bounds.min,
        Number.isFinite(high) ? Math.min(bounds.max, high) : bounds.max,
    ];
}

function formatPercent(value: number): string {
    return `${Number(value.toFixed(1))}%`;
}

// const DEAL_OPTIONS: {
//     key: keyof Pick<
//         OwnerListingsSheetFilters,
//         "yourAreas" | "readyToMove" | "slotsOpen" | "commissionSet"
//     >;
//     label: string;
//     description: string;
//     icon: AppIcon;
// }[] = [
//     {
//         key: "yourAreas",
//         label: "Your areas first",
//         description: "Show your service localities before others",
//         icon: MapPinned,
//     },
//     {
//         key: "readyToMove",
//         label: "Ready to move",
//         description: "Immediate possession",
//         icon: KeyRound,
//     },
//     {
//         key: "slotsOpen",
//         label: "Slots open",
//         description: "Still taking broker requests",
//         icon: DoorOpen,
//     },
//     {
//         key: "commissionSet",
//         label: "Commission set",
//         description: "Owner already shared a rate",
//         icon: BadgePercent,
//     },
// ];

const EMPTY_SHEET_FILTERS: OwnerListingsSheetFilters = {
    listedWithinDays: "",
    ...EMPTY_COMMISSION_RANGE,
    bhk: [],
    furnishing: "",
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
    icon?: AppIcon;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                `
                  flex flex-col justify-center gap-2 rounded-inner border p-3.5 text-start
                  block-full
                `,
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

function CommissionRange({
    label,
    minLabel,
    maxLabel,
    boundsLabel,
    isAny,
    children,
}: {
    label: string;
    minLabel: string;
    maxLabel: string;
    boundsLabel: string;
    isAny: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-inner border border-border-warm p-4">
            <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-ink">{label}</span>
                <span className="tabular text-sm font-semibold text-brand-text">
                    {isAny ? "Any" : `${minLabel} – ${maxLabel}`}
                </span>
            </div>
            {children}
            <div className="flex items-center justify-between gap-3">
                <span className="body-sm text-ink-muted">{boundsLabel}</span>
                <span className="body-sm text-ink-muted">Drag both ends to set min and max</span>
            </div>
        </div>
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
    icon: AppIcon;
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
    // "Looking for" drives which commission slider shows; picking it here also
    // sets the band's Sale / Rent filter on apply.
    const [draftType, setDraftType] = useState(appliedFilters.type);
    const [draftSource, setDraftSource] = useState({ open: false, appliedFilters });

    if (open && (!draftSource.open || draftSource.appliedFilters !== appliedFilters)) {
        setDraftSource({ open: true, appliedFilters });
        setDraft(extractSheetFilters(appliedFilters));
        setDraftType(appliedFilters.type);
    } else if (!open && draftSource.open) {
        setDraftSource({ open: false, appliedFilters });
    }

    const visibility = useMemo(
        () =>
            ownerListingsFilterVisibility({
                category: appliedFilters.category,
                propertyType: appliedFilters.propertyType,
            }),
        [appliedFilters.category, appliedFilters.propertyType],
    );

    const previewCount = useMemo(() => {
        const merged = stripHiddenOwnerListingsFilters({
            ...appliedFilters,
            ...draft,
            type: draftType,
        });
        return filterOwnerListings(listings, merged, filterContext).totalCount;
    }, [appliedFilters, draft, draftType, filterContext, listings]);

    const saleRange = draftToRange(
        draft.minCommissionPercent,
        draft.maxCommissionPercent,
        SALE_COMMISSION_RANGE,
    );
    const rentRange = draftToRange(
        draft.minCommissionAmount,
        draft.maxCommissionAmount,
        RENT_COMMISSION_RANGE,
    );

    const setCommissionType = (type: OwnerListingTransactionType) => {
        // A sale range means nothing on rent listings and vice versa.
        setDraftType(type);
        setDraft((prev) => ({ ...prev, ...EMPTY_COMMISSION_RANGE }));
    };

    const hasDraftFilters = useMemo(() => {
        return (
            Boolean(draft.listedWithinDays) ||
            Boolean(draft.minCommissionPercent) ||
            Boolean(draft.maxCommissionPercent) ||
            Boolean(draft.minCommissionAmount) ||
            Boolean(draft.maxCommissionAmount) ||
            draft.bhk.length > 0 ||
            Boolean(draft.furnishing) ||
            draft.readyToMove
        );
    }, [draft]);

    const updateDraft = (patch: Partial<OwnerListingsSheetFilters>) => {
        setDraft((prev) => ({ ...prev, ...patch }));
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

    const setListedPreset = (value: string) => {
        updateDraft({
            listedWithinDays: value,
            // Listed → New chip only when picking Last 7 days; leave the chip alone otherwise.
            ...(value === "7" ? { newToday: true } : {}),
        });
    };

    const handleApply = () => {
        const leavingListedSeven =
            appliedFilters.listedWithinDays === "7" && draft.listedWithinDays !== "7";

        const patch = stripHiddenOwnerListingsFilters({
            ...appliedFilters,
            listedWithinDays: draft.listedWithinDays,
            minCommissionPercent: draft.minCommissionPercent,
            maxCommissionPercent: draft.maxCommissionPercent,
            minCommissionAmount: draft.minCommissionAmount,
            maxCommissionAmount: draft.maxCommissionAmount,
            bhk: draft.bhk,
            furnishing: draft.furnishing,
            readyToMove: draft.readyToMove,
            type: draftType,
            // Sync New chip with Listed Last 7 days; do not wipe a quick-chip-only New.
            ...(draft.listedWithinDays === "7"
                ? { newToday: true }
                : leavingListedSeven
                  ? { newToday: false }
                  : {}),
            cursor: "",
        });

        onApply({
            listedWithinDays: patch.listedWithinDays,
            minCommissionPercent: patch.minCommissionPercent,
            maxCommissionPercent: patch.maxCommissionPercent,
            minCommissionAmount: patch.minCommissionAmount,
            maxCommissionAmount: patch.maxCommissionAmount,
            bhk: patch.bhk,
            furnishing: patch.furnishing,
            readyToMove: patch.readyToMove,
            type: patch.type,
            newToday: patch.newToday,
            cursor: "",
        });
        onOpenChange(false);
    };

    const handleClear = () => {
        setDraft((prev) => ({
            ...EMPTY_SHEET_FILTERS,
            newToday: prev.listedWithinDays === "7" ? false : prev.newToday,
            slotsOpen: prev.slotsOpen,
            commissionSet: prev.commissionSet,
            yourAreas: prev.yourAreas,
        }));
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
                        <DialogTitle className="font-display text-base font-medium text-ink sm:text-lg">
                            Advanced filters
                        </DialogTitle>
                        <p className="body-sm text-ink-muted">
                            Extra controls beyond the search bar — layout, timing, and commission
                        </p>
                    </div>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <DialogClose
                                    className="
                                      flex shrink-0 items-center justify-center rounded-control
                                      border border-border-warm bg-surface text-ink-muted
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
                            {(visibility.showBhk ||
                                visibility.showFurnishing ||
                                visibility.showReadyToMove) && (
                                <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                                    {visibility.showBhk ? (
                                        <FilterPanel
                                            title="BHK"
                                            subtitle="Bedroom configuration for homes"
                                        >
                                            <div className="flex flex-1 flex-wrap content-start gap-2">
                                                {BHK_OPTIONS.map((option) => {
                                                    const active = draft.bhk.includes(option.value);
                                                    return (
                                                        <ChoiceChip
                                                            key={option.value}
                                                            label={option.label}
                                                            active={active}
                                                            onClick={() => toggleBhk(option.value)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <div className="mts-auto flex items-center gap-2 text-ink-muted">
                                                <BedDouble
                                                    className="block-4 inline-4"
                                                    strokeWidth={1.75}
                                                />
                                                <span className="body-sm">
                                                    Hidden for land and plots
                                                </span>
                                            </div>
                                        </FilterPanel>
                                    ) : null}

                                    {visibility.showFurnishing ? (
                                        <FilterPanel
                                            title="Furnishing"
                                            subtitle="How finished the interior is"
                                        >
                                            <div className="flex flex-1 flex-wrap content-start gap-2">
                                                {FURNISHING_OPTIONS.map((option) => (
                                                    <ChoiceChip
                                                        key={option.label}
                                                        label={option.label}
                                                        active={draft.furnishing === option.value}
                                                        onClick={() =>
                                                            updateDraft({
                                                                furnishing: option.value,
                                                            })
                                                        }
                                                    />
                                                ))}
                                            </div>
                                            <div className="mts-auto flex items-center gap-2 text-ink-muted">
                                                <Sofa
                                                    className="block-4 inline-4"
                                                    strokeWidth={1.75}
                                                />
                                                <span className="body-sm">
                                                    Not used for land or plots
                                                </span>
                                            </div>
                                        </FilterPanel>
                                    ) : null}

                                    {visibility.showReadyToMove ? (
                                        <FilterPanel
                                            title="Move-in"
                                            subtitle="Possession that fits your client"
                                            className={
                                                visibility.showBhk && visibility.showFurnishing
                                                    ? "md:col-span-2"
                                                    : undefined
                                            }
                                        >
                                            <DealToggle
                                                label="Ready to move"
                                                description="Available for immediate possession"
                                                icon={KeyRound}
                                                active={draft.readyToMove}
                                                onCheckedChange={(checked) =>
                                                    updateDraft({ readyToMove: checked })
                                                }
                                            />
                                        </FilterPanel>
                                    ) : null}
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
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
                                    subtitle={
                                        draftType === "rent"
                                            ? "Fixed rent commission the owner has shared"
                                            : draftType === "sale"
                                              ? "Sale commission percent the owner has shared"
                                              : "Choose what you are looking for to set a range"
                                    }
                                    className="md:col-span-2"
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="body-sm text-ink-muted">Looking for</span>
                                        {COMMISSION_TYPES.map((option) => (
                                            <ChoiceChip
                                                key={option.value}
                                                label={option.label}
                                                active={draftType === option.value}
                                                onClick={() => setCommissionType(option.value)}
                                            />
                                        ))}
                                    </div>

                                    {draftType === "sale" ? (
                                        <CommissionRange
                                            label="Sale commission"
                                            minLabel={formatPercent(saleRange[0])}
                                            maxLabel={formatPercent(saleRange[1])}
                                            isAny={
                                                !draft.minCommissionPercent &&
                                                !draft.maxCommissionPercent
                                            }
                                            boundsLabel={`${formatPercent(SALE_COMMISSION_RANGE.min)} – ${formatPercent(SALE_COMMISSION_RANGE.max)}`}
                                        >
                                            <RangeSlider
                                                value={saleRange}
                                                min={SALE_COMMISSION_RANGE.min}
                                                max={SALE_COMMISSION_RANGE.max}
                                                step={SALE_COMMISSION_RANGE.step}
                                                thumbLabels={[
                                                    "Minimum sale commission",
                                                    "Maximum sale commission",
                                                ]}
                                                onValueChange={(next) => {
                                                    const [min, max] = rangeToDraft(
                                                        next,
                                                        SALE_COMMISSION_RANGE,
                                                        1,
                                                    );
                                                    updateDraft({
                                                        minCommissionPercent: min,
                                                        maxCommissionPercent: max,
                                                    });
                                                }}
                                            />
                                        </CommissionRange>
                                    ) : draftType === "rent" ? (
                                        <CommissionRange
                                            label="Rent commission"
                                            minLabel={formatInr(rentRange[0])}
                                            maxLabel={
                                                rentRange[1] >= RENT_COMMISSION_RANGE.max
                                                    ? `${formatInr(RENT_COMMISSION_RANGE.max)}+`
                                                    : formatInr(rentRange[1])
                                            }
                                            isAny={
                                                !draft.minCommissionAmount &&
                                                !draft.maxCommissionAmount
                                            }
                                            boundsLabel={`${formatInr(RENT_COMMISSION_RANGE.min)} – ${formatInr(RENT_COMMISSION_RANGE.max)}+`}
                                        >
                                            <RangeSlider
                                                value={rentRange}
                                                min={RENT_COMMISSION_RANGE.min}
                                                max={RENT_COMMISSION_RANGE.max}
                                                step={RENT_COMMISSION_RANGE.step}
                                                thumbLabels={[
                                                    "Minimum rent commission",
                                                    "Maximum rent commission",
                                                ]}
                                                onValueChange={(next) => {
                                                    const [min, max] = rangeToDraft(
                                                        next,
                                                        RENT_COMMISSION_RANGE,
                                                        0,
                                                    );
                                                    updateDraft({
                                                        minCommissionAmount: min,
                                                        maxCommissionAmount: max,
                                                    });
                                                }}
                                            />
                                        </CommissionRange>
                                    ) : (
                                        <div className="flex items-center gap-2 text-ink-muted">
                                            <BadgePercent
                                                className="block-4 inline-4"
                                                strokeWidth={1.75}
                                                aria-hidden
                                            />
                                            <span className="body-sm">
                                                Sale shows a percent range. Rent shows a fixed
                                                amount range.
                                            </span>
                                        </div>
                                    )}
                                </FilterPanel>
                            </div>
                        </div>
                    </SimpleBar>
                </div>

                <div className="shrink-0 border-bs border-border-warm bg-surface px-5 py-4 sm:px-7">
                    <AppModalFooter
                        secondaryLabel="Reset filter"
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
