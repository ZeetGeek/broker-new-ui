"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { extractBandFilters } from "@/lib/format/owner-listings-labels";

import { X } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { stripHiddenOwnerListingsFilters } from "@/features/properties/owner-listings/filter-visibility";
import { OwnerListingsAreaMenu } from "@/features/properties/owner-listings/owner-listings-area-menu";
import { OwnerListingsBandDivider } from "@/features/properties/owner-listings/owner-listings-band-segment";
import { OwnerListingsBudgetMenu } from "@/features/properties/owner-listings/owner-listings-budget-menu";
import { OwnerListingsCategoryMenu } from "@/features/properties/owner-listings/owner-listings-category-menu";
import { OwnerListingsLookingForMenu } from "@/features/properties/owner-listings/owner-listings-looking-for-menu";
import { OwnerListingsPropertyTypeMenu } from "@/features/properties/owner-listings/owner-listings-property-type-menu";
import { OwnerListingsWhereMenu } from "@/features/properties/owner-listings/owner-listings-where-menu";
import {
    DEFAULT_OWNER_LISTINGS_FILTERS,
    type OwnerListingItem,
    type OwnerListingsBandFilters,
    type OwnerListingsFilters,
} from "@/features/properties/owner-listings/types";

const EMPTY_BAND_FILTERS = extractBandFilters(DEFAULT_OWNER_LISTINGS_FILTERS);

export type OwnerListingsSearchBandProps = {
    appliedFilters: OwnerListingsFilters;
    /** Location tree stubs for the Where menu. */
    listings: OwnerListingItem[];
    locationsLoading?: boolean;
    locationsError?: boolean;
    onRetryLocations?: () => void;
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
        band.type,
        band.min,
        band.max,
        band.minAreaSqft,
        band.maxAreaSqft,
        band.category,
        band.propertyType,
    ].join("|");
}

export function OwnerListingsSearchBand({
    appliedFilters,
    listings,
    locationsLoading,
    locationsError,
    onRetryLocations,
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

    const hasBandFilters = bandSignature(draft) !== bandSignature(EMPTY_BAND_FILTERS);

    const clearAllBandFilters = useCallback(() => {
        const next = extractBandFilters(DEFAULT_OWNER_LISTINGS_FILTERS);
        draftRef.current = next;
        setDraft(next);
        onApplyBand(next);
    }, [onApplyBand]);

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
                        isLoading={locationsLoading}
                        hasError={locationsError}
                        onRetry={onRetryLocations}
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

                <div className="hidden flex-1 p-0.5 min-inline-32 md:block">
                    <OwnerListingsAreaMenu
                        minAreaSqft={draft.minAreaSqft}
                        maxAreaSqft={draft.maxAreaSqft}
                        onAreaChange={({ minAreaSqft, maxAreaSqft }) =>
                            updateDraft({ minAreaSqft, maxAreaSqft })
                        }
                        onCommit={applyDraftIfChanged}
                        onOpenChange={handleMenuOpenChange}
                        className="inline-full"
                    />
                </div>

                <OwnerListingsBandDivider className="hidden md:block" />

                <div className="hidden flex-1 p-0.5 min-inline-32 md:block">
                    <OwnerListingsCategoryMenu
                        value={draft.category}
                        onValueChange={(category) => {
                            const stripped = stripHiddenOwnerListingsFilters({
                                ...DEFAULT_OWNER_LISTINGS_FILTERS,
                                ...draft,
                                category,
                            });
                            updateDraft({
                                category: stripped.category,
                                propertyType: stripped.propertyType,
                            });
                        }}
                        onCommit={applyDraftIfChanged}
                        onOpenChange={handleMenuOpenChange}
                        className="inline-full"
                    />
                </div>

                <OwnerListingsBandDivider className="hidden lg:block" />

                <div className="hidden flex-1 p-0.5 min-inline-32 lg:block">
                    <OwnerListingsPropertyTypeMenu
                        value={draft.propertyType}
                        category={draft.category}
                        onValueChange={(propertyType) => updateDraft({ propertyType })}
                        onCommit={applyDraftIfChanged}
                        onOpenChange={handleMenuOpenChange}
                        className="inline-full"
                    />
                </div>
            </div>

            {hasBandFilters ? (
                <>
                    <OwnerListingsBandDivider />
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={clearAllBandFilters}
                        aria-label="Reset top bar filters"
                        className="shrink-0 gap-1.5 px-5 text-brand hover:text-brand"
                    >
                        <X aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                        Reset filter
                    </Button>
                </>
            ) : null}
        </div>
    );
}
