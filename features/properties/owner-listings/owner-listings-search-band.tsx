"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { extractBandFilters } from "@/lib/format/owner-listings-labels";

import { OwnerListingsBandDivider } from "@/features/properties/owner-listings/owner-listings-band-segment";
import { OwnerListingsBhkMenu } from "@/features/properties/owner-listings/owner-listings-bhk-menu";
import { OwnerListingsBudgetMenu } from "@/features/properties/owner-listings/owner-listings-budget-menu";
import { OwnerListingsFurnishingMenu } from "@/features/properties/owner-listings/owner-listings-furnishing-menu";
import { OwnerListingsLookingForMenu } from "@/features/properties/owner-listings/owner-listings-looking-for-menu";
import { OwnerListingsPropertyTypeMenu } from "@/features/properties/owner-listings/owner-listings-property-type-menu";
import { OwnerListingsWhereMenu } from "@/features/properties/owner-listings/owner-listings-where-menu";
import type {
    OwnerListingItem,
    OwnerListingsBandFilters,
    OwnerListingsFilters,
} from "@/features/properties/owner-listings/types";

export type OwnerListingsSearchBandProps = {
    appliedFilters: OwnerListingsFilters;
    listings: OwnerListingItem[];
    serviceAreas?: string[];
    onApplyBand: (band: OwnerListingsBandFilters) => void;
};

function bandSignature(band: OwnerListingsBandFilters): string {
    return [
        band.countries.join(","),
        band.states.join(","),
        band.cities.join(","),
        band.localities.join(","),
        band.yourAreas ? "1" : "0",
        band.bhk.join(","),
        band.type,
        band.min,
        band.max,
        band.propertyType,
        band.furnishing,
    ].join("|");
}

export function OwnerListingsSearchBand({
    appliedFilters,
    listings,
    serviceAreas = [],
    onApplyBand,
}: OwnerListingsSearchBandProps) {
    const [draft, setDraft] = useState(() => extractBandFilters(appliedFilters));
    const draftRef = useRef(draft);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const next = extractBandFilters(appliedFilters);
            draftRef.current = next;
            setDraft(next);
        }, 0);
        return () => window.clearTimeout(timer);
    }, [appliedFilters]);

    const updateDraft = useCallback((patch: Partial<OwnerListingsBandFilters>) => {
        const next = { ...draftRef.current, ...patch };
        draftRef.current = next;
        setDraft(next);
    }, []);

    const setWhereFilters = useCallback(
        (next: {
            countries: string[];
            states: string[];
            cities: string[];
            localities: string[];
            yourAreas: boolean;
        }) => {
            const updated = {
                ...draftRef.current,
                countries: next.countries,
                states: next.states,
                cities: next.cities,
                localities: next.localities,
                yourAreas: next.yourAreas,
            };
            draftRef.current = updated;
            setDraft(updated);
        },
        [],
    );

    const toggleBhk = useCallback((value: string) => {
        const prev = draftRef.current;
        const exists = prev.bhk.includes(value);
        const next = {
            ...prev,
            bhk: exists ? prev.bhk.filter((item) => item !== value) : [...prev.bhk, value],
        };
        draftRef.current = next;
        setDraft(next);
    }, []);

    const clearBhk = useCallback(() => {
        const next = { ...draftRef.current, bhk: [] as string[] };
        draftRef.current = next;
        setDraft(next);
    }, []);

    const applyDraftIfChanged = useCallback(() => {
        const current = draftRef.current;
        const applied = extractBandFilters(appliedFilters);
        if (bandSignature(current) !== bandSignature(applied)) {
            onApplyBand(current);
        }
    }, [appliedFilters, onApplyBand]);

    const handleMenuOpenChange = useCallback(
        (open: boolean) => {
            if (!open) {
                applyDraftIfChanged();
            }
        },
        [applyDraftIfChanged],
    );

    return (
        <div
            className="
              flex items-center gap-2 rounded-card border border-border-warm bg-surface p-2
              shadow-sm
            "
        >
            <div className="flex flex-1 items-center gap-1.5 overflow-x-auto min-inline-0">
                <div className="flex flex-1 p-0.5 min-inline-36">
                    <OwnerListingsWhereMenu
                        listings={listings}
                        selectedCountries={draft.countries}
                        selectedStates={draft.states}
                        selectedCities={draft.cities}
                        selectedLocalities={draft.localities}
                        yourAreas={draft.yourAreas}
                        serviceAreas={serviceAreas}
                        onWhereChange={setWhereFilters}
                        onCommit={applyDraftIfChanged}
                        onOpenChange={handleMenuOpenChange}
                        className="inline-full"
                    />
                </div>

                <OwnerListingsBandDivider className="hidden md:block" />

                <div className="hidden flex-1 p-0.5 min-inline-32 md:block">
                    <OwnerListingsLookingForMenu
                        value={draft.type}
                        onValueChange={(type) => {
                            const budgetNeedsReset =
                                (draft.type === "rent") !== (type === "rent") &&
                                (Boolean(draft.min) || Boolean(draft.max));
                            updateDraft(budgetNeedsReset ? { type, min: "", max: "" } : { type });
                        }}
                        onCommit={applyDraftIfChanged}
                        onOpenChange={handleMenuOpenChange}
                        className="inline-full"
                    />
                </div>

                <OwnerListingsBandDivider className="hidden md:block" />

                <div className="flex flex-1 p-0.5 min-inline-36">
                    <OwnerListingsBudgetMenu
                        min={draft.min}
                        max={draft.max}
                        lookingFor={draft.type}
                        onBudgetChange={({ min, max }) => updateDraft({ min, max })}
                        onCommit={applyDraftIfChanged}
                        onOpenChange={handleMenuOpenChange}
                        className="inline-full"
                    />
                </div>

                <OwnerListingsBandDivider className="hidden md:block" />

                <div className="hidden flex-1 p-0.5 min-inline-28 md:block">
                    <OwnerListingsBhkMenu
                        value={draft.bhk}
                        onToggle={toggleBhk}
                        onClear={clearBhk}
                        onCommit={applyDraftIfChanged}
                        onOpenChange={handleMenuOpenChange}
                        className="inline-full"
                    />
                </div>

                <OwnerListingsBandDivider className="hidden lg:block" />

                <div className="hidden flex-1 p-0.5 min-inline-32 lg:block">
                    <OwnerListingsPropertyTypeMenu
                        value={draft.propertyType}
                        onValueChange={(propertyType) => updateDraft({ propertyType })}
                        onCommit={applyDraftIfChanged}
                        onOpenChange={handleMenuOpenChange}
                        className="inline-full"
                    />
                </div>

                <OwnerListingsBandDivider className="hidden lg:block" />

                <div className="hidden flex-1 p-0.5 min-inline-36 lg:block">
                    <OwnerListingsFurnishingMenu
                        value={draft.furnishing}
                        onValueChange={(furnishing) => updateDraft({ furnishing })}
                        onCommit={applyDraftIfChanged}
                        onOpenChange={handleMenuOpenChange}
                        className="inline-full"
                    />
                </div>
            </div>
        </div>
    );
}
