"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useFormContext } from "react-hook-form";

import { Check, Plus, Search, X } from "lucide-react";

import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";
import { amenityLabel } from "@/lib/validation/property";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    COMMERCIAL_AMENITIES,
    CONVENIENCE_AMENITIES,
    FLAT_FEATURES,
    FURNISHING_OPTIONS,
    optionList,
    RECREATION_AMENITIES,
    SOCIETY_AMENITIES,
    toLabel,
} from "@/constants/property";
import {
    ChoiceField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

type AmenityBucket = keyof PropertyDraftValues["amenities"];

const AMENITY_BUCKET_BY_VALUE: Record<string, AmenityBucket> = {
    ...Object.fromEntries(SOCIETY_AMENITIES.map((value) => [value, "society" as const])),
    ...Object.fromEntries(RECREATION_AMENITIES.map((value) => [value, "recreation" as const])),
    ...Object.fromEntries(CONVENIENCE_AMENITIES.map((value) => [value, "convenience" as const])),
    ...Object.fromEntries(FLAT_FEATURES.map((value) => [value, "flatFeatures" as const])),
    ...Object.fromEntries(COMMERCIAL_AMENITIES.map((value) => [value, "commercial" as const])),
};

const POPULAR_RESIDENTIAL = [
    "lift",
    "power_backup",
    "security_guard",
    "cctv",
    "gated_community",
    "visitor_parking",
    "swimming_pool",
    "gym",
    "clubhouse",
    "park_garden",
    "modular_kitchen",
    "piped_gas",
] as const;

const POPULAR_COMMERCIAL = [
    "central_ac",
    "dg_backup",
    "lift",
    "power_backup",
    "security_guard",
    "cctv",
    "visitor_parking",
    "reception_area",
    "conference_room",
    "cafeteria",
    "ev_charging",
    "service_lift",
] as const;

const MAX_AMENITIES = 40;

const AMENITY_BUCKETS = [
    "society",
    "recreation",
    "convenience",
    "flatFeatures",
    "commercial",
    "land",
] as const satisfies readonly AmenityBucket[];

function createEmptyAmenities(): PropertyDraftValues["amenities"] {
    return {
        society: [],
        recreation: [],
        convenience: [],
        flatFeatures: [],
        commercial: [],
        land: [],
    };
}

function toAmenityValue(label: string): string {
    return label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 48);
}

function normalizeAmenityValue(value: string): string {
    const raw = String(value).trim();
    if (!raw) return "";
    if (AMENITY_BUCKET_BY_VALUE[raw]) return raw;
    return toAmenityValue(raw) || raw;
}

function collectSelected(amenities: PropertyDraftValues["amenities"]): string[] {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const bucket of AMENITY_BUCKETS) {
        for (const item of amenities[bucket] ?? []) {
            const value = normalizeAmenityValue(String(item));
            if (!value || seen.has(value)) continue;
            seen.add(value);
            ordered.push(value);
        }
    }
    return ordered;
}

function stripAmenity(
    amenities: PropertyDraftValues["amenities"],
    value: string,
): PropertyDraftValues["amenities"] {
    const target = normalizeAmenityValue(value);
    const next = createEmptyAmenities();
    for (const bucket of AMENITY_BUCKETS) {
        next[bucket] = (amenities[bucket] ?? [])
            .map(String)
            .filter((item) => normalizeAmenityValue(item) !== target);
    }
    return next;
}

function rebuildAmenities(values: string[]): PropertyDraftValues["amenities"] {
    const next = createEmptyAmenities();
    const seen = new Set<string>();
    for (const raw of values) {
        const value = normalizeAmenityValue(raw);
        if (!value || seen.has(value)) continue;
        seen.add(value);
        const bucket = AMENITY_BUCKET_BY_VALUE[value] ?? "society";
        next[bucket] = [...next[bucket], value];
    }
    return next;
}

export function StepFurnishing() {
    const { watch, setValue, getValues } = useFormContext<PropertyDraftValues>();
    const { derived } = useFieldRules();
    const isCommercial = derived.isCommercial || derived.isIndustrial;
    const amenities = watch("amenities") ?? createEmptyAmenities();
    const [query, setQuery] = useState("");
    const [browseAll, setBrowseAll] = useState(false);

    // Dedupe / normalize draft leftovers once so remove + clear always hit real values.
    useEffect(() => {
        const current = getValues("amenities") ?? createEmptyAmenities();
        const cleaned = rebuildAmenities(collectSelected(current));
        const changed = AMENITY_BUCKETS.some((bucket) => {
            const left = (current[bucket] ?? []).map(String);
            const right = cleaned[bucket];
            return left.length !== right.length || left.some((item, index) => item !== right[index]);
        });
        if (changed) {
            setValue("amenities", cleaned, { shouldDirty: false, shouldTouch: false });
        }
    }, [getValues, setValue]);

    const catalog = useMemo(() => {
        const values = isCommercial
            ? [...COMMERCIAL_AMENITIES, ...CONVENIENCE_AMENITIES, ...SOCIETY_AMENITIES]
            : [
                  ...SOCIETY_AMENITIES,
                  ...RECREATION_AMENITIES,
                  ...CONVENIENCE_AMENITIES,
                  ...FLAT_FEATURES,
              ];
        return optionList([...new Set(values)]);
    }, [isCommercial]);

    const popularSet = useMemo(() => {
        const preferred = isCommercial ? POPULAR_COMMERCIAL : POPULAR_RESIDENTIAL;
        const available = new Set(catalog.map((option) => option.value));
        return new Set(preferred.filter((value) => available.has(value)));
    }, [catalog, isCommercial]);

    const selected = useMemo(() => collectSelected(amenities), [amenities]);
    const selectedSet = useMemo(() => new Set(selected), [selected]);

    const trimmedQuery = query.trim();
    const queryValue = toAmenityValue(trimmedQuery);

    const filtered = useMemo(() => {
        if (!trimmedQuery) return [];
        const needle = trimmedQuery.toLowerCase();
        return catalog.filter(
            (option) =>
                option.label.toLowerCase().includes(needle) ||
                option.value.includes(needle.replace(/\s+/g, "_")),
        );
    }, [catalog, trimmedQuery]);

    const suggested = useMemo(
        () => catalog.filter((option) => popularSet.has(option.value)),
        [catalog, popularSet],
    );

    const browseList = useMemo(() => {
        if (trimmedQuery) return filtered;
        if (browseAll) {
            return catalog.filter((option) => !popularSet.has(option.value));
        }
        return [];
    }, [browseAll, catalog, filtered, popularSet, trimmedQuery]);

    const exactInCatalog = catalog.some(
        (option) =>
            option.value === queryValue || option.label.toLowerCase() === trimmedQuery.toLowerCase(),
    );
    const canAddCustom =
        Boolean(queryValue) && !selectedSet.has(queryValue) && selected.length < MAX_AMENITIES;

    function writeAmenities(next: PropertyDraftValues["amenities"]) {
        setValue("amenities", next, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    }

    function toggleAmenity(rawValue: string) {
        const value = normalizeAmenityValue(rawValue);
        if (!value) return;

        const current = getValues("amenities") ?? createEmptyAmenities();
        const selectedNow = collectSelected(current);
        const active = selectedNow.includes(value);

        if (active) {
            writeAmenities(stripAmenity(current, value));
            return;
        }
        if (selectedNow.length >= MAX_AMENITIES) return;

        const bucket = AMENITY_BUCKET_BY_VALUE[value] ?? "society";
        const cleaned = stripAmenity(current, value);
        writeAmenities({
            ...cleaned,
            [bucket]: [...cleaned[bucket], value],
        });
    }

    function addCustom() {
        if (!canAddCustom || !queryValue) return;
        if (exactInCatalog) {
            const match = catalog.find(
                (option) =>
                    option.value === queryValue ||
                    option.label.toLowerCase() === trimmedQuery.toLowerCase(),
            );
            if (match) {
                if (!selectedSet.has(match.value)) toggleAmenity(match.value);
                setQuery("");
                return;
            }
        }
        toggleAmenity(queryValue);
        setQuery("");
    }

    function clearAll(event?: MouseEvent) {
        event?.preventDefault();
        event?.stopPropagation();
        writeAmenities(createEmptyAmenities());
    }

    function removeAmenity(value: string, event?: MouseEvent) {
        event?.preventDefault();
        event?.stopPropagation();
        const current = getValues("amenities") ?? createEmptyAmenities();
        writeAmenities(stripAmenity(current, value));
    }

    function ChipButton({
        option,
        active,
        removable,
    }: {
        option: { value: string; label: string };
        active?: boolean;
        removable?: boolean;
    }) {
        const label = option.label || amenityLabel(option.value) || toLabel(option.value);
        return (
            <Button
                type="button"
                variant="outline"
                size="md"
                aria-pressed={removable ? undefined : active}
                aria-label={removable ? `Remove ${label}` : undefined}
                onClick={(event) => {
                    if (removable) removeAmenity(option.value, event);
                    else toggleAmenity(option.value);
                }}
                className={cn(
                    `
                      rounded-control border px-3 py-2 text-sm font-medium
                      transition-[background-color,border-color,color]
                      duration-160 min-block-11
                      focus-visible:ring-3 focus-visible:ring-ring/30
                      sm:min-block-10
                    `,
                    active || removable
                        ? "border-brand bg-brand-soft text-brand-text"
                        : `
                          border-border-warm bg-surface text-ink-muted
                          hover:border-brand/40 hover:text-ink
                        `,
                )}
            >
                {active && !removable ? (
                    <Check className="me-1.5 inline block-3.5 inline-3.5" aria-hidden />
                ) : null}
                {label}
                {removable ? (
                    <X className="ms-1.5 inline block-3.5 inline-3.5" aria-hidden />
                ) : null}
            </Button>
        );
    }

    return (
        <div className="space-y-8">
            <WizardSection
                title="Furnishing"
                description="Pick how the property is handed over."
            >
                <ChoiceField
                    name="furnishing.status"
                    label="Furnishing status"
                    options={FURNISHING_OPTIONS}
                    columns={3}
                />
            </WizardSection>

            <WizardSection
                title="Amenities"
                description="Search what’s on site, or add your own. Keep it to what’s really there."
            >
                <div className="space-y-5">
                    <div className="flex gap-2">
                        <div className="relative min-inline-0 flex-1">
                            <Search
                                className="
                                  pointer-events-none absolute inset-s-3 top-1/2 block-4
                                  inline-4 -translate-y-1/2 text-ink-subtle
                                "
                                aria-hidden
                            />
                            <Input
                                size="lg"
                                value={query}
                                onValueChange={setQuery}
                                placeholder="Search or add amenity"
                                aria-label="Search or add amenity"
                                className="ps-10"
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        if (filtered.length === 1 && !selectedSet.has(filtered[0].value)) {
                                            toggleAmenity(filtered[0].value);
                                            setQuery("");
                                            return;
                                        }
                                        addCustom();
                                    }
                                }}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={addCustom}
                            disabled={!canAddCustom}
                            className="
                              shrink-0 rounded-control border border-border-warm bg-surface
                              px-4 text-sm font-semibold text-ink
                              hover:bg-surface-muted
                              focus-visible:ring-3 focus-visible:ring-ring/30
                              disabled:opacity-40
                            "
                        >
                            <Plus className="me-1 inline block-4 inline-4" aria-hidden />
                            Add
                        </Button>
                    </div>

                    {selected.length ? (
                        <div className="space-y-2">
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="text-sm font-semibold text-ink">
                                    Selected · {selected.length}
                                </p>
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="
                                      text-sm font-medium text-ink-muted
                                      hover:text-ink
                                      focus-visible:rounded-sm focus-visible:ring-3
                                      focus-visible:ring-ring/30
                                    "
                                >
                                    Clear all
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2" role="list" aria-label="Selected amenities">
                                {selected.map((value) => (
                                    <div key={value} role="listitem">
                                        <ChipButton
                                            option={{
                                                value,
                                                label: amenityLabel(value),
                                            }}
                                            removable
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-ink-muted">
                            Nothing selected yet. Pick a few common ones below.
                        </p>
                    )}

                    {!trimmedQuery ? (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-ink">Suggested</p>
                            <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested amenities">
                                {suggested.map((option) => (
                                    <ChipButton
                                        key={option.value}
                                        option={option}
                                        active={selectedSet.has(option.value)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {trimmedQuery && canAddCustom && !exactInCatalog ? (
                        <button
                            type="button"
                            onClick={addCustom}
                            className="
                              flex inline-full items-center gap-2 rounded-control border
                              border-dashed border-brand/35 bg-brand-soft/40 px-3 py-2.5
                              text-start text-sm font-medium text-brand-text
                              transition-colors
                              hover:bg-brand-soft
                              focus-visible:ring-3 focus-visible:ring-ring/30
                              min-block-11
                            "
                        >
                            <Plus className="block-4 inline-4 shrink-0" aria-hidden />
                            Add “{trimmedQuery}” as custom
                        </button>
                    ) : null}

                    {browseList.length ? (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-ink">
                                {trimmedQuery ? `Matches · ${browseList.length}` : "More amenities"}
                            </p>
                            <div
                                className="flex flex-wrap gap-2"
                                role="group"
                                aria-label={trimmedQuery ? "Matching amenities" : "More amenities"}
                            >
                                {browseList.map((option) => (
                                    <ChipButton
                                        key={option.value}
                                        option={option}
                                        active={selectedSet.has(option.value)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {trimmedQuery && filtered.length === 0 && exactInCatalog === false ? (
                        <p className="text-sm text-ink-muted">
                            No match in the list. Press Add to save it as custom.
                        </p>
                    ) : null}

                    {!trimmedQuery ? (
                        <div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="md"
                                onClick={() => setBrowseAll((open) => !open)}
                                className="
                                  -ms-2 rounded-control px-2 text-sm font-medium text-brand
                                  hover:bg-brand-soft hover:text-brand-text
                                  focus-visible:ring-3 focus-visible:ring-ring/30
                                "
                            >
                                {browseAll ? "Show fewer" : `Browse all ${catalog.length} amenities`}
                            </Button>
                        </div>
                    ) : null}

                    {selected.length >= MAX_AMENITIES ? (
                        <p className="text-sm text-ink-muted">
                            Cap reached ({MAX_AMENITIES}). Remove one to add another.
                        </p>
                    ) : null}
                </div>
            </WizardSection>
        </div>
    );
}
