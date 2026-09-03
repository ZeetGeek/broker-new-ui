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
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
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
    const hasSelection = value.length > 0;

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                render={
                    <OwnerListingsBandSegment
                        label="BHK"
                        icon={BedDouble}
                        value={formatBhkLabel(value)}
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
                    "min-inline-80! inline-80! max-inline-96 overflow-hidden! p-0",
                )}
            >
                <div className="flex flex-col gap-4 px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                            <p className="body-xs font-semibold tracking-[0.08em] text-ink-muted uppercase">
                                BHK
                            </p>
                            <p className="body-sm text-ink-muted">Select one or more</p>
                        </div>
                        {hasSelection ? (
                            <button
                                type="button"
                                onClick={onClear}
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
    );
}
