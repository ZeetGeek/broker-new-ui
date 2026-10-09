"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { useFormContext } from "react-hook-form";
import { AnimatePresence, motion } from "motion/react";

import { Plus, Search, X } from "lucide-react";

import { duration, ease } from "@/lib/motion/tokens";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { NEARBY_PLACE_TYPE_OPTIONS, toLabel } from "@/constants/property";
import { FORM_STACK_CLASS } from "@/features/properties/property-form/form-fields";
import {
    NEARBY_PLACE_FALLBACK_ICON,
    NEARBY_PLACE_ICONS,
} from "@/features/properties/property-form/option-icons";

const MAX_NEARBY_PLACES = 20;

const POPULAR_NEARBY = [
    "school",
    "hospital",
    "mall",
    "market",
    "park",
    "bus_stop",
    "temple",
    "gym",
    "restaurant",
    "bank_atm",
    "petrol_pump",
    "college",
] as const;

const catalog = NEARBY_PLACE_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
}));

const catalogValueSet = new Set(catalog.map((option) => option.value));

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

function toPlaceValue(label: string): string {
    return label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 48);
}

function normalizePlaceValue(value: string): string {
    const raw = String(value).trim();
    if (!raw) return "";
    if (catalogValueSet.has(raw)) return raw;
    return toPlaceValue(raw) || raw;
}

function placeLabel(value: string): string {
    const match = catalog.find((option) => option.value === value);
    if (match) return match.label;
    return toLabel(value);
}

function dedupePlaces(values: string[]): string[] {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const raw of values) {
        const value = normalizePlaceValue(raw);
        if (!value || seen.has(value)) continue;
        seen.add(value);
        ordered.push(value);
    }
    return ordered;
}

export function NearbyPlacesField() {
    const { watch, setValue, getValues } = useFormContext<PropertyDraftValues>();
    const nearbyPlaces = watch("location.nearbyPlaces") ?? [];
    const [query, setQuery] = useState("");
    const [browseAll, setBrowseAll] = useState(false);

    const selected = useMemo(
        () => dedupePlaces(nearbyPlaces.map(String)),
        [nearbyPlaces],
    );
    const selectedSet = useMemo(() => new Set(selected), [selected]);

    const popularSet = useMemo(() => new Set<string>(POPULAR_NEARBY), []);

    const trimmedQuery = query.trim();
    const queryValue = toPlaceValue(trimmedQuery);

    const filtered = useMemo(() => {
        if (!trimmedQuery) return [];
        const needle = trimmedQuery.toLowerCase();
        return catalog.filter(
            (option) =>
                option.label.toLowerCase().includes(needle) ||
                option.value.includes(needle.replace(/\s+/g, "_")),
        );
    }, [trimmedQuery]);

    const suggested = useMemo(
        () => catalog.filter((option) => popularSet.has(option.value)),
        [popularSet],
    );

    const morePlaces = useMemo(
        () => catalog.filter((option) => !popularSet.has(option.value)),
        [popularSet],
    );

    const exactInCatalog = catalog.some(
        (option) =>
            option.value === queryValue || option.label.toLowerCase() === trimmedQuery.toLowerCase(),
    );
    const canAddCustom =
        Boolean(queryValue) && !selectedSet.has(queryValue) && selected.length < MAX_NEARBY_PLACES;

    function writePlaces(next: string[]) {
        setValue("location.nearbyPlaces", dedupePlaces(next), {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    }

    function togglePlace(rawValue: string) {
        const value = normalizePlaceValue(rawValue);
        if (!value) return;

        const current = dedupePlaces((getValues("location.nearbyPlaces") ?? []).map(String));
        const active = current.includes(value);

        if (active) {
            writePlaces(current.filter((item) => item !== value));
            return;
        }
        if (current.length >= MAX_NEARBY_PLACES) return;
        writePlaces([...current, value]);
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
                if (!selectedSet.has(match.value)) togglePlace(match.value);
                setQuery("");
                return;
            }
        }
        togglePlace(queryValue);
        setQuery("");
    }

    function clearAll(event?: MouseEvent) {
        event?.preventDefault();
        event?.stopPropagation();
        writePlaces([]);
    }

    function removePlace(value: string, event?: MouseEvent) {
        event?.preventDefault();
        event?.stopPropagation();
        const current = dedupePlaces((getValues("location.nearbyPlaces") ?? []).map(String));
        writePlaces(current.filter((item) => item !== normalizePlaceValue(value)));
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
        const label = option.label || placeLabel(option.value);
        const icon = NEARBY_PLACE_ICONS[option.value] ?? NEARBY_PLACE_FALLBACK_ICON;
        const isOn = Boolean(active || removable);
        return (
            <Button
                type="button"
                variant="outline"
                size="md"
                aria-pressed={removable ? undefined : active}
                aria-label={removable ? `Remove ${label}` : undefined}
                onClick={(event) => {
                    if (removable) removePlace(option.value, event);
                    else togglePlace(option.value);
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
        <div className={FORM_STACK_CLASS}>
            <div className="flex gap-2">
                <Input
                    size="lg"
                    value={query}
                    onValueChange={setQuery}
                    startIcon={Search}
                    placeholder="e.g. school, hospital, VR Mall…"
                    aria-label="Search or add nearby place"
                    className="min-inline-0 flex-1"
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            if (filtered.length === 1 && !selectedSet.has(filtered[0].value)) {
                                togglePlace(filtered[0].value);
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
                        key="selected-nearby"
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
                            aria-label="Selected nearby places"
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
                                                label: placeLabel(value),
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
                        key="nearby-empty"
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
                        aria-label="Suggested nearby places"
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
                    <p className="text-sm font-semibold text-ink">Matches · {filtered.length}</p>
                    <div
                        className="flex flex-wrap gap-2"
                        role="group"
                        aria-label="Matching nearby places"
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

            {!trimmedQuery && morePlaces.length ? (
                <div className="t-acc" data-open={browseAll ? "true" : "false"}>
                    <div className="t-acc-panel">
                        <div className="t-acc-panel-inner">
                            <div className="space-y-2 pbe-1">
                                <p className="text-sm font-semibold text-ink">More places</p>
                                <div
                                    className="flex flex-wrap gap-2"
                                    role="group"
                                    aria-label="More nearby places"
                                >
                                    {morePlaces.map((option) => (
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
                        {browseAll ? "Show fewer" : `Browse all ${catalog.length} places`}
                        <AccordionChevron />
                    </Button>
                </div>
            ) : null}

            {selected.length >= MAX_NEARBY_PLACES ? (
                <p className="text-sm text-ink-muted">
                    Cap reached ({MAX_NEARBY_PLACES}). Remove one to add another.
                </p>
            ) : null}
        </div>
    );
}
