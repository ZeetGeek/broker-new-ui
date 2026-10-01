"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useFormContext } from "react-hook-form";
import { AnimatePresence, motion } from "motion/react";

import { Plus, Search, Sofa, Sparkles, X } from "lucide-react";

import { duration, ease } from "@/lib/motion/tokens";
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
    FORM_SECTIONS_CLASS,
    FORM_STACK_CLASS,
    WizardSection,
} from "@/features/properties/property-form/form-fields";
import {
    AMENITY_FALLBACK_ICON,
    AMENITY_ICONS,
    FURNISHING_ICONS,
} from "@/features/properties/property-form/option-icons";

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

const chipMotion = {
    initial: { opacity: 0, y: 8, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.97, y: -4 },
    transition: { duration: duration.base, ease: ease.smoothOut },
} as const;

function AccordionChevron() {
    return (
        <span className="t-acc-chevron" aria-hidden>
            <svg viewBox="0 0 16 16" className="block-4 inline-4" fill="none" stroke="currentColor">
                <path
                    d="M4 6.5L8 10.5L12 6.5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </span>
    );
}

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
        return new Set<string>(preferred.filter((value) => available.has(value)));
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

    const moreAmenities = useMemo(
        () => catalog.filter((option) => !popularSet.has(option.value)),
        [catalog, popularSet],
    );

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
        const icon = AMENITY_ICONS[option.value] ?? AMENITY_FALLBACK_ICON;
        const isOn = Boolean(active || removable);
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
                      gap-1.5 rounded-control border-2 px-3 py-2 text-sm font-medium
                      transition-[background-color,border-color,color,transform]
                      duration-160 min-block-11
                      focus-visible:ring-3 focus-visible:ring-ring/30
                      sm:min-block-10
                    `,
                    isOn
                        ? `
                          border-brand bg-brand-soft text-brand-text
                          hover:bg-brand-soft-hover hover:text-brand-text
                        `
                        : `
                          border-border-warm bg-surface text-ink-muted
                          hover:border-brand/40 hover:bg-surface hover:text-ink-muted
                        `,
                )}
            >
                <span className="shrink-0 [&_svg]:block-3.5 [&_svg]:inline-3.5" aria-hidden>
                    {icon}
                </span>
                {label}
                {removable ? (
                    <X className="block-3.5 inline-3.5 shrink-0" aria-hidden />
                ) : null}
            </Button>
        );
    }

    return (
        <div className={FORM_SECTIONS_CLASS}>
            <WizardSection
                title={
                    <>
                        <Sofa
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Furnishing
                    </>
                }
                description="Pick how the property is handed over."
            >
                <ChoiceField
                    name="furnishing.status"
                    label="Furnishing status"
                    options={FURNISHING_OPTIONS}
                    columns={3}
                    icons={FURNISHING_ICONS}
                />
            </WizardSection>

            <WizardSection
                title={
                    <>
                        <Sparkles
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Amenities
                    </>
                }
                description="Search what’s on site, or add your own. Keep it to what’s really there."
            >
                <div className={FORM_STACK_CLASS}>
                    <div className="flex gap-2">
                        <Input
                            size="lg"
                            value={query}
                            onValueChange={setQuery}
                            startIcon={Search}
                            placeholder="e.g. Lift, gym, power backup…"
                            aria-label="Search or add amenity"
                            className="min-inline-0 flex-1"
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    if (
                                        filtered.length === 1 &&
                                        !selectedSet.has(filtered[0].value)
                                    ) {
                                        toggleAmenity(filtered[0].value);
                                        setQuery("");
                                        return;
                                    }
                                    addCustom();
                                }
                            }}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={addCustom}
                            disabled={!canAddCustom}
                            className="
                              shrink-0 rounded-control border-2 border-border-warm bg-surface
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

                    <AnimatePresence initial={false} mode="popLayout">
                        {selected.length ? (
                            <motion.div
                                key="selected-amenities"
                                className="space-y-2 overflow-hidden"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: duration.base, ease: ease.smoothOut }}
                            >
                                <div className="flex items-baseline justify-between gap-3">
                                    <p className="text-sm font-semibold text-ink">
                                        Selected · {selected.length}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="link"
                                        size="xs"
                                        onClick={clearAll}
                                        className="shrink-0 px-0 text-ink-muted hover:text-ink"
                                    >
                                        Clear all
                                    </Button>
                                </div>
                                <motion.div
                                    className="flex flex-wrap gap-2"
                                    layout
                                    role="list"
                                    aria-label="Selected amenities"
                                >
                                    <AnimatePresence initial={false} mode="popLayout">
                                        {selected.map((value) => (
                                            <motion.div
                                                key={value}
                                                role="listitem"
                                                layout
                                                {...chipMotion}
                                            >
                                                <ChipButton
                                                    option={{
                                                        value,
                                                        label: amenityLabel(value),
                                                    }}
                                                    removable
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.p
                                key="amenities-empty"
                                className="text-sm text-ink-muted"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: duration.fast, ease: ease.smoothOut }}
                            >
                                Nothing selected yet. Pick a few common ones below.
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {!trimmedQuery ? (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-ink">Suggested</p>
                            <div
                                className="flex flex-wrap gap-2"
                                role="group"
                                aria-label="Suggested amenities"
                            >
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
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addCustom}
                            className="
                              flex inline-full items-center justify-start gap-2 rounded-control
                              border-2 border-dashed border-brand/35 bg-brand-soft/40 px-3
                              py-2.5 text-start text-sm font-medium text-brand-text
                              transition-colors
                              hover:bg-brand-soft
                              focus-visible:ring-3 focus-visible:ring-ring/30
                              min-block-11
                            "
                        >
                            <Plus className="block-4 inline-4 shrink-0" aria-hidden />
                            Add “{trimmedQuery}” as custom
                        </Button>
                    ) : null}

                    {trimmedQuery && filtered.length ? (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-ink">
                                Matches · {filtered.length}
                            </p>
                            <div
                                className="flex flex-wrap gap-2"
                                role="group"
                                aria-label="Matching amenities"
                            >
                                {filtered.map((option) => (
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

                    {!trimmedQuery && moreAmenities.length ? (
                        <div className="t-acc" data-open={browseAll ? "true" : "false"}>
                            <div className="t-acc-panel">
                                <div className="t-acc-panel-inner">
                                    <div className="space-y-2 pbe-1">
                                        <p className="text-sm font-semibold text-ink">
                                            More amenities
                                        </p>
                                        <div
                                            className="flex flex-wrap gap-2"
                                            role="group"
                                            aria-label="More amenities"
                                        >
                                            {moreAmenities.map((option) => (
                                                <ChipButton
                                                    key={option.value}
                                                    option={option}
                                                    active={selectedSet.has(option.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="link"
                                size="xs"
                                aria-expanded={browseAll}
                                onClick={() => setBrowseAll((open) => !open)}
                                className="t-acc-head mt-1 shrink-0 gap-1.5 px-0 text-brand"
                            >
                                {browseAll
                                    ? "Show fewer"
                                    : `Browse all ${catalog.length} amenities`}
                                <AccordionChevron />
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
