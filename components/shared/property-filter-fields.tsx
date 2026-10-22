"use client";

import { useId, useState } from "react";

import {
    EMPTY_PROPERTY_CRITERIA,
    normalizePropertyCriteria,
    type PropertyListCriteria,
} from "@/lib/properties/list-criteria";
import { cn } from "@/lib/utils";

import {
    type AppIcon,
    Building2,
    Check,
    Factory,
    HandCoins,
    Home,
    KeyRound,
    LandPlot,
    Layers,
    MapPin,
    Search,
    Trees,
} from "@/components/shared/icons";
import { EditableRangeValuePill } from "@/components/shared/range-value-pill";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent as SelectPopup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RangeSlider } from "@/components/ui/slider";

import {
    PROPERTY_CATEGORY_OPTIONS,
    PROPERTY_TYPES,
    propertyTypeOptions,
    toLabel,
} from "@/constants/property";
import { stripHiddenOwnerListingsFilters } from "@/features/properties/owner-listings/filter-visibility";
import {
    areaDraftToRange,
    areaRangeToDraft,
    buildAreaHistogram,
    OWNER_LISTINGS_AREA_RANGE,
} from "@/features/properties/owner-listings/owner-listings-area-presets";
import {
    findBudgetStepIndex,
    getBudgetSteps,
} from "@/features/properties/owner-listings/owner-listings-budget-presets";
import {
    DEFAULT_OWNER_LISTINGS_FILTERS,
    OWNER_LISTING_PROPERTY_TYPES,
} from "@/features/properties/owner-listings/types";

function DiscoveryWhereMenu({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(value);

    const commit = () => {
        onChange(draft.trim());
        setOpen(false);
    };

    return (
        <DropdownMenu
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (next) setDraft(value);
            }}
        >
            <DropdownMenuTrigger
                className="flex inline-full min-inline-0"
                render={
                    <button
                        type="button"
                        className={cn(
                            `
                              flex items-center gap-3 rounded-control border border-border-warm
                              bg-surface px-4 py-3 text-start shadow-sm
                              transition-[border-color,background-color,box-shadow] duration-160
                              inline-full min-block-12
                              hover:border-ink/25 hover:bg-surface-muted/50
                              focus-visible:ring-2 focus-visible:ring-brand
                            `,
                            value && "border-brand/45 bg-brand-soft/35",
                        )}
                    >
                        <MapPin
                            aria-hidden
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                        />
                        <span className="flex flex-1 flex-col min-inline-0">
                            <span className="text-xs font-medium text-ink-muted">Where</span>
                            <span className="truncate text-sm font-medium text-ink">
                                {value || "Anywhere"}
                            </span>
                        </span>
                    </button>
                }
            />
            <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="
                  rounded-card border border-border-warm bg-surface p-4 shadow-lg ring-0
                  inline-(--anchor-width)! min-inline-0!
                "
            >
                <p className="px-1 pbe-3 text-sm text-ink-muted">Pick a city or locality</p>
                <Input
                    autoFocus
                    size="md"
                    startIcon={Search}
                    value={draft}
                    onValueChange={setDraft}
                    placeholder="Search places"
                    aria-label="Search city or locality"
                    onKeyDown={(event) => {
                        event.stopPropagation();
                        if (event.key === "Enter") {
                            event.preventDefault();
                            commit();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={() => {
                        setDraft("");
                        onChange("");
                        setOpen(false);
                    }}
                    className={cn(
                        `
                          mbs-4 mbe-1 flex items-center gap-3 rounded-inner border p-4 text-start
                          transition-colors duration-160 inline-full min-block-14
                        `,
                        value
                            ? "border-transparent hover:bg-surface-muted"
                            : "border-brand bg-brand-soft",
                    )}
                >
                    <MapPin
                        aria-hidden
                        className="text-brand block-5 inline-5"
                        strokeWidth={1.75}
                    />
                    <span className="flex flex-col">
                        <span className="text-sm font-medium text-ink">Anywhere</span>
                        <span className="text-xs text-ink-muted">All listed properties</span>
                    </span>
                </button>
                {draft.trim() ? (
                    <Button type="button" className="mbs-2 inline-full" onClick={commit}>
                        Use “{draft.trim()}”
                    </Button>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function OwnerListingsPropertySearchFields({
    value,
    onChange,
    fields,
}: {
    value?: Partial<PropertyListCriteria>;
    onChange: (next: PropertyListCriteria) => void;
    fields: readonly ("where" | "type" | "budget" | "area" | "category" | "propertyType")[];
}) {
    const v = normalizePropertyCriteria(value);
    const patch = (next: Partial<PropertyListCriteria>) =>
        onChange(normalizePropertyCriteria({ ...v, ...next }));
    const transactionOptions = [
        { value: "" as const, label: "Any", icon: Layers },
        { value: "sale" as const, label: "Sale", icon: HandCoins },
        { value: "rent" as const, label: "Rent", icon: KeyRound },
    ];
    const budgetSteps = getBudgetSteps(v.type);
    const budgetIndex = findBudgetStepIndex(v.min, v.max, budgetSteps);
    const budgetStep = budgetSteps[budgetIndex] ?? budgetSteps[0];
    const areaRange = areaDraftToRange(v.minAreaSqft, v.maxAreaSqft);
    const areaHistogram = buildAreaHistogram();
    const categoryIcons: Record<string, AppIcon> = {
        "": Layers,
        residential: Home,
        commercial: Building2,
        land: LandPlot,
        industrial: Factory,
        agricultural: Trees,
    };
    const categoryOptions = [
        { value: "" as const, label: "Any category" },
        ...PROPERTY_CATEGORY_OPTIONS,
    ];
    const typeOptions = [
        { value: "", label: "Any type" },
        ...(v.category ? propertyTypeOptions(v.category) : OWNER_LISTING_PROPERTY_TYPES),
    ];
    const selectionChipClass = (active: boolean) =>
        cn(
            `
              relative flex items-center gap-2 rounded-full border px-4 py-3 text-start shadow-none
              transition-[background-color,border-color,color,box-shadow] duration-160 min-block-11
            `,
            active
                ? "border-brand bg-brand-soft font-medium text-brand-text"
                : "border-border-warm bg-surface text-ink hover:bg-surface-muted",
        );

    return (
        <div className="flex flex-col gap-5">
            {fields.includes("where") ? (
                <DiscoveryWhereMenu value={v.where} onChange={(where) => patch({ where })} />
            ) : null}

            {fields.includes("type") ? (
                <div role="group" aria-label="Looking for" className="flex flex-col gap-2.5">
                    <span className="text-sm font-medium text-ink">Looking for</span>
                    <div className="grid grid-cols-3 gap-2">
                        {transactionOptions.map((option) => {
                            const Icon = option.icon;
                            const active = v.type === option.value;
                            return (
                                <Button
                                    key={option.value || "any"}
                                    type="button"
                                    variant="outline"
                                    aria-pressed={active}
                                    onClick={() =>
                                        patch({
                                            type: option.value,
                                            ...(option.value !== v.type
                                                ? { min: "", max: "" }
                                                : {}),
                                        })
                                    }
                                    className={cn(
                                        `
                                          gap-2 rounded-control border-border-warm bg-surface px-3
                                          shadow-none min-block-12
                                        `,
                                        active &&
                                            `
                                              border-brand bg-brand-soft text-brand-text ring-1
                                              ring-brand/20
                                            `,
                                    )}
                                >
                                    <Icon
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                    {option.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            {fields.includes("budget") ? (
                <div className="flex flex-col gap-4 border-0">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-ink">
                            {v.type === "rent" ? "Monthly rent" : "Budget"}
                        </span>
                        <span className="text-sm font-semibold text-brand-text">
                            {budgetStep.label}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 border-0">
                        {budgetSteps.map((option, index) => (
                            <button
                                key={`${v.type}-${option.label}`}
                                type="button"
                                aria-pressed={index === budgetIndex}
                                onClick={() => patch({ min: option.min, max: option.max })}
                                className={cn(
                                    `
                                      rounded-full border px-4 py-3 text-sm font-medium
                                      transition-colors duration-160 min-block-11
                                    `,
                                    index === budgetIndex
                                        ? "border-brand bg-brand-soft text-brand-text"
                                        : `
                                          border-border-warm bg-surface text-ink
                                          hover:bg-surface-muted
                                        `,
                                )}
                            >
                                {option.shortLabel}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            {fields.includes("area") ? (
                <div className="flex flex-col gap-4 border-0">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-ink">Area</span>
                        <span className="text-sm font-semibold text-brand-text">
                            {!v.minAreaSqft && !v.maxAreaSqft
                                ? "Any"
                                : `${v.minAreaSqft || OWNER_LISTINGS_AREA_RANGE.min}–${v.maxAreaSqft || `${OWNER_LISTINGS_AREA_RANGE.max}+`} sq ft`}
                        </span>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-end gap-1 border-0 px-0.5 block-16" aria-hidden>
                            {areaHistogram.map((height, index) => {
                                const span =
                                    OWNER_LISTINGS_AREA_RANGE.max - OWNER_LISTINGS_AREA_RANGE.min;
                                const bucketMin =
                                    OWNER_LISTINGS_AREA_RANGE.min +
                                    (index / areaHistogram.length) * span;
                                const bucketMax =
                                    OWNER_LISTINGS_AREA_RANGE.min +
                                    ((index + 1) / areaHistogram.length) * span;
                                const active =
                                    bucketMax >= areaRange[0] && bucketMin <= areaRange[1];
                                return (
                                    <span
                                        key={index}
                                        className={cn(
                                            "flex-1 rounded-[3px] min-inline-0",
                                            active ? "bg-brand" : "bg-border-warm",
                                        )}
                                        style={{ height: `${Math.max(10, height * 100)}%` }}
                                    />
                                );
                            })}
                        </div>
                        <RangeSlider
                            value={areaRange}
                            min={OWNER_LISTINGS_AREA_RANGE.min}
                            max={OWNER_LISTINGS_AREA_RANGE.max}
                            step={OWNER_LISTINGS_AREA_RANGE.step}
                            thumbAlignment="edge"
                            thumbLabels={["Minimum area", "Maximum area"]}
                            onValueChange={(next) => {
                                const [low, high] = next as [number, number];
                                patch(areaRangeToDraft([Math.min(low, high), Math.max(low, high)]));
                            }}
                            className="
                              **:[[role=slider]]:border-2 **:[[role=slider]]:border-brand
                              **:[[role=slider]]:bg-surface **:[[role=slider]]:shadow-none
                              **:[[role=slider]]:block-5 **:[[role=slider]]:inline-5
                              [&>div]:py-2.5
                              [&>div>div]:rounded-full [&>div>div]:bg-border [&>div>div]:block-1.5
                              [&>div>div>div:first-child]:rounded-full
                              [&>div>div>div:first-child]:bg-brand
                            "
                        />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <label className="flex flex-col items-start gap-1.5 text-xs text-ink-muted">
                            Minimum
                            <EditableRangeValuePill
                                ariaLabel="Minimum area in square feet"
                                value={v.minAreaSqft}
                                placeholder="200 sq ft"
                                onValueChange={(minAreaSqft) => patch({ minAreaSqft })}
                                className="px-3 inline-24"
                            />
                        </label>
                        <label className="flex flex-col items-end gap-1.5 text-xs text-ink-muted">
                            Maximum
                            <EditableRangeValuePill
                                ariaLabel="Maximum area in square feet"
                                value={v.maxAreaSqft}
                                placeholder="5,000+ sq ft"
                                onValueChange={(maxAreaSqft) => patch({ maxAreaSqft })}
                                className="px-3 inline-28"
                            />
                        </label>
                    </div>
                </div>
            ) : null}

            {fields.includes("category") ? (
                <div role="group" aria-label="Category" className="flex flex-col gap-3 border-0">
                    <span className="text-sm font-medium text-ink">Category</span>
                    <div className="flex flex-wrap gap-2 border-0">
                        {categoryOptions.map((option) => {
                            const active = v.category === option.value;
                            const Icon = categoryIcons[option.value] ?? Layers;
                            return (
                                <button
                                    key={option.value || "any"}
                                    type="button"
                                    aria-pressed={active}
                                    className={selectionChipClass(active)}
                                    onClick={() => {
                                        const stripped = stripHiddenOwnerListingsFilters({
                                            ...DEFAULT_OWNER_LISTINGS_FILTERS,
                                            ...v,
                                            category: option.value,
                                        });
                                        patch({
                                            category: stripped.category,
                                            propertyType: stripped.propertyType,
                                        });
                                    }}
                                >
                                    <Icon
                                        aria-hidden
                                        className="shrink-0 block-5 inline-5"
                                        strokeWidth={1.6}
                                    />
                                    <span className="text-sm font-medium">{option.label}</span>
                                    {active ? (
                                        <Check aria-hidden className="block-4 inline-4" />
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            {fields.includes("propertyType") ? (
                <div
                    role="group"
                    aria-label="Property type"
                    className="flex flex-col gap-3 border-0"
                >
                    <span className="text-sm font-medium text-ink">Property type</span>
                    {!v.category ? (
                        <p className="text-xs text-ink-muted">
                            Choose a category to see its full list of property types.
                        </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                        {typeOptions.map((option) => {
                            const active = v.propertyType === option.value;
                            return (
                                <button
                                    key={option.value || "any"}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => patch({ propertyType: option.value })}
                                    className={cn(
                                        `
                                          flex items-center gap-2 rounded-full border px-4 py-3
                                          text-sm transition-colors duration-160 min-block-11
                                        `,
                                        active
                                            ? `
                                              border-brand bg-brand-soft font-medium text-brand-text
                                            `
                                            : `
                                              border-border-warm bg-surface text-ink
                                              hover:bg-surface-muted
                                            `,
                                    )}
                                >
                                    <Layers
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={1.6}
                                    />
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function Choice({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}) {
    const id = useId();
    return (
        <div className="flex flex-col gap-2 min-inline-0">
            <label id={id} className="text-sm font-medium text-ink">
                {label}
            </label>
            <Select items={options} value={value} onValueChange={(next) => onChange(next ?? "")}>
                <SelectTrigger size="md" aria-labelledby={id}>
                    <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectPopup>
            </Select>
        </div>
    );
}

export function PropertyFilterFields({
    value,
    onChange,
    fields = ["where", "type", "budget", "area", "category", "propertyType"],
    presentation = "form",
}: {
    value?: Partial<PropertyListCriteria>;
    onChange: (next: PropertyListCriteria) => void;
    fields?: readonly ("where" | "type" | "budget" | "area" | "category" | "propertyType")[];
    presentation?: "form" | "owner-listings";
}) {
    if (presentation === "owner-listings") {
        return (
            <OwnerListingsPropertySearchFields value={value} onChange={onChange} fields={fields} />
        );
    }
    const normalized = normalizePropertyCriteria(value);
    const v = {
        ...EMPTY_PROPERTY_CRITERIA,
        ...value,
        category: normalized.category,
        propertyType: normalized.propertyType,
        type: normalized.type,
    };
    const patch = (next: Partial<PropertyListCriteria>) =>
        onChange(normalizePropertyCriteria({ ...v, ...next }));
    const types: readonly string[] = v.category
        ? PROPERTY_TYPES[v.category]
        : [...new Set(Object.values(PROPERTY_TYPES).flat())];
    const range = (
        label: string,
        min: "min" | "minAreaSqft",
        max: "max" | "maxAreaSqft",
        unit: string,
    ) => (
        <fieldset className="flex flex-col gap-2">
            <legend className="mbe-2 text-sm font-medium text-ink">{label}</legend>
            <div className="grid grid-cols-2 gap-3">
                {([min, max] as const).map((key, index) => (
                    <Input
                        size="md"
                        key={key}
                        aria-label={`${index === 0 ? "Minimum" : "Maximum"} ${label.toLowerCase()}`}
                        inputMode="numeric"
                        type="number"
                        min={0}
                        placeholder={`${index === 0 ? "Min" : "Max"} ${unit}`}
                        value={v[key]}
                        onValueChange={(next) => onChange({ ...v, [key]: next })}
                    />
                ))}
            </div>
        </fieldset>
    );
    return (
        <div className="flex flex-col gap-5">
            {fields.includes("where") ? (
                <label className="flex flex-col gap-2 text-sm font-medium text-ink">
                    Where
                    <Input
                        size="md"
                        value={v.where}
                        onValueChange={(where) => onChange({ ...v, where })}
                        placeholder="City or locality"
                    />
                </label>
            ) : null}
            {fields.includes("type") ? (
                <div role="group" aria-label="Looking for" className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-ink">Looking for</span>
                    <div className="flex flex-wrap gap-2">
                        {(
                            [
                                ["", "Any"],
                                ["sale", "Sale"],
                                ["rent", "Rent"],
                            ] as const
                        ).map(([type, label]) => (
                            <Button
                                size="md"
                                key={type}
                                type="button"
                                variant={v.type === type ? "secondary" : "outline"}
                                aria-pressed={v.type === type}
                                className={
                                    v.type === type
                                        ? `border-brand bg-brand-soft text-brand-text`
                                        : undefined
                                }
                                onClick={() =>
                                    patch({
                                        type,
                                        ...(type !== v.type ? { min: "", max: "" } : {}),
                                    })
                                }
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>
            ) : null}
            {fields.includes("budget")
                ? range(v.type === "rent" ? "Monthly rent" : "Budget", "min", "max", "₹")
                : null}
            {fields.includes("area") ? range("Area", "minAreaSqft", "maxAreaSqft", "sq ft") : null}
            {fields.includes("category") ? (
                <Choice
                    label="Category"
                    value={v.category}
                    options={[{ value: "", label: "Any category" }, ...PROPERTY_CATEGORY_OPTIONS]}
                    onChange={(category) =>
                        patch({
                            category: category as PropertyListCriteria["category"],
                            propertyType: "",
                        })
                    }
                />
            ) : null}
            {fields.includes("propertyType") ? (
                <Choice
                    label="Property type"
                    value={v.propertyType}
                    options={[
                        { value: "", label: "Any type" },
                        ...types.map((type) => ({ value: type, label: toLabel(type) })),
                    ]}
                    onChange={(propertyType) => patch({ propertyType })}
                />
            ) : null}
        </div>
    );
}
