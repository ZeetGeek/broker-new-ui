"use client";

import { useState } from "react";

import { BedDouble } from "lucide-react";

import { formatBhkLabel } from "@/lib/format/owner-listings-labels";
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

const BHK_OPTIONS = [
    { value: "1", label: "1 BHK" },
    { value: "2", label: "2 BHK" },
    { value: "3", label: "3 BHK" },
    { value: "4", label: "4 BHK" },
    { value: "5", label: "5+ BHK" },
] as const;

export type OwnerListingsBhkMenuProps = {
    value: string[];
    onToggle: (value: string) => void;
    onClear: () => void;
    className?: string;
};

export function OwnerListingsBhkMenu({
    value,
    onToggle,
    onClear,
    className,
}: OwnerListingsBhkMenuProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className={cn("min-w-0 w-full", className)}>
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                className="flex min-w-0 w-full"
                render={
                    <OwnerListingsBandSegment
                        label="BHK"
                        icon={BedDouble}
                        value={formatBhkLabel(value)}
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
                <div className="flex flex-col gap-4 px-5 py-5">
                    <OwnerListingsBandMenuHeader
                        description="Select one or more"
                        onClear={onClear}
                    />

                    <div
                        className="grid grid-cols-2 gap-3"
                        role="group"
                        aria-label="Bedroom configuration"
                    >
                        {BHK_OPTIONS.map((option) => {
                            const active = value.includes(option.value);
                            const isFullWidth = option.value === "5";

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => onToggle(option.value)}
                                    className={cn(
                                        `
                                          group/tile flex flex-col items-center justify-center gap-2.5
                                          rounded-2xl border px-3 py-5 outline-none
                                          transition-[background-color,border-color,box-shadow,transform]
                                          duration-160
                                          focus-visible:ring-2 focus-visible:ring-brand
                                          active:scale-[0.97]
                                        `,
                                        isFullWidth && "col-span-2",
                                        active
                                            ? `
                                              border-brand bg-brand-soft text-ink shadow-sm
                                              ring-1 ring-brand/20
                                            `
                                            : `
                                              border-border-warm bg-surface text-ink-muted
                                              hover:border-ink/20 hover:bg-surface-muted/70
                                              hover:text-ink
                                            `,
                                    )}
                                >
                                    <BedDouble
                                        aria-hidden
                                        className={cn(
                                            `
                                              block-5 inline-5 shrink-0 transition-colors
                                              duration-160
                                            `,
                                            active
                                                ? "text-brand"
                                                : "text-ink-subtle group-hover/tile:text-brand",
                                        )}
                                        strokeWidth={1.75}
                                    />
                                    <span
                                        className={cn(
                                            "body-sm leading-none font-semibold whitespace-nowrap",
                                            active ? "text-brand-text" : "text-ink",
                                        )}
                                    >
                                        {option.label}
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
