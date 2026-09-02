"use client";

import { useEffect, useMemo, useState } from "react";

import { Search } from "lucide-react";

import { filterOwnerListings } from "@/features/properties/owner-listings/filter-owner-listings";
import { MOCK_OWNER_LISTINGS } from "@/features/properties/owner-listings/mock-owner-listings";
import { extractSheetFilters } from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import type {
    OwnerListingFurnishing,
    OwnerListingPropertyType,
    OwnerListingsFilterContext,
    OwnerListingsFilters,
} from "@/features/properties/owner-listings/types";
import {
    OWNER_LISTING_PROPERTY_TYPES,
} from "@/features/properties/owner-listings/types";

const BHK_OPTIONS = ["1", "2", "3", "4", "5"] as const;

const FURNISHING_OPTIONS: { value: OwnerListingFurnishing; label: string }[] = [
    { value: "furnished", label: "Furnished" },
    { value: "semi", label: "Semi-furnished" },
    { value: "unfurnished", label: "Unfurnished" },
];

export type OwnerListingsFilterSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appliedFilters: OwnerListingsFilters;
    filterContext: OwnerListingsFilterContext;
    includeTypeAndBhk: boolean;
    onApply: (patch: Partial<OwnerListingsFilters>) => void;
};

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3">
            <p className="eyebrow">{title}</p>
            {children}
        </div>
    );
}

function OptionRow({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-3 py-1">
            <Checkbox checked={checked} onCheckedChange={onChange} />
            <span className="body-sm text-ink">{label}</span>
        </label>
    );
}

export function OwnerListingsFilterSheet({
    open,
    onOpenChange,
    appliedFilters,
    filterContext,
    includeTypeAndBhk,
    onApply,
}: OwnerListingsFilterSheetProps) {
    const [draft, setDraft] = useState(() => extractSheetFilters(appliedFilters));

    useEffect(() => {
        if (open) {
            setDraft(extractSheetFilters(appliedFilters));
        }
    }, [appliedFilters, open]);

    const previewCount = useMemo(() => {
        const merged: OwnerListingsFilters = {
            ...appliedFilters,
            ...draft,
        };
        return filterOwnerListings(MOCK_OWNER_LISTINGS, merged, filterContext).totalCount;
    }, [appliedFilters, draft, filterContext]);

    const updateDraft = (patch: Partial<typeof draft>) => {
        setDraft((prev) => ({ ...prev, ...patch }));
    };

    const toggleBhk = (value: string) => {
        setDraft((prev) => {
            const exists = prev.bhk.includes(value);
            return {
                ...prev,
                bhk: exists ? prev.bhk.filter((item) => item !== value) : [...prev.bhk, value],
            };
        });
    };

    const handleApply = () => {
        onApply(draft);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup
                className={cn(
                    `
                      inset-s-auto inset-bs-0 max-inline-full translate-x-0 translate-y-0
                      rounded-none border-be-0 border-is-0 p-0
                      md:inset-bs-0 md:inset-e-0 md:max-inline-md md:rounded-s-3xl
                    `,
                )}
            >
                <div className="flex max-h-[100dvh] flex-col">
                    <DialogHeader className="border-be border-border-warm px-6 py-5 text-start">
                        <DialogTitle>Filters</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
                        <FilterSection title="Search">
                            <Input
                                size="lg"
                                value={draft.q}
                                onChange={(event) => updateDraft({ q: event.target.value })}
                                placeholder="Locality, society, or config"
                                aria-label="Search owner listings"
                                startIcon={Search}
                                clearable
                            />
                        </FilterSection>

                        {includeTypeAndBhk ? (
                            <>
                                <FilterSection title="Looking for">
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: "", label: "Any" },
                                            { value: "sale", label: "Sale" },
                                            { value: "rent", label: "Rent" },
                                        ].map((option) => (
                                            <Button
                                                key={option.label}
                                                type="button"
                                                size="sm"
                                                variant={
                                                    draft.type === option.value ? "default" : "outline"
                                                }
                                                className={cn(
                                                    "rounded-full",
                                                    draft.type === option.value
                                                        ? "bg-brand-ink text-surface hover:bg-brand-ink/90"
                                                        : "border-border-warm bg-surface text-ink-muted",
                                                )}
                                                onClick={() =>
                                                    updateDraft({
                                                        type: option.value as OwnerListingsFilters["type"],
                                                    })
                                                }
                                            >
                                                {option.label}
                                            </Button>
                                        ))}
                                    </div>
                                </FilterSection>

                                <FilterSection title="BHK">
                                    <div className="flex flex-col">
                                        {BHK_OPTIONS.map((value) => (
                                            <OptionRow
                                                key={value}
                                                label={`${value} BHK`}
                                                checked={draft.bhk.includes(value)}
                                                onChange={() => toggleBhk(value)}
                                            />
                                        ))}
                                    </div>
                                </FilterSection>
                            </>
                        ) : null}

                        <FilterSection title="Property type">
                            <div className="flex flex-col">
                                <OptionRow
                                    label="Any type"
                                    checked={!draft.propertyType}
                                    onChange={() => updateDraft({ propertyType: "" })}
                                />
                                {OWNER_LISTING_PROPERTY_TYPES.map((option) => (
                                    <OptionRow
                                        key={option.value}
                                        label={option.label}
                                        checked={draft.propertyType === option.value}
                                        onChange={() =>
                                            updateDraft({
                                                propertyType:
                                                    draft.propertyType === option.value
                                                        ? ""
                                                        : option.value,
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        </FilterSection>

                        <FilterSection title="Furnishing">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={!draft.furnishing ? "default" : "outline"}
                                    className={cn(
                                        "rounded-full",
                                        !draft.furnishing
                                            ? "bg-brand-ink text-surface hover:bg-brand-ink/90"
                                            : "border-border-warm bg-surface text-ink-muted",
                                    )}
                                    onClick={() => updateDraft({ furnishing: "" })}
                                >
                                    Any
                                </Button>
                                {FURNISHING_OPTIONS.map((option) => (
                                    <Button
                                        key={option.value}
                                        type="button"
                                        size="sm"
                                        variant={draft.furnishing === option.value ? "default" : "outline"}
                                        className={cn(
                                            "rounded-full",
                                            draft.furnishing === option.value
                                                ? "bg-brand-ink text-surface hover:bg-brand-ink/90"
                                                : "border-border-warm bg-surface text-ink-muted",
                                        )}
                                        onClick={() => updateDraft({ furnishing: option.value })}
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        </FilterSection>
                    </div>

                    <div className="border-be border-border-warm px-6 py-4">
                        <Button
                            type="button"
                            size="lg"
                            className="w-full bg-brand-ink text-surface hover:bg-brand-ink/90"
                            onClick={handleApply}
                        >
                            Show {previewCount} properties
                        </Button>
                    </div>
                </div>
            </DialogPopup>
        </Dialog>
    );
}
