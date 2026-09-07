"use client";

import { ArrowDownUp, ChevronDown } from "lucide-react";

import { formatSortLabel } from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ownerListingsChipClassName } from "@/features/properties/owner-listings/owner-listings-chip-styles";
import type {
    OwnerListingsFilters,
    OwnerListingSort,
} from "@/features/properties/owner-listings/types";

export type OwnerListingsSortMenuProps = {
    filters: OwnerListingsFilters;
    onSortChange: (sort: OwnerListingSort) => void;
    className?: string;
};

const SORT_OPTIONS: { value: OwnerListingSort; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "price_asc", label: "Price low" },
    { value: "price_desc", label: "Price high" },
];

export function OwnerListingsSortMenu({
    filters,
    onSortChange,
    className,
}: OwnerListingsSortMenuProps) {
    const isDefaultSort = filters.sort === "newest";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <button
                        type="button"
                        className={cn(
                            ownerListingsChipClassName(!isDefaultSort),
                            "gap-2",
                            isDefaultSort && "text-ink-muted",
                            className,
                        )}
                    >
                        <ArrowDownUp
                            aria-hidden
                            className="text-brand block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        <span className="hidden sm:inline">{formatSortLabel(filters.sort)}</span>
                        <span className="sm:hidden">Sort</span>
                        <ChevronDown
                            aria-hidden
                            className="opacity-60 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                    </button>
                }
            />
            <DropdownMenuContent align="end" className="min-inline-44">
                {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onSortChange(option.value)}
                        className={cn(filters.sort === option.value && "font-semibold text-brand")}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
