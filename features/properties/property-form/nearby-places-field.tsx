"use client";

import { type MouseEvent, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import { AnimatePresence, motion } from "motion/react";

import { duration, ease } from "@/lib/motion/tokens";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";

import { ChevronDown, Plus, Search, X } from "@/components/shared/icons";
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
    const nearbyPlaces = watch("location.nearbyPlaces");
    const [query, setQuery] = useState("");
    const [browseAll, setBrowseAll] = useState(false);

    const selected = useMemo(() => dedupePlaces((nearbyPlaces ?? []).map(String)), [nearbyPlaces]);
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
            option.value === queryValue ||
            option.label.toLowerCase() === trimmedQuery.toLowerCase(),
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
                size="default"
                disabled={!isOn && selected.length >= MAX_NEARBY_PLACES}
                aria-pressed={removable ? undefined : active}
                aria-label={removable ? `Remove ${label}` : undefined}
                onClick={(event) => {
                    if (removable) removePlace(option.value, event);
                    else togglePlace(option.value);
                }}
                className={cn(
                    `
                      gap-2 rounded-full border px-4 text-sm font-medium
                      transition-[background-color,border-color,color,transform] duration-160
                      min-block-10
                      focus-visible:ring-3 focus-visible:ring-ring/30
                    `,
                    isOn
                        ? `
                          border-brand bg-brand-soft text-brand-text
                          hover:bg-brand-soft-hover hover:text-brand-text
                        `
                        : `
                          border-border-warm bg-surface text-ink
                          hover:border-brand/40 hover:bg-brand-soft/40 hover:text-brand-text
                        `,
                )}
            >
                <span className="shrink-0 [&_svg]:block-3.5 [&_svg]:inline-3.5" aria-hidden>
                    {icon}
                </span>
                {label}
                {removable ? <X className="shrink-0 block-3.5 inline-3.5" aria-hidden /> : null}
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
                    placeholder="Search places or add a name"
                    aria-label="Search or add nearby place"
                    className="flex-1 min-inline-0"
                    maxLength={48}
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
                    variant="accent"
                    size="lg"
                    onClick={addCustom}
                    disabled={!canAddCustom}
                    className="
                      shrink-0 rounded-control px-5 text-sm font-semibold
                      focus-visible:ring-3 focus-visible:ring-ring/30
                      disabled:opacity-40
                    "
                >
                    <Plus aria-hidden />
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
                                    <motion.div key={value} role="listitem" layout {...chipMotion}>
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
                ) : null}
            </AnimatePresence>

            {!trimmedQuery ? (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-ink-muted">
                        {browseAll ? "All places" : "Suggested places"}
                    </p>
                    <div
                        className="flex flex-wrap gap-2"
                        role="group"
                        aria-label="Suggested nearby places"
                    >
                        {(browseAll ? catalog : suggested)
                            .filter((option) => !selectedSet.has(option.value))
                            .map((option) => (
                                <ChipButton
                                    key={option.value}
                                    option={option}
                                    active={selectedSet.has(option.value)}
                                />
                            ))}
                    </div>
                </div>
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
                <div>
                    <Button
                        type="button"
                        variant="link"
                        size="xs"
                        aria-expanded={browseAll}
                        onClick={() => setBrowseAll((open) => !open)}
                        className="shrink-0 gap-1.5 px-0 text-brand"
                    >
                        {browseAll ? "Show fewer" : `Browse all ${catalog.length} places`}
                        <ChevronDown
                            aria-hidden
                            className={cn("block-4 inline-4", browseAll && "rotate-180")}
                        />
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
