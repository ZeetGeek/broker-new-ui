"use client";

import { useState } from "react";

import { Armchair, Check, Layers, PackageOpen, Sofa, type LucideIcon } from "lucide-react";

import { formatFurnishingLabel } from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
    OWNER_LISTINGS_BAND_MENU_WIDTH_CLASS,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import { OwnerListingsBandMenuHeader } from "@/features/properties/owner-listings/owner-listings-band-menu-header";
import { OwnerListingsBandSegment } from "@/features/properties/owner-listings/owner-listings-band-segment";
import type { OwnerListingFurnishing } from "@/features/properties/owner-listings/types";

type FurnishingValue = OwnerListingFurnishing | "";

const FURNISHING_OPTIONS: {
    value: FurnishingValue;
    label: string;
    description: string;
    icon: LucideIcon;
}[] = [
    {
        value: "",
        label: "Any",
        description: "All furnishing levels",
        icon: Layers,
    },
    {
        value: "furnished",
        label: "Furnished",
        description: "Fully ready to move in",
        icon: Sofa,
    },
    {
        value: "semi",
        label: "Semi-furnished",
        description: "Basics like fans and lights",
        icon: Armchair,
    },
    {
        value: "unfurnished",
        label: "Unfurnished",
        description: "Empty shell, bring your own",
        icon: PackageOpen,
    },
];

export type OwnerListingsFurnishingMenuProps = {
    value: FurnishingValue;
    onValueChange: (value: FurnishingValue) => void;
    className?: string;
};

export function OwnerListingsFurnishingMenu({
    value,
    onValueChange,
    className,
}: OwnerListingsFurnishingMenuProps) {
    const [open, setOpen] = useState(false);

    const handleSelect = (next: FurnishingValue) => {
        onValueChange(next);
        setOpen(false);
    };

    return (
        <div className={cn("min-w-0 w-full", className)}>
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                className="flex min-w-0 w-full"
                render={
                    <OwnerListingsBandSegment
                        label="Furnishing"
                        icon={Sofa}
                        value={formatFurnishingLabel(value)}
                        className="w-full"
                        isOpen={open}
                    />
                }
            />
            <DropdownMenuContent
                align="center"
                sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                className={cn(
                    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
                    OWNER_LISTINGS_BAND_MENU_WIDTH_CLASS,
                    "overflow-hidden! p-0",
                )}
            >
                <div className="flex flex-col gap-3 px-3 py-3">
                    <OwnerListingsBandMenuHeader
                        description="How ready is the home"
                        onClear={() => handleSelect("")}
                        className="px-2 pt-1"
                    />

                    <div
                        className="flex flex-col gap-1"
                        role="radiogroup"
                        aria-label="Furnishing"
                    >
                        {FURNISHING_OPTIONS.map((option) => {
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
                                              block-5 inline-5
                                              transition-[opacity,transform,background-color]
                                              duration-160
                                            `,
                                            active
                                                ? "scale-100 bg-brand text-surface opacity-100"
                                                : "scale-75 opacity-0",
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
        </div>
    );
}
