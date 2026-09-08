"use client";

import { ArrowDownUp, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { RequestSort } from "@/features/properties/my-requests/types";
import { ownerListingsChipClassName } from "@/features/properties/owner-listings/owner-listings-chip-styles";

export type RequestsSortMenuProps = {
    sort: RequestSort;
    onSortChange: (sort: RequestSort) => void;
    className?: string;
};

/** Short labels — the trigger sits in a crowded toolbar row. */
const SORT_OPTIONS: { value: RequestSort; label: string }[] = [
    { value: "recent", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "waiting_longest", label: "Waiting longest" },
    { value: "price_desc", label: "Costliest first" },
    { value: "price_asc", label: "Cheapest first" },
];

export function formatRequestSortLabel(sort: RequestSort): string {
    return SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Newest first";
}

export function RequestsSortMenu({ sort, onSortChange, className }: RequestsSortMenuProps) {
    const isDefaultSort = sort === "recent";

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
                        <span className="hidden sm:inline">{formatRequestSortLabel(sort)}</span>
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
                        className={cn(sort === option.value && "font-semibold text-brand")}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
