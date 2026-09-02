"use client";

import { ChevronDown } from "lucide-react";

import { formatResultsCountLine, formatSortLabel } from "@/lib/format/owner-listings-labels";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { OwnerListingSort, OwnerListingsFilters } from "@/features/properties/owner-listings/types";

export type OwnerListingsResultsBarProps = {
    totalCount: number;
    filters: OwnerListingsFilters;
    serviceAreas: string[];
    isLoading?: boolean;
    onSortChange: (sort: OwnerListingSort) => void;
};

export function OwnerListingsResultsBar({
    totalCount,
    filters,
    serviceAreas,
    isLoading = false,
    onSortChange,
}: OwnerListingsResultsBarProps) {
    const countLine = formatResultsCountLine(totalCount, filters, serviceAreas);

    return (
        <div className="flex items-center justify-between gap-4">
            <p className="body-sm text-ink-muted">
                {isLoading ? "Finding properties…" : countLine}
            </p>

            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 rounded-full border-border-warm bg-surface text-ink-muted"
                        >
                            {formatSortLabel(filters.sort)}
                            <ChevronDown aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                        </Button>
                    }
                />
                <DropdownMenuContent align="end" className="min-inline-44">
                    <DropdownMenuItem onClick={() => onSortChange("newest")}>
                        Newest first
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSortChange("price_asc")}>
                        Price low
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSortChange("price_desc")}>
                        Price high
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
