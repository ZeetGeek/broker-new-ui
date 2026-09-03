"use client";

import { useState } from "react";

import {
    Briefcase,
    Building2,
    Check,
    Home,
    Hotel,
    LandPlot,
    Layers,
    Store,
    type LucideIcon,
} from "lucide-react";

import { formatPropertyTypeLabel } from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import { OwnerListingsBandSegment } from "@/features/properties/owner-listings/owner-listings-band-segment";
import type { OwnerListingPropertyType } from "@/features/properties/owner-listings/types";

type PropertyTypeValue = OwnerListingPropertyType | "";

const PROPERTY_TYPE_OPTIONS: {
    value: PropertyTypeValue;
    label: string;
    description: string;
    icon: LucideIcon;
}[] = [
    {
        value: "",
        label: "Any type",
        description: "All residential and commercial",
        icon: Layers,
    },
    {
        value: "apartment",
        label: "Apartment",
        description: "Flats in a building",
        icon: Building2,
    },
    {
        value: "villa",
        label: "Villa",
        description: "Independent house",
        icon: Home,
    },
    {
        value: "penthouse",
        label: "Penthouse",
        description: "Top-floor luxury",
        icon: Hotel,
    },
    {
        value: "shop",
        label: "Shop",
        description: "Retail space",
        icon: Store,
    },
    {
        value: "office",
        label: "Office",
        description: "Workspaces",
        icon: Briefcase,
    },
    {
        value: "plot",
        label: "Plot",
        description: "Land ready to build",
        icon: LandPlot,
    },
];

export type OwnerListingsPropertyTypeMenuProps = {
    value: PropertyTypeValue;
    onValueChange: (value: PropertyTypeValue) => void;
    className?: string;
};

export function OwnerListingsPropertyTypeMenu({
    value,
    onValueChange,
    className,
}: OwnerListingsPropertyTypeMenuProps) {
    const [open, setOpen] = useState(false);
    const hasSelection = value !== "";

    const handleSelect = (next: PropertyTypeValue) => {
        onValueChange(next);
        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                render={
                    <OwnerListingsBandSegment
                        label="Property type"
                        icon={Building2}
                        value={formatPropertyTypeLabel(value)}
                        className={className}
                        isOpen={open}
                    />
                }
            />
            <DropdownMenuContent
                align="start"
                sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                className={cn(
                    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
                    // Beat base `inline-(--anchor-width)` so labels never clip.
                    "inline-80! min-inline-80! max-inline-96 overflow-hidden! p-0",
                )}
            >
                <div className="flex flex-col gap-3 px-3 py-3">
                    <div className="flex items-start justify-between gap-3 px-2 pt-1">
                        <div className="flex flex-col gap-0.5">
                            <p className="body-xs font-semibold tracking-[0.08em] text-ink-muted uppercase">
                                Property type
                            </p>
                            <p className="body-sm text-ink-muted">Choose a category</p>
                        </div>
                        {hasSelection ? (
                            <button
                                type="button"
                                onClick={() => handleSelect("")}
                                className="
                                  body-xs shrink-0 rounded-full px-2.5 py-1 font-medium text-brand
                                  outline-none transition-colors duration-160
                                  hover:bg-brand-soft
                                  focus-visible:ring-2 focus-visible:ring-brand
                                "
                            >
                                Clear
                            </button>
                        ) : null}
                    </div>

                    <div
                        className="flex flex-col gap-1"
                        role="radiogroup"
                        aria-label="Property type"
                    >
                        {PROPERTY_TYPE_OPTIONS.map((option) => {
                            const active = value === option.value;
                            const Icon = option.icon;

                            return (
                                <button
                                    key={option.label}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        `
                                          group/row flex w-full items-center gap-3 rounded-2xl
                                          border px-3 py-3 text-start outline-none
                                          transition-[background-color,border-color,box-shadow,transform]
                                          duration-160
                                          focus-visible:ring-2 focus-visible:ring-brand
                                          active:scale-[0.99]
                                        `,
                                        active
                                            ? `
                                              border-brand bg-brand-soft shadow-sm
                                              ring-1 ring-brand/15
                                            `
                                            : `
                                              border-transparent
                                              hover:border-border-warm hover:bg-surface-muted/70
                                            `,
                                    )}
                                >
                                    <span
                                        className={cn(
                                            `
                                              flex shrink-0 items-center justify-center rounded-xl
                                              border block-10 inline-10 transition-colors
                                              duration-160
                                            `,
                                            active
                                                ? "border-brand/25 bg-surface text-brand"
                                                : `
                                                  border-border-warm bg-surface-muted/60
                                                  text-ink-subtle
                                                  group-hover/row:text-brand
                                                `,
                                        )}
                                    >
                                        <Icon
                                            aria-hidden
                                            className="block-4.5 inline-4.5"
                                            strokeWidth={1.75}
                                        />
                                    </span>

                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span
                                            className={cn(
                                                "body-sm font-semibold leading-snug",
                                                active ? "text-brand-text" : "text-ink",
                                            )}
                                        >
                                            {option.label}
                                        </span>
                                        <span
                                            className={cn(
                                                "text-[13px] leading-snug",
                                                active ? "text-brand-text/65" : "text-ink-muted",
                                            )}
                                        >
                                            {option.description}
                                        </span>
                                    </span>

                                    <span
                                        className={cn(
                                            `
                                              flex shrink-0 items-center justify-center rounded-full
                                              block-5 inline-5 transition-[opacity,transform,background-color]
                                              duration-160
                                            `,
                                            active
                                                ? "bg-brand text-surface opacity-100 scale-100"
                                                : "opacity-0 scale-75",
                                        )}
                                        aria-hidden
                                    >
                                        <Check className="block-3 inline-3" strokeWidth={2.5} />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
