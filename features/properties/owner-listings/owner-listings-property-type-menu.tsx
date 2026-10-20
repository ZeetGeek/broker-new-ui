"use client";

import { useMemo, useState } from "react";

import { Layers } from "@/components/shared/icons";

import { propertyTypeOptions, toLabel } from "@/constants/property";
import { formatPropertyTypeLabel } from "@/lib/format/owner-listings-labels";
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
import type { OwnerListingCategory } from "@/features/properties/owner-listings/types";
import { OWNER_LISTING_PROPERTY_TYPES } from "@/features/properties/owner-listings/types";

type PropertyTypeValue = string;

const ANY_RADIO_VALUE = "any";

const rowClass = (checked: boolean) =>
    cn(
        `
          group/row my-1 cursor-pointer! items-center gap-3 rounded-inner border border-transparent
          px-2.5 py-3 pe-10
        `,
        "font-normal text-ink transition-[background-color,border-color,box-shadow] duration-160",
        "[--row-icon:var(--color-ink-subtle)]",
        "hover:[--row-icon:var(--color-brand)]",
        "focus:[--row-icon:var(--color-brand)]",
        "data-highlighted:[--row-icon:var(--color-brand)]",
        "**:data-muted-line:text-ink-muted!",
        "hover:**:data-muted-line:text-ink-muted!",
        "focus:**:data-muted-line:text-ink-muted!",
        "data-highlighted:**:data-muted-line:text-ink-muted!",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:pointer-events-none",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:absolute",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:inset-e-4",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:inline-flex",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:items-center",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:justify-center",
        `
          duration-160
          **:data-[slot=dropdown-menu-radio-item-indicator]:transition-[opacity,transform]
        `,
        "**:data-[slot=dropdown-menu-radio-item-indicator]:[&_svg]:block-4",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:[&_svg]:inline-4",
        "**:data-[slot=dropdown-menu-radio-item-indicator]:[&_svg]:stroke-[2.25]",
        checked
            ? [
                  "border-brand bg-brand-soft! text-ink! shadow-sm ring-1 ring-brand/20",
                  "[--row-icon:var(--color-brand)]",
                  "hover:[--row-icon:var(--color-brand)]",
                  "focus:[--row-icon:var(--color-brand)]",
                  "data-highlighted:[--row-icon:var(--color-brand)]",
                  "data-checked:bg-brand-soft! data-checked:text-ink!",
                  `
                    data-checked:data-highlighted:bg-brand-soft!
                    data-checked:data-highlighted:text-ink!
                  `,
                  "data-checked:focus:bg-brand-soft! data-checked:focus:text-ink!",
                  "data-checked:hover:bg-brand-soft! data-checked:hover:text-ink!",
                  "**:data-[slot=property-type-title]:text-ink!",
                  "focus:**:data-[slot=property-type-title]:text-ink!",
                  "data-highlighted:**:data-[slot=property-type-title]:text-ink!",
                  "**:data-[slot=dropdown-menu-radio-item-indicator]:text-ink!",
                  "**:data-[slot=dropdown-menu-radio-item-indicator]:opacity-100",
                  "**:data-[slot=dropdown-menu-radio-item-indicator]:scale-100",
              ]
            : [
                  "data-highlighted:bg-surface-muted/70! data-highlighted:text-ink!",
                  "focus:bg-surface-muted/70! focus:text-ink!",
                  "**:data-[slot=dropdown-menu-radio-item-indicator]:opacity-0",
                  "**:data-[slot=dropdown-menu-radio-item-indicator]:scale-75",
              ],
    );

export type OwnerListingsPropertyTypeMenuProps = {
    value: PropertyTypeValue;
    /** When set, options shrink to that category’s Add Property subtypes. */
    category?: OwnerListingCategory | "";
    onValueChange: (value: PropertyTypeValue) => void;
    onCommit?: () => void;
    onOpenChange?: (open: boolean) => void;
    className?: string;
};

export function OwnerListingsPropertyTypeMenu({
    value,
    category = "",
    onValueChange,
    onCommit,
    onOpenChange,
    className,
}: OwnerListingsPropertyTypeMenuProps) {
    const [open, setOpen] = useState(false);

    const options = useMemo(() => {
        const anyOption = {
            value: "",
            radioValue: ANY_RADIO_VALUE,
            label: "Any type",
            description: category
                ? `All ${toLabel(category).toLowerCase()} types`
                : "Pick a category to narrow types",
        };

        if (category) {
            return [
                anyOption,
                ...propertyTypeOptions(category).map((option) => ({
                    value: option.value,
                    radioValue: option.value,
                    label: option.label,
                    description: toLabel(category),
                })),
            ];
        }

        // No category — keep coarse discovery chips until category is chosen.
        return [
            anyOption,
            ...OWNER_LISTING_PROPERTY_TYPES.map((option) => ({
                value: option.value,
                radioValue: option.value,
                label: option.label,
                description: "All categories",
            })),
        ];
    }, [category]);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        onOpenChange?.(nextOpen);
    };

    return (
        <div className={cn("inline-full min-inline-0", className)}>
            <DropdownMenu open={open} onOpenChange={handleOpenChange}>
                <DropdownMenuTrigger
                    className="flex inline-full min-inline-0"
                    render={
                        <OwnerListingsBandSegment
                            label="Property type"
                            icon={Layers}
                            value={formatPropertyTypeLabel(value)}
                            className="inline-full"
                            isOpen={open}
                            isActive={Boolean(value)}
                        />
                    }
                />
                <DropdownMenuContent
                    align="center"
                    sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                    className={cn(
                        OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
                        OWNER_LISTINGS_BAND_MENU_WIDTH_CLASS,
                        "max-block-80 overflow-y-auto! overflow-x-hidden! p-0",
                    )}
                >
                    <div className="flex flex-col gap-3 px-3 pe-3 pbs-3 pbe-3">
                        <OwnerListingsBandMenuHeader
                            description={
                                category
                                    ? "Subtype for this category"
                                    : "Choose a category for full subtypes"
                            }
                            showReset={value !== ""}
                            onClear={() => {
                                onValueChange("");
                                onCommit?.();
                            }}
                            className="px-2 pbs-1"
                        />
                        <DropdownMenuRadioGroup
                            value={value || ANY_RADIO_VALUE}
                            onValueChange={(next) => {
                                onValueChange(next === ANY_RADIO_VALUE ? "" : next);
                                handleOpenChange(false);
                            }}
                        >
                            {options.map((option) => {
                                const checked = (value || "") === option.value;
                                return (
                                    <DropdownMenuRadioItem
                                        key={option.radioValue}
                                        value={option.radioValue}
                                        className={rowClass(checked)}
                                    >
                                        <Layers
                                            aria-hidden
                                            data-slot="property-type-icon"
                                            color="var(--row-icon)"
                                            className="
                                              shrink-0 transition-[color,stroke] duration-160
                                              block-4.5 inline-4.5
                                            "
                                            strokeWidth={1.75}
                                        />
                                        <span
                                            className="
                                              flex flex-1 flex-col gap-0.5 text-start min-inline-0
                                            "
                                        >
                                            <span
                                                data-slot="property-type-title"
                                                className="
                                                  truncate text-[15px] leading-snug font-medium
                                                  text-ink
                                                "
                                            >
                                                {option.label}
                                            </span>
                                            <span
                                                className="
                                                  truncate text-[13px] leading-snug text-ink-muted!
                                                "
                                                data-muted-line
                                                style={{ color: "var(--color-ink-muted)" }}
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
