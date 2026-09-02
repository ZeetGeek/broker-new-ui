"use client";

import { useCallback, useEffect, useState } from "react";

import { BedDouble, Building2, IndianRupee, MapPin, Search, Sofa, Tags } from "lucide-react";

import {
    extractBandFilters,
    formatBudgetLabel,
    formatBhkLabel,
    formatFurnishingLabel,
    formatLocalitiesLabel,
    formatPropertyTypeLabel,
    formatTransactionTypeLabel,
} from "@/lib/format/owner-listings-labels";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    OwnerListingsBandDivider,
    OwnerListingsBandSegment,
} from "@/features/properties/owner-listings/owner-listings-band-segment";
import type {
    OwnerListingFurnishing,
    OwnerListingPropertyType,
    OwnerListingsBandFilters,
    OwnerListingsFilters,
} from "@/features/properties/owner-listings/types";
import { OWNER_LISTING_PROPERTY_TYPES } from "@/features/properties/owner-listings/types";

const BHK_OPTIONS = ["1", "2", "3", "4", "5"] as const;

const BUDGET_PRESETS = [
    { min: "", max: "2500000", label: "Under ₹25 L" },
    { min: "", max: "5000000", label: "Under ₹50 L" },
    { min: "", max: "10000000", label: "Under ₹1 Cr" },
    { min: "", max: "20000000", label: "Under ₹2 Cr" },
    { min: "", max: "50000000", label: "Under ₹5 Cr" },
    { min: "4000000", max: "6000000", label: "₹40 L – ₹60 L" },
    { min: "10000000", max: "20000000", label: "₹1 Cr – ₹2 Cr" },
    { min: "20000000", max: "", label: "₹2 Cr+" },
] as const;

const FURNISHING_OPTIONS: { value: OwnerListingFurnishing; label: string }[] = [
    { value: "furnished", label: "Furnished" },
    { value: "semi", label: "Semi-furnished" },
    { value: "unfurnished", label: "Unfurnished" },
];

export type OwnerListingsSearchBandProps = {
    appliedFilters: OwnerListingsFilters;
    localityOptions: string[];
    onApplyBand: (band: OwnerListingsBandFilters) => void;
};

export function OwnerListingsSearchBand({
    appliedFilters,
    localityOptions,
    onApplyBand,
}: OwnerListingsSearchBandProps) {
    const [draft, setDraft] = useState(() => extractBandFilters(appliedFilters));

    useEffect(() => {
        setDraft(extractBandFilters(appliedFilters));
    }, [appliedFilters]);

    const updateDraft = useCallback((patch: Partial<OwnerListingsBandFilters>) => {
        setDraft((prev) => ({ ...prev, ...patch }));
    }, []);

    const toggleLocality = useCallback((locality: string) => {
        setDraft((prev) => {
            const exists = prev.localities.includes(locality);
            return {
                ...prev,
                localities: exists
                    ? prev.localities.filter((item) => item !== locality)
                    : [...prev.localities, locality],
            };
        });
    }, []);

    const toggleBhk = useCallback((value: string) => {
        setDraft((prev) => {
            const exists = prev.bhk.includes(value);
            return {
                ...prev,
                bhk: exists ? prev.bhk.filter((item) => item !== value) : [...prev.bhk, value],
            };
        });
    }, []);

    const handleSearch = useCallback(() => {
        onApplyBand(draft);
    }, [draft, onApplyBand]);

    return (
        <div className="flex items-center gap-2 rounded-card border border-border-warm bg-surface p-2 shadow-sm">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
                <div className="flex min-w-0 min-inline-36 flex-1 p-0.5">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <OwnerListingsBandSegment
                                    label="Where"
                                    icon={MapPin}
                                    value={formatLocalitiesLabel(draft.localities)}
                                    className="w-full"
                                />
                            }
                        />
                        <DropdownMenuContent align="start" className="min-inline-56">
                            {localityOptions.map((locality) => (
                                <DropdownMenuCheckboxItem
                                    key={locality}
                                    checked={draft.localities.includes(locality)}
                                    onCheckedChange={() => toggleLocality(locality)}
                                >
                                    {locality}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <OwnerListingsBandDivider className="hidden md:block" />

                <div className="hidden min-w-0 min-inline-32 flex-1 p-0.5 md:block">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <OwnerListingsBandSegment
                                    label="Looking for"
                                    icon={Tags}
                                    value={formatTransactionTypeLabel(draft.type)}
                                    className="w-full"
                                />
                            }
                        />
                        <DropdownMenuContent align="start" className="min-inline-44">
                            <DropdownMenuItem onClick={() => updateDraft({ type: "" })}>Any</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateDraft({ type: "sale" })}>Sale</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateDraft({ type: "rent" })}>Rent</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <OwnerListingsBandDivider className="hidden md:block" />

                <div className="flex min-w-0 min-inline-36 flex-1 p-0.5">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <OwnerListingsBandSegment
                                    label="Budget"
                                    icon={IndianRupee}
                                    value={formatBudgetLabel(draft.min, draft.max)}
                                    className="w-full"
                                />
                            }
                        />
                        <DropdownMenuContent align="start" className="min-inline-52">
                            <DropdownMenuItem onClick={() => updateDraft({ min: "", max: "" })}>
                                Any budget
                            </DropdownMenuItem>
                            {BUDGET_PRESETS.map((preset) => (
                                <DropdownMenuItem
                                    key={preset.label}
                                    onClick={() => updateDraft({ min: preset.min, max: preset.max })}
                                >
                                    {preset.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <OwnerListingsBandDivider className="hidden md:block" />

                <div className="hidden min-w-0 min-inline-28 flex-1 p-0.5 md:block">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <OwnerListingsBandSegment
                                    label="BHK"
                                    icon={BedDouble}
                                    value={formatBhkLabel(draft.bhk)}
                                    className="w-full"
                                />
                            }
                        />
                        <DropdownMenuContent align="start" className="min-inline-44">
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

                <div className="hidden min-w-0 min-inline-32 flex-1 p-0.5 lg:block">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <OwnerListingsBandSegment
                                    label="Property type"
                                    icon={Building2}
                                    value={formatPropertyTypeLabel(draft.propertyType)}
                                    className="w-full"
                                />
                            }
                        />
                        <DropdownMenuContent align="start" className="min-inline-48">
                            <DropdownMenuItem onClick={() => updateDraft({ propertyType: "" })}>
                                Any type
                            </DropdownMenuItem>
                            {OWNER_LISTING_PROPERTY_TYPES.map((option) => (
                                <DropdownMenuItem
                                    key={option.value}
                                    onClick={() =>
                                        updateDraft({ propertyType: option.value as OwnerListingPropertyType })
                                    }
                                >
                                    {option.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <OwnerListingsBandDivider className="hidden lg:block" />

                <div className="hidden min-w-0 min-inline-36 flex-1 p-0.5 lg:block">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <OwnerListingsBandSegment
                                    label="Furnishing"
                                    icon={Sofa}
                                    value={formatFurnishingLabel(draft.furnishing)}
                                    className="w-full"
                                />
                            }
                        />
                        <DropdownMenuContent align="start" className="min-inline-48">
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

            <div className="flex shrink-0 items-center pe-1">
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
