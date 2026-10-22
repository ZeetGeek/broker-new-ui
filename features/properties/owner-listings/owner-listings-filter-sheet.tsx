"use client";

import { useMemo, useState } from "react";

import SimpleBar from "simplebar-react";

import { formatInr } from "@/lib/format/inr";
import { extractSheetFilters } from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { XIcon } from "@/components/shared/icons";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Dialog,
    DialogClose,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { RangeSlider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
    FACING_OPTIONS,
    PROPERTY_AGE_OPTIONS,
    PROPERTY_CONDITION_OPTIONS,
    SUITABLE_FOR_OPTIONS,
} from "@/constants/property";
import { commissionRangeForType } from "@/features/properties/owner-listings/filter-owner-listings";
import {
    ownerListingsFilterVisibility,
    stripHiddenOwnerListingsFilters,
} from "@/features/properties/owner-listings/filter-visibility";
import {
    type OwnerListingFurnishing,
    type OwnerListingsFilters,
    type OwnerListingsSheetFilters,
    RENT_COMMISSION_RANGE,
    SALE_COMMISSION_RANGE,
} from "@/features/properties/owner-listings/types";

import "simplebar-react/dist/simplebar.min.css";

const LISTED_OPTIONS = [
    { value: "", label: "Any time" },
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
] as const;

const BHK_OPTIONS = [
    { value: "1", label: "1 BHK" },
    { value: "2", label: "2 BHK" },
    { value: "3", label: "3 BHK" },
    { value: "4", label: "4 BHK" },
    { value: "5", label: "5+ BHK" },
] as const;

const BATHROOM_OPTIONS = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5+" },
] as const;

const BALCONY_OPTIONS = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4+" },
] as const;

const PARKING_OPTIONS = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4+" },
] as const;

const FLOOR_OPTIONS = [
    { value: "ground", label: "Ground" },
    { value: "low", label: "1–5" },
    { value: "mid", label: "6–15" },
    { value: "high", label: "16+" },
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

const EMPTY_SHEET_FILTERS: OwnerListingsSheetFilters = {
    listedWithinDays: "",
    ...EMPTY_COMMISSION_RANGE,
    bhk: [],
    bathrooms: [],
    balconies: [],
    parking: [],
    floors: [],
    facing: [],
    propertyConditions: [],
    propertyAges: [],
    suitableFor: [],
    furnishing: "",
    yourAreas: false,
    newToday: false,
    slotsOpen: false,
    commissionSet: false,
    readyToMove: false,
};

const SELECT_TRANSITION =
    "transition-[background-color,border-color,color,box-shadow] duration-160";

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

function toggleListValue(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
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
                  inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm
                  font-semibold whitespace-nowrap
                `,
                SELECT_TRANSITION,
                active
                    ? "border-brand bg-brand-soft text-brand-text"
                    : `
                      border-border-warm bg-transparent text-ink
                      hover:border-brand/40
                    `,
            )}
        >
            {label}
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
        <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-ink">{label}</span>
                <span className="tabular text-sm font-semibold text-brand-text">
                    {isAny ? "Any" : `${minLabel} – ${maxLabel}`}
                </span>
            </div>
            {children}
            <p className="body-sm text-ink-muted">{boundsLabel}</p>
        </div>
    );
}

function FilterAccordionTrigger({ title, summary }: { title: string; summary?: string }) {
    return (
        <AccordionTrigger
            className="
              gap-3 rounded-none px-0 py-5 text-ink hover:no-underline
              focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
              focus-visible:ring-offset-surface
              data-panel-open:text-ink
            "
        >
            <span className="flex flex-1 flex-col items-start gap-0.5 min-inline-0">
                <span className="font-display text-base font-medium">{title}</span>
                {summary ? (
                    <span className="body-sm truncate font-normal text-ink-muted">{summary}</span>
                ) : null}
            </span>
        </AccordionTrigger>
    );
}

function ChipGroup({
    label,
    options,
    selected,
    onToggle,
    single = false,
    value,
    onSelect,
}: {
    label: string;
    options: readonly { value: string; label: string }[];
    selected?: string[];
    onToggle?: (value: string) => void;
    /** Single-select mode (furnishing / listed). */
    single?: boolean;
    value?: string;
    onSelect?: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <span className="body-sm font-medium text-ink">{label}</span>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const active = single
                        ? value === option.value
                        : Boolean(selected?.includes(option.value));
                    return (
                        <ChoiceChip
                            key={option.value || option.label}
                            label={option.label}
                            active={active}
                            onClick={() =>
                                single ? onSelect?.(option.value) : onToggle?.(option.value)
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}

export type OwnerListingsFilterSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appliedFilters: OwnerListingsFilters;
    onApply: (patch: Partial<OwnerListingsFilters>) => void;
};

export function OwnerListingsFilterSheet({
    open,
    onOpenChange,
    appliedFilters,
    onApply,
}: OwnerListingsFilterSheetProps) {
    const [draft, setDraft] = useState(() => extractSheetFilters(appliedFilters));
    const [draftSource, setDraftSource] = useState({ open: false, appliedFilters });
    const lookingFor = appliedFilters.type;
    const showSaleCommission = lookingFor !== "rent";
    const showRentCommission = lookingFor !== "sale";

    if (open && (!draftSource.open || draftSource.appliedFilters !== appliedFilters)) {
        setDraftSource({ open: true, appliedFilters });
        const next = extractSheetFilters(appliedFilters);
        // Quick-chip Ready to move → preselect condition chip.
        if (next.readyToMove && !next.propertyConditions.includes("ready_to_move")) {
            next.propertyConditions = [...next.propertyConditions, "ready_to_move"];
        }
        setDraft(next);
    } else if (!open && draftSource.open) {
        setDraftSource({ open: false, appliedFilters });
    }

    const visibility = useMemo(
        () =>
            ownerListingsFilterVisibility({
                category: appliedFilters.category,
                propertyType: appliedFilters.propertyType,
                propertyConditions: draft.propertyConditions,
            }),
        [appliedFilters.category, appliedFilters.propertyType, draft.propertyConditions],
    );

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

    const hasDraftFilters = useMemo(() => {
        return (
            Boolean(draft.listedWithinDays) ||
            Boolean(draft.minCommissionPercent) ||
            Boolean(draft.maxCommissionPercent) ||
            Boolean(draft.minCommissionAmount) ||
            Boolean(draft.maxCommissionAmount) ||
            draft.bhk.length > 0 ||
            draft.bathrooms.length > 0 ||
            draft.balconies.length > 0 ||
            draft.parking.length > 0 ||
            draft.floors.length > 0 ||
            draft.facing.length > 0 ||
            draft.propertyConditions.length > 0 ||
            draft.propertyAges.length > 0 ||
            draft.suitableFor.length > 0 ||
            Boolean(draft.furnishing) ||
            draft.readyToMove
        );
    }, [draft]);

    const labelSummary = (
        values: string[],
        options: readonly { value: string; label: string }[],
    ) => {
        if (values.length === 0) return undefined;
        return values
            .map((value) => options.find((option) => option.value === value)?.label ?? value)
            .join(", ");
    };

    const showLayoutSection =
        visibility.showBhk ||
        visibility.showBathrooms ||
        visibility.showBalconies ||
        visibility.showParking ||
        visibility.showFloors;

    const showMoreSection =
        visibility.showFacing ||
        visibility.showFurnishing ||
        visibility.showPropertyCondition ||
        visibility.showPropertyAge ||
        visibility.showSuitableFor;

    const layoutSummary = useMemo(() => {
        const parts: string[] = [];
        const bhk = labelSummary(draft.bhk, BHK_OPTIONS);
        const baths = labelSummary(draft.bathrooms, BATHROOM_OPTIONS);
        const floors = labelSummary(draft.floors, FLOOR_OPTIONS);
        if (bhk) parts.push(bhk);
        if (baths) parts.push(`${baths} bath`);
        if (draft.balconies.length > 0) parts.push("Balcony");
        if (draft.parking.length > 0) parts.push("Parking");
        if (floors) parts.push(floors);
        return parts.length > 0 ? parts.join(" · ") : undefined;
    }, [draft.bhk, draft.bathrooms, draft.balconies.length, draft.floors, draft.parking.length]);

    const moreSummary = useMemo(() => {
        const parts: string[] = [];
        if (draft.furnishing) {
            const label = FURNISHING_OPTIONS.find(
                (option) => option.value === draft.furnishing,
            )?.label;
            if (label) parts.push(label);
        }
        const condition = labelSummary(draft.propertyConditions, PROPERTY_CONDITION_OPTIONS);
        if (condition) parts.push(condition);
        if (draft.facing.length > 0) parts.push("Facing");
        if (draft.suitableFor.length > 0) parts.push("Use");
        return parts.length > 0 ? parts.join(" · ") : undefined;
    }, [draft.facing.length, draft.furnishing, draft.propertyConditions, draft.suitableFor.length]);

    const dealSummary = useMemo(() => {
        const parts: string[] = [];
        if (draft.listedWithinDays) {
            const listed = LISTED_OPTIONS.find(
                (option) => option.value === draft.listedWithinDays,
            )?.label;
            if (listed) parts.push(listed);
        }
        if (showSaleCommission && (draft.minCommissionPercent || draft.maxCommissionPercent)) {
            parts.push(`${formatPercent(saleRange[0])}–${formatPercent(saleRange[1])} sale`);
        }
        if (showRentCommission && (draft.minCommissionAmount || draft.maxCommissionAmount)) {
            const maxLabel =
                rentRange[1] >= RENT_COMMISSION_RANGE.max
                    ? `${formatInr(RENT_COMMISSION_RANGE.max)}+`
                    : formatInr(rentRange[1]);
            parts.push(`${formatInr(rentRange[0])}–${maxLabel} rent`);
        }
        return parts.length > 0 ? parts.join(" · ") : undefined;
    }, [
        draft.listedWithinDays,
        draft.maxCommissionAmount,
        draft.maxCommissionPercent,
        draft.minCommissionAmount,
        draft.minCommissionPercent,
        rentRange,
        saleRange,
        showRentCommission,
        showSaleCommission,
    ]);

    const defaultOpenSections = useMemo(() => {
        const openKeys: string[] = [];
        const layoutActive =
            draft.bhk.length > 0 ||
            draft.bathrooms.length > 0 ||
            draft.balconies.length > 0 ||
            draft.parking.length > 0 ||
            draft.floors.length > 0;
        const moreActive =
            Boolean(draft.furnishing) ||
            draft.propertyConditions.length > 0 ||
            draft.propertyAges.length > 0 ||
            draft.facing.length > 0 ||
            draft.suitableFor.length > 0;
        const dealActive =
            Boolean(draft.listedWithinDays) ||
            Boolean(draft.minCommissionPercent) ||
            Boolean(draft.maxCommissionPercent) ||
            Boolean(draft.minCommissionAmount) ||
            Boolean(draft.maxCommissionAmount);

        if (showLayoutSection && layoutActive) openKeys.push("layout");
        if (showMoreSection && moreActive) openKeys.push("more");
        if (dealActive) openKeys.push("deal");
        if (openKeys.length > 0) return openKeys;
        if (showLayoutSection) return ["layout"];
        if (showMoreSection) return ["more"];
        return ["deal"];
    }, [draft, showLayoutSection, showMoreSection]);

    const updateDraft = (patch: Partial<OwnerListingsSheetFilters>) => {
        setDraft((prev) => ({ ...prev, ...patch }));
    };

    const setListedPreset = (value: string) => {
        updateDraft({
            listedWithinDays: value,
            ...(value === "7" ? { newToday: true } : {}),
        });
    };

    const toggleCondition = (value: string) => {
        setDraft((prev) => {
            const propertyConditions = toggleListValue(prev.propertyConditions, value);
            return {
                ...prev,
                propertyConditions,
                readyToMove: propertyConditions.includes("ready_to_move"),
                // Age does not apply under construction / new launch.
                propertyAges:
                    propertyConditions.includes("under_construction") ||
                    propertyConditions.includes("new_launch")
                        ? []
                        : prev.propertyAges,
            };
        });
    };

    const handleApply = () => {
        const leavingListedSeven =
            appliedFilters.listedWithinDays === "7" && draft.listedWithinDays !== "7";
        const readyToMove = draft.propertyConditions.includes("ready_to_move") || draft.readyToMove;

        const patch = stripHiddenOwnerListingsFilters({
            ...appliedFilters,
            listedWithinDays: draft.listedWithinDays,
            minCommissionPercent: draft.minCommissionPercent,
            maxCommissionPercent: draft.maxCommissionPercent,
            minCommissionAmount: draft.minCommissionAmount,
            maxCommissionAmount: draft.maxCommissionAmount,
            ...commissionRangeForType(lookingFor),
            bhk: draft.bhk,
            bathrooms: draft.bathrooms,
            balconies: draft.balconies,
            parking: draft.parking,
            floors: draft.floors,
            facing: draft.facing,
            propertyConditions: draft.propertyConditions,
            propertyAges: draft.propertyAges,
            suitableFor: draft.suitableFor,
            furnishing: draft.furnishing,
            readyToMove,
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
            bathrooms: patch.bathrooms,
            balconies: patch.balconies,
            parking: patch.parking,
            floors: patch.floors,
            facing: patch.facing,
            propertyConditions: patch.propertyConditions,
            propertyAges: patch.propertyAges,
            suitableFor: patch.suitableFor,
            furnishing: patch.furnishing,
            readyToMove: patch.readyToMove,
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
                      block-[min(90dvh,calc(100%-1.5rem))]
                      inline-[min(36rem,calc(100vw-1.5rem))]
                      max-inline-[min(36rem,calc(100vw-1.5rem))]
                      sm:inline-[min(36rem,calc(100vw-3rem))]
                      sm:max-inline-[min(36rem,calc(100vw-3rem))]
                    `,
                )}
            >
                <DialogHeader
                    className="
                      relative shrink-0 flex-row items-center justify-center border-be
                      border-border-warm bg-surface px-5 py-4 text-center
                      sm:px-6 sm:py-5
                    "
                >
                    <DialogTitle className="font-display text-base font-medium text-ink sm:text-lg">
                        Filters
                    </DialogTitle>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <DialogClose
                                    className="
                                      absolute end-4 top-1/2 flex shrink-0 -translate-y-1/2
                                      items-center justify-center rounded-control border
                                      border-border-warm bg-surface text-ink-muted
                                      transition-[background-color,border-color,color,transform]
                                      duration-160 block-10 inline-10
                                      hover:border-brand/40 hover:bg-brand-soft
                                      hover:text-brand-text
                                      focus-visible:ring-2 focus-visible:ring-brand
                                      focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                                      active:scale-[0.94]
                                      sm:end-5
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
                        <div className="px-5 sm:px-6">
                            <Accordion
                                key={open ? "open" : "closed"}
                                multiple
                                defaultValue={defaultOpenSections}
                                className="
                                  rounded-none border-0
                                  [&_[data-slot=accordion-content]]:px-0
                                "
                            >
                                {showLayoutSection ? (
                                    <AccordionItem
                                        value="layout"
                                        className="border-be border-border-warm data-open:bg-transparent"
                                    >
                                        <FilterAccordionTrigger
                                            title="Rooms & layout"
                                            summary={layoutSummary}
                                        />
                                        <AccordionContent className="px-0">
                                            <div className="flex flex-col gap-4 pbe-5">
                                                {visibility.showBhk ? (
                                                    <ChipGroup
                                                        label="BHK"
                                                        options={BHK_OPTIONS}
                                                        selected={draft.bhk}
                                                        onToggle={(value) =>
                                                            updateDraft({
                                                                bhk: toggleListValue(
                                                                    draft.bhk,
                                                                    value,
                                                                ),
                                                            })
                                                        }
                                                    />
                                                ) : null}
                                                {visibility.showBathrooms ? (
                                                    <ChipGroup
                                                        label="Bathrooms"
                                                        options={BATHROOM_OPTIONS}
                                                        selected={draft.bathrooms}
                                                        onToggle={(value) =>
                                                            updateDraft({
                                                                bathrooms: toggleListValue(
                                                                    draft.bathrooms,
                                                                    value,
                                                                ),
                                                            })
                                                        }
                                                    />
                                                ) : null}
                                                {visibility.showBalconies ? (
                                                    <ChipGroup
                                                        label="Balconies"
                                                        options={BALCONY_OPTIONS}
                                                        selected={draft.balconies}
                                                        onToggle={(value) =>
                                                            updateDraft({
                                                                balconies: toggleListValue(
                                                                    draft.balconies,
                                                                    value,
                                                                ),
                                                            })
                                                        }
                                                    />
                                                ) : null}
                                                {visibility.showParking ? (
                                                    <ChipGroup
                                                        label="Parking"
                                                        options={PARKING_OPTIONS}
                                                        selected={draft.parking}
                                                        onToggle={(value) =>
                                                            updateDraft({
                                                                parking: toggleListValue(
                                                                    draft.parking,
                                                                    value,
                                                                ),
                                                            })
                                                        }
                                                    />
                                                ) : null}
                                                {visibility.showFloors ? (
                                                    <ChipGroup
                                                        label="Floor"
                                                        options={FLOOR_OPTIONS}
                                                        selected={draft.floors}
                                                        onToggle={(value) =>
                                                            updateDraft({
                                                                floors: toggleListValue(
                                                                    draft.floors,
                                                                    value,
                                                                ),
                                                            })
                                                        }
                                                    />
                                                ) : null}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ) : null}

                                {showMoreSection ? (
                                    <AccordionItem
                                        value="more"
                                        className="border-be border-border-warm data-open:bg-transparent"
                                    >
                                        <FilterAccordionTrigger
                                            title="More filters"
                                            summary={moreSummary}
                                        />
                                        <AccordionContent className="px-0">
                                            <div className="flex flex-col gap-4 pbe-5">
                                                {visibility.showFurnishing ? (
                                                    <ChipGroup
                                                        label="Furnishing"
                                                        options={FURNISHING_OPTIONS}
                                                        single
                                                        value={draft.furnishing}
                                                        onSelect={(value) =>
                                                            updateDraft({
                                                                furnishing: value as
                                                                    OwnerListingFurnishing | "",
                                                            })
                                                        }
                                                    />
                                                ) : null}
                                                {visibility.showPropertyCondition ? (
                                                    <ChipGroup
                                                        label="Condition"
                                                        options={PROPERTY_CONDITION_OPTIONS}
                                                        selected={draft.propertyConditions}
                                                        onToggle={toggleCondition}
                                                    />
                                                ) : null}
                                                {visibility.showPropertyAge ? (
                                                    <ChipGroup
                                                        label="Age"
                                                        options={PROPERTY_AGE_OPTIONS}
                                                        selected={draft.propertyAges}
                                                        onToggle={(value) =>
                                                            updateDraft({
                                                                propertyAges: toggleListValue(
                                                                    draft.propertyAges,
                                                                    value,
                                                                ),
                                                            })
                                                        }
                                                    />
                                                ) : null}
                                                {visibility.showFacing ? (
                                                    <ChipGroup
                                                        label="Facing"
                                                        options={FACING_OPTIONS}
                                                        selected={draft.facing}
                                                        onToggle={(value) =>
                                                            updateDraft({
                                                                facing: toggleListValue(
                                                                    draft.facing,
                                                                    value,
                                                                ),
                                                            })
                                                        }
                                                    />
                                                ) : null}
                                                {visibility.showSuitableFor ? (
                                                    <ChipGroup
                                                        label="Suitable for"
                                                        options={SUITABLE_FOR_OPTIONS}
                                                        selected={draft.suitableFor}
                                                        onToggle={(value) =>
                                                            updateDraft({
                                                                suitableFor: toggleListValue(
                                                                    draft.suitableFor,
                                                                    value,
                                                                ),
                                                            })
                                                        }
                                                    />
                                                ) : null}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ) : null}

                                <AccordionItem
                                    value="deal"
                                    className="border-border-warm data-open:bg-transparent"
                                >
                                    <FilterAccordionTrigger
                                        title="Listed & commission"
                                        summary={dealSummary}
                                    />
                                    <AccordionContent className="px-0">
                                        <div className="flex flex-col gap-5 pbe-5">
                                            <ChipGroup
                                                label="Listed"
                                                options={LISTED_OPTIONS}
                                                single
                                                value={draft.listedWithinDays}
                                                onSelect={setListedPreset}
                                            />
                                            {showSaleCommission ? (
                                                <CommissionRange
                                                    label="Sale commission (%)"
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
                                            ) : null}
                                            {showRentCommission ? (
                                                <CommissionRange
                                                    label="Rent commission (fixed ₹)"
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
                                            ) : null}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </SimpleBar>
                </div>

                <div className="shrink-0 border-bs border-border-warm bg-surface px-5 py-4 sm:px-6">
                    <AppModalFooter
                        className="justify-between"
                        secondaryLabel="Clear all"
                        secondaryDisabled={!hasDraftFilters}
                        onSecondary={handleClear}
                        primaryLabel="Show properties"
                        onPrimary={handleApply}
                    />
                </div>
            </DialogPopup>
        </Dialog>
    );
}
