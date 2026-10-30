"use client";

import { useCallback, useMemo, useState } from "react";

import { formatMoney } from "@/lib/format/money";
import { extractSheetFilters } from "@/lib/format/owner-listings-labels";
import {
    EMPTY_PROPERTY_CRITERIA,
    normalizePropertyCriteria,
    propertyCriteriaCount,
    type PropertyListCriteria,
} from "@/lib/properties/list-criteria";
import { cn } from "@/lib/utils";
import { useMarketCurrency } from "@/hooks/use-market";

import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { AppModalHeader } from "@/components/shared/app-modal-header";
import {
    type AppIcon,
    Armchair,
    Bath,
    Bed,
    Briefcase,
    Building2,
    CalendarDays,
    Car,
    Check,
    Clock,
    Compass,
    Dumbbell,
    Fence,
    Home,
    Hospital,
    KeyRound,
    Landmark,
    Minus,
    Plus,
    School,
    Scissors,
    ShoppingBag,
    Sofa,
    Store,
    Utensils,
    Warehouse,
} from "@/components/shared/icons";
import { PropertyFilterFields } from "@/components/shared/property-filter-fields";
import { RangeValuePill } from "@/components/shared/range-value-pill";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogPopup } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RangeSlider } from "@/components/ui/slider";

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
    rentCommissionRange,
    SALE_COMMISSION_RANGE,
} from "@/features/properties/owner-listings/types";

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
    icon: Icon,
    tile = false,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    icon?: AppIcon;
    tile?: boolean;
}) {
    return (
        <Button
            type="button"
            variant="outline"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                `
                  relative gap-2 rounded-full px-4 py-3 text-sm font-normal shadow-none block-auto
                  min-block-11
                `,
                SELECT_TRANSITION,
                active
                    ? `
                      border-brand bg-brand-soft font-medium text-brand-text ring-1 ring-brand
                      hover:bg-brand-soft hover:text-brand-text
                    `
                    : `
                      border-border-warm bg-surface text-ink
                      hover:border-ink/40 hover:bg-surface-muted hover:text-ink
                    `,
                tile &&
                    `
                      flex-1 flex-col items-start justify-between gap-4 rounded-inner p-4 text-start
                      whitespace-normal inline-full min-block-24
                    `,
            )}
        >
            {Icon ? (
                <Icon
                    className={tile ? "block-6 inline-6" : "block-5 inline-5"}
                    style={{ width: tile ? 24 : 20, height: tile ? 24 : 20 }}
                    strokeWidth={1.6}
                    aria-hidden
                />
            ) : null}
            {label}
            {tile && active ? (
                <Check
                    className="absolute inset-e-2 inset-bs-2 block-3.5 inline-3.5"
                    style={{ width: 14, height: 14 }}
                    aria-hidden
                />
            ) : null}
        </Button>
    );
}

function CountFilter({
    label,
    icon: Icon,
    options,
    selected,
    onChange,
}: {
    label: string;
    icon: AppIcon;
    options: readonly { value: string; label: string }[];
    selected: string[];
    onChange: (values: string[]) => void;
}) {
    const index = options.findIndex((option) => selected.includes(option.value));
    const current =
        selected.length > 1
            ? "Multiple"
            : index < 0
              ? "Any"
              : options[index].label.replace(" BHK", "");
    const step = (direction: -1 | 1) => {
        const next = index + direction;
        onChange(next < 0 ? [] : [options[Math.min(next, options.length - 1)].value]);
    };

    return (
        <div role="group" aria-label={label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2.5 text-sm font-medium text-ink min-inline-0">
                <Icon className="shrink-0 block-5 inline-5" strokeWidth={1.5} aria-hidden />
                <span>{label}</span>
            </span>
            <div className="flex shrink-0 items-center gap-1">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Decrease ${label.toLowerCase()}`}
                    disabled={selected.length === 0}
                    onClick={() => step(-1)}
                    className="
                      rounded-full border-border-warm bg-surface shadow-none block-11 inline-11
                      hover:bg-surface-muted
                    "
                >
                    <Minus aria-hidden />
                </Button>
                <output
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label={`${label}: ${
                        selected.length > 1
                            ? options
                                  .filter((option) => selected.includes(option.value))
                                  .map((option) => option.label)
                                  .join(", ")
                            : current
                    }`}
                    className="text-center text-sm text-ink tabular-nums inline-14 sm:inline-16"
                >
                    {current}
                </output>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Increase ${label.toLowerCase()}`}
                    disabled={index === options.length - 1 && selected.length === 1}
                    onClick={() => step(1)}
                    className="
                      rounded-full border-border-warm bg-surface shadow-none block-11 inline-11
                      hover:bg-surface-muted
                    "
                >
                    <Plus aria-hidden />
                </Button>
            </div>
        </div>
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
        <div className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink">{label}</span>
                <span className="tabular text-sm font-semibold text-brand-text">
                    {isAny ? "Any" : `${minLabel} – ${maxLabel}`}
                </span>
            </div>
            <div className="px-1 py-2">{children}</div>
            <dl className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                    <dt className="text-xs text-ink/65">Minimum</dt>
                    <dd className="flex">
                        <RangeValuePill value={minLabel} />
                    </dd>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <dt className="text-xs text-ink/65">Maximum</dt>
                    <dd className="flex">
                        <RangeValuePill value={maxLabel} />
                    </dd>
                </div>
            </dl>
            <span className="sr-only">Available range: {boundsLabel}</span>
        </div>
    );
}

function FilterAccordionTrigger({
    title,
    summary,
    description,
}: {
    title: string;
    summary?: string;
    description?: string;
}) {
    return (
        <AccordionTrigger
            className="
              items-center gap-3 rounded-none border-0 px-0 py-5 text-ink
              hover:no-underline
              focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
              focus-visible:ring-offset-surface
              data-panel-open:text-ink
            "
        >
            <span className="flex flex-1 flex-col items-start gap-1.5 min-inline-0">
                <span className="font-display text-lg font-semibold tracking-tight">{title}</span>
                {description ? (
                    <span
                        className="
                          hidden text-xs/relaxed font-normal text-ink/65
                          group-aria-expanded/accordion-trigger:block
                        "
                    >
                        {description}
                    </span>
                ) : null}
                {summary ? (
                    <span
                        className="
                          body-sm font-normal text-ink/65
                          group-aria-expanded/accordion-trigger:hidden
                        "
                    >
                        {summary}
                    </span>
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
    const isFurnishing = label === "Furnishing";
    const groupIcons: Record<string, AppIcon> = {
        Floor: Building2,
        Facing: Compass,
        Listed: CalendarDays,
        Age: Clock,
    };
    const furnishingIcons: Record<string, AppIcon> = {
        "": Home,
        furnished: Sofa,
        semi: Armchair,
        unfurnished: Home,
    };
    const Icon = groupIcons[label];
    const suitableForIcons: Record<string, AppIcon> = {
        office: Briefcase,
        retail: ShoppingBag,
        clinic: Hospital,
        restaurant: Utensils,
        showroom: Store,
        warehouse: Warehouse,
        salon: Scissors,
        gym: Dumbbell,
        bank: Landmark,
        school: School,
        hostel: Bed,
    };
    return (
        <div role="group" aria-label={label} className="flex flex-col gap-3 border-0">
            <span className="flex items-center gap-2.5 border-0 text-sm font-medium text-ink">
                {label === "BHK"
                    ? "Bedrooms (BHK)"
                    : label === "Age"
                      ? "Property age"
                      : label === "Listed"
                        ? "Listed within"
                        : label}
            </span>
            <div
                className={cn(
                    "flex flex-wrap gap-2 border-0",
                    isFurnishing && "grid grid-cols-2 sm:grid-cols-4",
                )}
            >
                {options.map((option) => {
                    const active = single
                        ? value === option.value
                        : Boolean(selected?.includes(option.value));
                    return (
                        <ChoiceChip
                            key={option.value || option.label}
                            label={
                                label === "BHK" ? option.label.replace(" BHK", "") : option.label
                            }
                            active={active}
                            tile={isFurnishing}
                            icon={
                                isFurnishing
                                    ? furnishingIcons[option.value]
                                    : label === "Suitable for"
                                      ? suitableForIcons[option.value]
                                      : label === "Condition"
                                        ? option.value === "ready_to_move"
                                            ? KeyRound
                                            : Building2
                                        : Icon
                            }
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
    onApply: (
        patch: Partial<OwnerListingsFilters>,
        discoveryFilters?: PropertyListCriteria,
    ) => void;
    showDiscoveryFilters?: boolean;
    discoveryFilters?: Partial<PropertyListCriteria>;
    discoveryDescription?: string;
};

export function OwnerListingsFilterSheet({
    open,
    onOpenChange,
    appliedFilters,
    onApply,
    showDiscoveryFilters = false,
    discoveryFilters,
    discoveryDescription = "Narrow these deals by location, budget and property type.",
}: OwnerListingsFilterSheetProps) {
    const [draft, setDraft] = useState(() => extractSheetFilters(appliedFilters));
    const [draftDiscovery, setDraftDiscovery] = useState(() =>
        normalizePropertyCriteria(discoveryFilters),
    );
    const [hasContentBelow, setHasContentBelow] = useState(false);
    const scrollRef = useCallback((node: HTMLDivElement | null) => {
        if (!node) return;

        const updateScrollState = () => {
            setHasContentBelow(node.scrollHeight - node.clientHeight - node.scrollTop > 1);
        };
        const observer = new ResizeObserver(updateScrollState);
        observer.observe(node);
        if (node.firstElementChild) observer.observe(node.firstElementChild);
        node.addEventListener("scroll", updateScrollState, { passive: true });
        updateScrollState();

        return () => {
            observer.disconnect();
            node.removeEventListener("scroll", updateScrollState);
        };
    }, []);
    const [draftSource, setDraftSource] = useState({ open: false, appliedFilters });
    const currency = useMarketCurrency();
    const lookingFor = showDiscoveryFilters ? draftDiscovery.type : appliedFilters.type;
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
        setDraftDiscovery(normalizePropertyCriteria(discoveryFilters));
    } else if (!open && draftSource.open) {
        setDraftSource({ open: false, appliedFilters });
    }

    const visibility = useMemo(
        () =>
            ownerListingsFilterVisibility({
                category: showDiscoveryFilters ? draftDiscovery.category : appliedFilters.category,
                propertyType: showDiscoveryFilters
                    ? draftDiscovery.propertyType
                    : appliedFilters.propertyType,
                propertyConditions: draft.propertyConditions,
            }),
        [
            appliedFilters.category,
            appliedFilters.propertyType,
            draft.propertyConditions,
            draftDiscovery.category,
            draftDiscovery.propertyType,
            showDiscoveryFilters,
        ],
    );

    const rentCommissionBounds = useMemo(() => rentCommissionRange(currency), [currency]);
    const saleRange = draftToRange(
        draft.minCommissionPercent,
        draft.maxCommissionPercent,
        SALE_COMMISSION_RANGE,
    );
    const rentRange = draftToRange(
        draft.minCommissionAmount,
        draft.maxCommissionAmount,
        rentCommissionBounds,
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
            draft.readyToMove ||
            (showDiscoveryFilters && propertyCriteriaCount(draftDiscovery) > 0)
        );
    }, [draft, draftDiscovery, showDiscoveryFilters]);

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
                rentRange[1] >= rentCommissionBounds.max
                    ? `${formatMoney(rentCommissionBounds.max)}+`
                    : formatMoney(rentRange[1]);
            parts.push(`${formatMoney(rentRange[0])}–${maxLabel} rent`);
        }
        return parts.length > 0 ? parts.join(" · ") : undefined;
    }, [
        draft.listedWithinDays,
        draft.maxCommissionAmount,
        draft.maxCommissionPercent,
        draft.minCommissionAmount,
        draft.minCommissionPercent,
        rentCommissionBounds,
        rentRange,
        saleRange,
        showRentCommission,
        showSaleCommission,
    ]);

    const defaultOpenSections = [
        ...(showDiscoveryFilters ? ["discovery", "discovery-type"] : []),
        ...(showLayoutSection ? ["layout"] : []),
        ...(showMoreSection ? ["more"] : []),
        "deal",
    ];

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

        const normalizedDiscovery = normalizePropertyCriteria(draftDiscovery);
        const patch = stripHiddenOwnerListingsFilters({
            ...appliedFilters,
            ...(showDiscoveryFilters
                ? {
                      type: normalizedDiscovery.type,
                      min: normalizedDiscovery.min,
                      max: normalizedDiscovery.max,
                      minAreaSqft: normalizedDiscovery.minAreaSqft,
                      maxAreaSqft: normalizedDiscovery.maxAreaSqft,
                      category: normalizedDiscovery.category,
                      propertyType: normalizedDiscovery.propertyType,
                  }
                : {}),
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

        onApply(
            {
                ...(showDiscoveryFilters
                    ? {
                          type: patch.type,
                          min: patch.min,
                          max: patch.max,
                          minAreaSqft: patch.minAreaSqft,
                          maxAreaSqft: patch.maxAreaSqft,
                          category: patch.category,
                          propertyType: patch.propertyType,
                      }
                    : {}),
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
            },
            showDiscoveryFilters ? normalizedDiscovery : undefined,
        );
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
        if (showDiscoveryFilters) setDraftDiscovery({ ...EMPTY_PROPERTY_CRITERIA });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup
                showCloseButton={false}
                className={cn(
                    `
                      flex flex-col gap-0 overflow-hidden border-border-warm bg-surface p-0
                      block-[min(90dvh,calc(100%-1.5rem))] inline-[min(40rem,calc(100vw-1rem))]
                      max-inline-[min(40rem,calc(100vw-1rem))]
                      sm:inline-[min(40rem,calc(100vw-3rem))]
                      sm:max-inline-[min(40rem,calc(100vw-3rem))]
                    `,
                )}
            >
                <AppModalHeader title="Filters" className="px-5 sm:px-8 sm:py-5" />

                <ScrollArea
                    viewportRef={scrollRef}
                    className="
                      flex-1 bg-surface min-block-0
                      **:data-[slot=scroll-area-scrollbar]:inset-e-1.5
                      **:data-[slot=scroll-area-viewport]:overscroll-contain
                    "
                >
                    <div className="px-5 pbe-3 sm:px-8">
                        <Accordion
                            key={open ? "open" : "closed"}
                            multiple
                            defaultValue={defaultOpenSections}
                            className="
                              overflow-visible rounded-none border-0
                              **:data-[slot=accordion-content]:-mx-1
                              **:data-[slot=accordion-content]:border-0
                              **:data-[slot=accordion-content]:px-1
                              [&_[data-slot=accordion-content]>div]:border-0
                            "
                        >
                            {showDiscoveryFilters ? (
                                <AccordionItem
                                    value="discovery"
                                    className="
                                      border-0 border-border-warm
                                      not-last:border-be
                                      data-open:bg-transparent
                                    "
                                >
                                    <FilterAccordionTrigger
                                        title="Property search"
                                        description={discoveryDescription}
                                    />
                                    <AccordionContent className="px-0 pbe-0">
                                        <div className="border-0 pbe-6">
                                            <PropertyFilterFields
                                                value={draftDiscovery}
                                                onChange={setDraftDiscovery}
                                                presentation="owner-listings"
                                                fields={["where", "type", "budget"]}
                                            />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ) : null}
                            {showDiscoveryFilters ? (
                                <AccordionItem
                                    value="discovery-type"
                                    className="
                                      border-0 border-border-warm
                                      not-last:border-be
                                      data-open:bg-transparent
                                    "
                                >
                                    <FilterAccordionTrigger
                                        title="Size & property type"
                                        description="Choose the size, category and property type."
                                    />
                                    <AccordionContent className="px-0 pbe-0">
                                        <div className="border-0 pbe-6">
                                            <PropertyFilterFields
                                                value={draftDiscovery}
                                                onChange={setDraftDiscovery}
                                                presentation="owner-listings"
                                                fields={["area", "category", "propertyType"]}
                                            />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ) : null}
                            {showLayoutSection ? (
                                <AccordionItem
                                    value="layout"
                                    className="
                                      border-0 border-border-warm
                                      not-last:border-be
                                      data-open:bg-transparent
                                    "
                                >
                                    <FilterAccordionTrigger
                                        title="Rooms & layout"
                                        summary={layoutSummary}
                                        description="Set a count, or keep Any to see all options."
                                    />
                                    <AccordionContent className="px-0 pbe-0">
                                        <div className="flex flex-col gap-5 border-0 pbe-6">
                                            {visibility.showBhk ? (
                                                <CountFilter
                                                    label="Bedrooms (BHK)"
                                                    icon={Bed}
                                                    options={BHK_OPTIONS}
                                                    selected={draft.bhk}
                                                    onChange={(values) =>
                                                        updateDraft({ bhk: values })
                                                    }
                                                />
                                            ) : null}
                                            {visibility.showBathrooms ? (
                                                <CountFilter
                                                    label="Bathrooms"
                                                    icon={Bath}
                                                    options={BATHROOM_OPTIONS}
                                                    selected={draft.bathrooms}
                                                    onChange={(values) =>
                                                        updateDraft({ bathrooms: values })
                                                    }
                                                />
                                            ) : null}
                                            {visibility.showBalconies ? (
                                                <CountFilter
                                                    label="Balconies"
                                                    icon={Fence}
                                                    options={BALCONY_OPTIONS}
                                                    selected={draft.balconies}
                                                    onChange={(values) =>
                                                        updateDraft({ balconies: values })
                                                    }
                                                />
                                            ) : null}
                                            {visibility.showParking ? (
                                                <CountFilter
                                                    label="Parking"
                                                    icon={Car}
                                                    options={PARKING_OPTIONS}
                                                    selected={draft.parking}
                                                    onChange={(values) =>
                                                        updateDraft({ parking: values })
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
                                    className="
                                      border-0 border-border-warm
                                      not-last:border-be
                                      data-open:bg-transparent
                                    "
                                >
                                    <FilterAccordionTrigger
                                        title="Property details"
                                        summary={moreSummary}
                                    />
                                    <AccordionContent className="px-0 pbe-0">
                                        <div className="flex flex-col gap-7 border-0 pbe-6">
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
                                className="border-0 border-border-warm data-open:bg-transparent"
                            >
                                <FilterAccordionTrigger
                                    title="Listed & commission"
                                    summary={dealSummary}
                                />
                                <AccordionContent className="px-0 pbe-0">
                                    <div className="flex flex-col gap-7">
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
                                                    thumbAlignment="edge"
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
                                                label={`Rent commission (fixed ${currency.symbol})`}
                                                minLabel={formatMoney(rentRange[0])}
                                                maxLabel={
                                                    rentRange[1] >= rentCommissionBounds.max
                                                        ? `${formatMoney(rentCommissionBounds.max)}+`
                                                        : formatMoney(rentRange[1])
                                                }
                                                isAny={
                                                    !draft.minCommissionAmount &&
                                                    !draft.maxCommissionAmount
                                                }
                                                boundsLabel={`${formatMoney(rentCommissionBounds.min)} – ${formatMoney(rentCommissionBounds.max)}+`}
                                            >
                                                <RangeSlider
                                                    value={rentRange}
                                                    min={rentCommissionBounds.min}
                                                    max={rentCommissionBounds.max}
                                                    step={rentCommissionBounds.step}
                                                    thumbAlignment="edge"
                                                    thumbLabels={[
                                                        "Minimum rent commission",
                                                        "Maximum rent commission",
                                                    ]}
                                                    onValueChange={(next) => {
                                                        const [min, max] = rangeToDraft(
                                                            next,
                                                            rentCommissionBounds,
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
                </ScrollArea>

                <div
                    className={cn(
                        "relative z-1 shrink-0 border-bs border-border-warm bg-surface p-5 sm:px-8",
                        hasContentBelow && "shadow-[0_-6px_16px_-8px_rgb(0_0_0/0.2)]",
                    )}
                >
                    <AppModalFooter
                        className="
                          justify-between
                          [&_button]:rounded-inner [&_button]:px-5 [&_button]:min-block-11
                        "
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
