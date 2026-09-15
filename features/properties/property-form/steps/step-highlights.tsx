"use client";

// Highlights UI + logic temporarily commented out (kept for restore).
// import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useFormContext } from "react-hook-form";

// import { Check, Plus, Search, Trash2, X } from "lucide-react";
import { Plus, Trash2 } from "lucide-react";

import { createClientId } from "@/lib/client-id";
import type { PropertyDraftValues } from "@/lib/schemas/property";
// import { cn } from "@/lib/utils";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

import {
    // LISTING_HIGHLIGHT_SUGGESTIONS,
    PAYMENT_PLAN_OPTIONS,
    // POPULAR_LISTING_HIGHLIGHTS,
    POSSESSION_TYPE_OPTIONS,
} from "@/constants/property";
import {
    ChoiceField,
    FORM_GRID_CLASS,
    NumberField,
    SelectField,
    TextField,
    ToggleField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

/*
const MAX_HIGHLIGHTS = 8;

function normalizeHighlight(value: string): string {
    return value.trim().slice(0, 40);
}

function highlightKey(value: string): string {
    return normalizeHighlight(value).toLowerCase();
}

function dedupeHighlights(values: string[]): string[] {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const raw of values) {
        const text = normalizeHighlight(String(raw));
        if (!text) continue;
        const key = highlightKey(text);
        if (seen.has(key)) continue;
        seen.add(key);
        ordered.push(text);
    }
    return ordered;
}
*/

export function StepHighlights() {
    const { watch, setValue /* , getValues */ } = useFormContext<PropertyDraftValues>();
    const { isVisible } = useFieldRules();
    const values = watch();
    // const highlights = dedupeHighlights(values.highlights.chips ?? []);
    const schedule = values.construction.paymentSchedule;
    /*
    const [query, setQuery] = useState("");
    const [browseAll, setBrowseAll] = useState(false);

    const catalog = useMemo(
        () =>
            LISTING_HIGHLIGHT_SUGGESTIONS.map((label) => ({
                value: label,
                label,
            })),
        [],
    );

    const popularSet = useMemo(
        () => new Set<string>(POPULAR_LISTING_HIGHLIGHTS as readonly string[]),
        [],
    );

    const fromListing = useMemo(() => {
        const items: string[] = [];
        if (values.details.coveredParking) items.push("Covered parking");
        if (values.location.landmark?.trim()) {
            items.push(`Near ${values.location.landmark.trim()}`.slice(0, 40));
        }
        if (values.furnishing.status === "fully_furnished") items.push("Fully furnished");
        if (values.furnishing.status === "semi_furnished") items.push("Semi furnished");
        return dedupeHighlights(items);
    }, [values.details.coveredParking, values.furnishing.status, values.location.landmark]);

    const selectedSet = useMemo(
        () => new Set(highlights.map((item) => highlightKey(item))),
        [highlights],
    );

    const trimmedQuery = query.trim();

    const filtered = useMemo(() => {
        if (!trimmedQuery) return [];
        const needle = trimmedQuery.toLowerCase();
        return catalog.filter(
            (option) =>
                option.label.toLowerCase().includes(needle) ||
                option.value.toLowerCase().includes(needle),
        );
    }, [catalog, trimmedQuery]);

    const fromListingOptions = useMemo(
        () =>
            fromListing.map((label) => ({
                value: label,
                label,
            })),
        [fromListing],
    );

    const suggested = useMemo(() => {
        const fromKeys = new Set(fromListing.map(highlightKey));
        return catalog.filter(
            (option) =>
                popularSet.has(option.value) && !fromKeys.has(highlightKey(option.value)),
        );
    }, [catalog, fromListing, popularSet]);

    const browseList = useMemo(() => {
        if (trimmedQuery) return filtered;
        if (browseAll) {
            const shown = new Set([
                ...fromListing.map(highlightKey),
                ...POPULAR_LISTING_HIGHLIGHTS.map(highlightKey),
            ]);
            return catalog.filter((option) => !shown.has(highlightKey(option.value)));
        }
        return [];
    }, [browseAll, catalog, filtered, fromListing, trimmedQuery]);

    const exactInCatalog = catalog.some(
        (option) => option.label.toLowerCase() === trimmedQuery.toLowerCase(),
    );

    const canAddCustom =
        Boolean(trimmedQuery) &&
        !selectedSet.has(highlightKey(trimmedQuery)) &&
        highlights.length < MAX_HIGHLIGHTS;

    useEffect(() => {
        const current = getValues("highlights.chips") ?? [];
        const cleaned = dedupeHighlights(current.map(String));
        const changed =
            cleaned.length !== current.length ||
            cleaned.some((item, index) => item !== normalizeHighlight(String(current[index] ?? "")));
        if (changed) {
            setValue("highlights.chips", cleaned, { shouldDirty: false, shouldTouch: false });
        }
    }, [getValues, setValue]);

    function writeHighlights(next: string[]) {
        setValue("highlights.chips", dedupeHighlights(next), {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    }

    function toggleHighlight(raw: string) {
        const text = normalizeHighlight(raw);
        if (!text) return;
        const key = highlightKey(text);
        const current = dedupeHighlights(getValues("highlights.chips") ?? []);
        const active = current.some((item) => highlightKey(item) === key);
        if (active) {
            writeHighlights(current.filter((item) => highlightKey(item) !== key));
            return;
        }
        if (current.length >= MAX_HIGHLIGHTS) return;
        writeHighlights([...current, text]);
    }

    function addCustom() {
        if (!canAddCustom) return;
        if (exactInCatalog) {
            const match = catalog.find(
                (option) => option.label.toLowerCase() === trimmedQuery.toLowerCase(),
            );
            if (match) {
                toggleHighlight(match.value);
                setQuery("");
                return;
            }
        }
        toggleHighlight(trimmedQuery);
        setQuery("");
    }

    function clearAll(event?: MouseEvent) {
        event?.preventDefault();
        event?.stopPropagation();
        writeHighlights([]);
    }

    function removeHighlight(value: string, event?: MouseEvent) {
        event?.preventDefault();
        event?.stopPropagation();
        const key = highlightKey(value);
        const current = dedupeHighlights(getValues("highlights.chips") ?? []);
        writeHighlights(current.filter((item) => highlightKey(item) !== key));
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
        return (
            <Button
                type="button"
                variant="outline"
                size="md"
                aria-pressed={removable ? undefined : active}
                aria-label={removable ? `Remove ${option.label}` : undefined}
                onClick={(event) => {
                    if (removable) removeHighlight(option.value, event);
                    else toggleHighlight(option.value);
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
                {option.label}
                {removable ? (
                    <X className="ms-1.5 inline block-3.5 inline-3.5" aria-hidden />
                ) : null}
            </Button>
        );
    }
    */

    return (
        <div className="flex flex-col gap-8">
            {/* Highlights UI temporarily commented out (kept for restore).
            <WizardSection
                title="Why should someone visit?"
                description="Short lines for the listing card. Search, pick defaults, or add your own."
            >
                <div className="flex flex-col gap-4">
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
                                placeholder="Search or add highlight"
                                aria-label="Search or add highlight"
                                className="ps-10"
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        if (
                                            filtered.length === 1 &&
                                            !selectedSet.has(highlightKey(filtered[0].value))
                                        ) {
                                            toggleHighlight(filtered[0].value);
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

                    {highlights.length ? (
                        <div className="space-y-2">
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="text-sm font-semibold text-ink">
                                    Selected · {highlights.length}/{MAX_HIGHLIGHTS}
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
                            <div
                                className="flex flex-wrap gap-2"
                                role="list"
                                aria-label="Selected highlights"
                            >
                                {highlights.map((value) => (
                                    <div key={highlightKey(value)} role="listitem">
                                        <ChipButton
                                            option={{ value, label: value }}
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
                            {fromListingOptions.length ? (
                                <p className="text-sm font-semibold text-ink">From your listing</p>
                            ) : null}
                            {fromListingOptions.length ? (
                                <div
                                    className="mbe-3 flex flex-wrap gap-2"
                                    role="group"
                                    aria-label="Highlights from your listing"
                                >
                                    {fromListingOptions.map((option) => (
                                        <ChipButton
                                            key={highlightKey(option.value)}
                                            option={option}
                                            active={selectedSet.has(highlightKey(option.value))}
                                        />
                                    ))}
                                </div>
                            ) : null}
                            <p className="text-sm font-semibold text-ink">Suggested</p>
                            <div
                                className="flex flex-wrap gap-2"
                                role="group"
                                aria-label="Suggested highlights"
                            >
                                {suggested.map((option) => (
                                    <ChipButton
                                        key={highlightKey(option.value)}
                                        option={option}
                                        active={selectedSet.has(highlightKey(option.value))}
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
                            Add “{trimmedQuery.slice(0, 40)}” as custom
                        </button>
                    ) : null}

                    {browseList.length ? (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-ink">
                                {trimmedQuery ? `Matches · ${browseList.length}` : "More highlights"}
                            </p>
                            <div
                                className="flex flex-wrap gap-2"
                                role="group"
                                aria-label={
                                    trimmedQuery ? "Matching highlights" : "More highlights"
                                }
                            >
                                {browseList.map((option) => (
                                    <ChipButton
                                        key={highlightKey(option.value)}
                                        option={option}
                                        active={selectedSet.has(highlightKey(option.value))}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {trimmedQuery && filtered.length === 0 && !exactInCatalog ? (
                        <p className="text-sm text-ink-muted">
                            No match in the list. Press Add to save your own line.
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
                                {browseAll
                                    ? "Show fewer"
                                    : `Browse all ${catalog.length} highlights`}
                            </Button>
                        </div>
                    ) : null}

                    {highlights.length >= MAX_HIGHLIGHTS ? (
                        <p className="text-sm text-ink-muted">
                            Cap reached ({MAX_HIGHLIGHTS}). Remove one to add another.
                        </p>
                    ) : null}
                </div>
            </WizardSection>
            */}

            {isVisible("construction.possessionType") ||
            isVisible("construction.builderName") ? (
                <WizardSection
                    title="Construction and possession"
                    description="Show the official timeline beside the builder's working promise."
                >
                    <div className="flex flex-col gap-4">
                        <ChoiceField
                            name="construction.possessionType"
                            label="Possession"
                            options={POSSESSION_TYPE_OPTIONS}
                            columns={3}
                        />
                        {isVisible("construction.possessionDate") ? (
                            <TextField
                                name="construction.possessionDate"
                                label="Possession month"
                                type="month"
                                min={new Date().toISOString().slice(0, 7)}
                            />
                        ) : null}
                        <div className={FORM_GRID_CLASS}>
                            <TextField name="construction.builderName" label="Builder name" />
                            <TextField name="construction.projectName" label="Project name" />
                        </div>
                        <div className={FORM_GRID_CLASS}>
                            <SelectField
                                name="construction.paymentPlan"
                                label="Payment plan"
                                options={PAYMENT_PLAN_OPTIONS}
                            />
                            <ToggleField name="construction.bookingOpen" label="Booking open" />
                        </div>
                        {isVisible("construction.paymentSchedule") ? (
                            <div className="space-y-3">
                                {schedule.map((row, index) => (
                                    <div
                                        key={row.id}
                                        className="
                                          grid items-end gap-3 rounded-control border
                                          border-border-warm bg-surface p-3
                                          md:grid-cols-[1fr_0.35fr_0.6fr_auto]
                                        "
                                    >
                                        <TextField
                                            name={`construction.paymentSchedule.${index}.milestone`}
                                            label="Payment milestone"
                                        />
                                        <NumberField
                                            name={`construction.paymentSchedule.${index}.percent`}
                                            label="Percent"
                                            max={100}
                                        />
                                        <TextField
                                            name={`construction.paymentSchedule.${index}.dueOn`}
                                            label="Due on"
                                            type="date"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-lg"
                                            aria-label="Remove payment milestone"
                                            onClick={() =>
                                                setValue(
                                                    "construction.paymentSchedule",
                                                    schedule.filter(
                                                        (_, itemIndex) => itemIndex !== index,
                                                    ),
                                                    { shouldDirty: true },
                                                )
                                            }
                                            className="
                                              flex items-center justify-center rounded-control
                                              border border-border-warm text-danger block-12
                                              inline-12
                                              hover:bg-danger-soft
                                              focus-visible:ring-3 focus-visible:ring-danger/20
                                            "
                                        >
                                            <Trash2 className="block-4 inline-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    onClick={() =>
                                        setValue(
                                            "construction.paymentSchedule",
                                            [
                                                ...schedule,
                                                {
                                                    id: createClientId("payment"),
                                                    milestone: "",
                                                    percent: 0,
                                                    dueOn: "",
                                                },
                                            ],
                                            { shouldDirty: true },
                                        )
                                    }
                                >
                                    <Plus aria-hidden /> Add payment milestone
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </WizardSection>
            ) : null}
        </div>
    );
}
