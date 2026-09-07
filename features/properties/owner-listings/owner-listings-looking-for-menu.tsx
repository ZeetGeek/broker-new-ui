"use client";

import { useState } from "react";

import { HandCoins, KeyRound, Layers, Tags, type LucideIcon } from "lucide-react";

import { formatTransactionTypeLabel } from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
    OWNER_LISTINGS_BAND_MENU_WIDTH_CLASS,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import { OwnerListingsBandMenuHeader } from "@/features/properties/owner-listings/owner-listings-band-menu-header";
import { OwnerListingsBandSegment } from "@/features/properties/owner-listings/owner-listings-band-segment";
import type { OwnerListingTransactionType } from "@/features/properties/owner-listings/types";

type LookingForValue = OwnerListingTransactionType | "";

const ANY_RADIO_VALUE = "any";

const LOOKING_FOR_OPTIONS: {
    value: LookingForValue;
    radioValue: string;
    label: string;
    description: string;
    icon: LucideIcon;
}[] = [
    {
        value: "",
        radioValue: ANY_RADIO_VALUE,
        label: "Any",
        description: "Sale and rent listings",
        icon: Layers,
    },
    {
        value: "sale",
        radioValue: "sale",
        label: "Sale",
        description: "Properties for purchase",
        icon: HandCoins,
    },
    {
        value: "rent",
        radioValue: "rent",
        label: "Rent",
        description: "Properties for lease",
        icon: KeyRound,
    },
];

function toRadioValue(value: LookingForValue): string {
    return value === "" ? ANY_RADIO_VALUE : value;
}

function fromRadioValue(radioValue: string): LookingForValue {
    return radioValue === ANY_RADIO_VALUE ? "" : (radioValue as OwnerListingTransactionType);
}

/** Matches Where menu row treatment — brand-soft when selected. */
const rowClass = (checked: boolean) =>
    cn(
        "group/row my-1 cursor-pointer! items-center gap-3 rounded-xl border border-transparent px-2.5 py-3 pe-10",
        "font-normal text-ink transition-[background-color,border-color,box-shadow] duration-160",
        "**:data-muted-line:data-highlighted:text-ink-muted!",
        "**:data-muted-line:focus:text-ink-muted!",
        "**:data-[slot=looking-for-icon]:transition-colors",
        "**:data-[slot=looking-for-icon]:duration-160",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:pointer-events-none",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:absolute",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:inset-e-4",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:inline-flex",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:items-center",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:justify-center",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:transition-[opacity,transform] duration-160",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:[&_svg]:block-4",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:[&_svg]:inline-4",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:[&_svg]:stroke-[2.25]",
        checked
            ? [
                  "border-brand bg-brand-soft! text-ink! shadow-sm ring-1 ring-brand/20",
                  "data-checked:bg-brand-soft! data-checked:text-ink!",
                  "data-checked:data-highlighted:bg-brand-soft! data-checked:data-highlighted:text-ink!",
                  "data-checked:focus:bg-brand-soft! data-checked:focus:text-ink!",
                  "data-checked:hover:bg-brand-soft! data-checked:hover:text-ink!",
                  "**:data-[slot=looking-for-title]:text-ink!",
                  "focus:**:data-[slot=looking-for-title]:text-ink!",
                  "data-highlighted:**:data-[slot=looking-for-title]:text-ink!",
                  "**:data-muted-line:text-ink-muted!",
                  "focus:**:data-muted-line:text-ink-muted!",
                  "data-highlighted:**:data-muted-line:text-ink-muted!",
                  "**:data-[slot=looking-for-icon]:text-brand!",
                  "focus:**:data-[slot=looking-for-icon]:text-brand!",
                  "data-highlighted:**:data-[slot=looking-for-icon]:text-brand!",
                  "hover:**:data-[slot=looking-for-icon]:text-brand!",
                  "**:data-[slot=dropdown-menu-radio-item-indicator]:text-ink!",
                  "**:data-[slot=dropdown-menu-radio-item-indicator]:opacity-100",
                  "**:data-[slot=dropdown-menu-radio-item-indicator]:scale-100",
              ]
            : [
                  "data-highlighted:bg-surface-muted/70! data-highlighted:text-ink!",
                  "focus:bg-surface-muted/70! focus:text-ink!",
                  "**:data-[slot=looking-for-icon]:text-ink-subtle!",
                  "group-hover/row:**:data-[slot=looking-for-icon]:text-brand!",
                  "focus:**:data-[slot=looking-for-icon]:text-brand!",
                  "data-highlighted:**:data-[slot=looking-for-icon]:text-brand!",
                  "**:data-[slot=dropdown-menu-radio-item-indicator]:opacity-0",
                  "**:data-[slot=dropdown-menu-radio-item-indicator]:scale-75",
              ],
    );

export type OwnerListingsLookingForMenuProps = {
    value: LookingForValue;
    onValueChange: (value: LookingForValue) => void;
    className?: string;
};

export function OwnerListingsLookingForMenu({
    value,
    onValueChange,
    className,
}: OwnerListingsLookingForMenuProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className={cn("min-w-0 w-full", className)}>
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                className="flex min-w-0 w-full"
                render={
                    <OwnerListingsBandSegment
                        label="Looking for"
                        icon={Tags}
                        value={formatTransactionTypeLabel(value)}
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
                <div className="flex flex-col gap-3 px-3 pe-3 pbs-3 pbe-3">
                    <OwnerListingsBandMenuHeader
                        description="Sale, rent, or both"
                        onClear={() => onValueChange("")}
                        className="px-2 pt-1"
                    />
                    <DropdownMenuRadioGroup
                        value={toRadioValue(value)}
                        onValueChange={(next) => onValueChange(fromRadioValue(next))}
                    >
                        {LOOKING_FOR_OPTIONS.map((option) => {
                            const checked = value === option.value;
                            const Icon = option.icon;

                            return (
                                <DropdownMenuRadioItem
                                    key={option.radioValue}
                                    value={option.radioValue}
                                    className={rowClass(checked)}
                                >
                                    <Icon
                                        aria-hidden
                                        data-slot="looking-for-icon"
                                        color={checked ? "var(--color-brand)" : "currentColor"}
                                        className={cn(
                                            "block-4.5 inline-4.5 shrink-0",
                                            checked
                                                ? null
                                                : "text-ink-subtle transition-colors duration-160",
                                        )}
                                        strokeWidth={1.75}
                                    />
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                                        <span
                                            data-slot="looking-for-title"
                                            className="truncate text-[15px] leading-snug font-medium text-ink"
                                        >
                                            {option.label}
                                        </span>
                                        <span
                                            className="truncate text-[13px] leading-snug text-ink-muted"
                                            data-muted-line
                                        >
                                            {option.description}
                                        </span>
                                    </span>
                                </DropdownMenuRadioItem>
                            );
                        })}
                    </DropdownMenuRadioGroup>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
        </div>
    );
}
