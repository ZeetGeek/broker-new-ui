"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BedDouble, Building2, Search, Sofa } from "lucide-react";

import {
    extractBandFilters,
    formatBhkLabel,
    formatFurnishingLabel,
    formatPropertyTypeLabel,
} from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import {
    OwnerListingsBandDivider,
    OwnerListingsBandSegment,
} from "@/features/properties/owner-listings/owner-listings-band-segment";
import { OwnerListingsBudgetMenu } from "@/features/properties/owner-listings/owner-listings-budget-menu";
import { OwnerListingsLookingForMenu } from "@/features/properties/owner-listings/owner-listings-looking-for-menu";
import { OwnerListingsWhereMenu } from "@/features/properties/owner-listings/owner-listings-where-menu";
import type {
    OwnerListingFurnishing,
    OwnerListingItem,
    OwnerListingPropertyType,
    OwnerListingsBandFilters,
    OwnerListingsFilters,
} from "@/features/properties/owner-listings/types";
import { OWNER_LISTING_PROPERTY_TYPES } from "@/features/properties/owner-listings/types";

const BHK_OPTIONS = ["1", "2", "3", "4", "5"] as const;

const FURNISHING_OPTIONS: { value: OwnerListingFurnishing; label: string }[] = [
    { value: "furnished", label: "Furnished" },
    { value: "semi", label: "Semi-furnished" },
    { value: "unfurnished", label: "Unfurnished" },
];

export type OwnerListingsSearchBandProps = {
    appliedFilters: OwnerListingsFilters;
    listings: OwnerListingItem[];
    onApplyBand: (band: OwnerListingsBandFilters) => void;
};

export function OwnerListingsSearchBand({
    appliedFilters,
    listings,
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
        setDraft((prev) => {
            const next = { ...prev, ...patch };
            draftRef.current = next;
            return next;
        });
    }, []);

    const setLocationFilters = useCallback((cities: string[], localities: string[]) => {
        setDraft((prev) => {
            const next = { ...prev, cities, localities };
            draftRef.current = next;
            return next;
        });
    }, []);

    const toggleBhk = useCallback((value: string) => {
        setDraft((prev) => {
            const exists = prev.bhk.includes(value);
            const next = {
                ...prev,
                bhk: exists ? prev.bhk.filter((item) => item !== value) : [...prev.bhk, value],
            };
            draftRef.current = next;
            return next;
        });
    }, []);

    const handleSearch = useCallback(() => {
        onApplyBand(draftRef.current);
    }, [onApplyBand]);

    const handleWhereOpenChange = useCallback(
        (open: boolean) => {
            if (open) return;

            const current = draftRef.current;
            const applied = extractBandFilters(appliedFilters);
            const locationChanged =
                current.cities.join("|") !== applied.cities.join("|") ||
                current.localities.join("|") !== applied.localities.join("|");

            if (locationChanged) {
                onApplyBand(current);
            }
        },
        [appliedFilters, onApplyBand],
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
                        selectedCities={draft.cities}
                        selectedLocalities={draft.localities}
                        onLocationChange={setLocationFilters}
                        onOpenChange={handleWhereOpenChange}
                        className="inline-full"
                    />
                </div>

                <OwnerListingsBandDivider className="hidden md:block" />

                <div className="hidden flex-1 p-0.5 min-inline-0 min-inline-32 md:block">
                    <OwnerListingsLookingForMenu
                        value={draft.type}
                        onValueChange={(type) => updateDraft({ type })}
                        className="inline-full"
                    />
                </div>

                <OwnerListingsBandDivider className="hidden md:block" />

                <div className="flex flex-1 p-0.5 min-inline-0 min-inline-36">
                    <OwnerListingsBudgetMenu
                        min={draft.min}
                        max={draft.max}
                        onBudgetChange={({ min, max }) => updateDraft({ min, max })}
                        className="inline-full"
                    />
                </div>

                <OwnerListingsBandDivider className="hidden md:block" />

                <div className="hidden flex-1 p-0.5 min-inline-28 md:block">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <OwnerListingsBandSegment
                                    label="BHK"
                                    icon={BedDouble}
                                    value={formatBhkLabel(draft.bhk)}
                                    className="inline-full"
                                />
                            }
                        />
                        <DropdownMenuContent
                            align="start"
                            sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                            className={cn(OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS, "min-inline-44")}
                        >
                            {BHK_OPTIONS.map((value) => (
                                <DropdownMenuCheckboxItem
                                    key={value}
                                    checked={draft.bhk.includes(value)}
                                    onCheckedChange={() => toggleBhk(value)}
                                >
                                    {value} BHK
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <OwnerListingsBandDivider className="hidden lg:block" />

                <div className="hidden flex-1 p-0.5 min-inline-32 lg:block">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <OwnerListingsBandSegment
                                    label="Property type"
                                    icon={Building2}
                                    value={formatPropertyTypeLabel(draft.propertyType)}
                                    className="inline-full"
                                />
                            }
                        />
                        <DropdownMenuContent
                            align="start"
                            sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                            className={cn(OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS, "min-inline-48")}
                        >
                            <DropdownMenuItem onClick={() => updateDraft({ propertyType: "" })}>
                                Any type
                            </DropdownMenuItem>
                            {OWNER_LISTING_PROPERTY_TYPES.map((option) => (
                                <DropdownMenuItem
                                    key={option.value}
                                    onClick={() =>
                                        updateDraft({
                                            propertyType: option.value as OwnerListingPropertyType,
                                        })
                                    }
                                >
                                    {option.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <OwnerListingsBandDivider className="hidden lg:block" />

                <div className="hidden flex-1 p-0.5 min-inline-36 lg:block">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <OwnerListingsBandSegment
                                    label="Furnishing"
                                    icon={Sofa}
                                    value={formatFurnishingLabel(draft.furnishing)}
                                    className="inline-full"
                                />
                            }
                        />
                        <DropdownMenuContent
                            align="start"
                            sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                            className={cn(OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS, "min-inline-48")}
                        >
                            <DropdownMenuItem onClick={() => updateDraft({ furnishing: "" })}>
                                Any
                            </DropdownMenuItem>
                            {FURNISHING_OPTIONS.map((option) => (
                                <DropdownMenuItem
                                    key={option.value}
                                    onClick={() => updateDraft({ furnishing: option.value })}
                                >
                                    {option.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex shrink-0 items-center ps-2 pe-4">
                <Button
                    type="button"
                    size="icon-md"
                    variant="accent"
                    className="rounded-full"
                    aria-label="Search properties"
                    onClick={handleSearch}
                >
                    <Search aria-hidden strokeWidth={1.75} />
                </Button>
            </div>
        </div>
    );
}
