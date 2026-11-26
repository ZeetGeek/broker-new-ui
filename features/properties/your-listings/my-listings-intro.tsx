"use client";

import type { MyListingsSummary } from "@/lib/api/my-listings";
import { listingsSummary } from "@/lib/format/broker-page-summary";
import { cn } from "@/lib/utils";

import { AddFab } from "@/components/shared/add-fab";
import { PageHeader } from "@/components/shared/page-header";

import type { MyListingsStatusTab } from "@/features/properties/your-listings/types";

/**
 * Mobile-only floating add. Desktop uses the toolbar CTA in MyListingsHeader —
 * one primary action per viewport, thumb-reach on phone while scrolling.
 */
export function MyListingsAddFab({
    className,
    onClick,
}: {
    className?: string;
    onClick: () => void;
}) {
    return (
        <AddFab
            onClick={onClick}
            label="Add property"
            hint="Add a new property to your inventory"
            className={cn("md:hidden", className)}
        />
    );
}

export type MyListingsIntroProps = {
    summary: MyListingsSummary | null;
    resultTotal: number;
    status: MyListingsStatusTab | "";
    hasError?: boolean;
    hasActiveFilters: boolean;
    isLoading?: boolean;
};

export function MyListingsIntro({
    summary,
    resultTotal,
    status,
    hasError = false,
    hasActiveFilters,
    isLoading = false,
}: MyListingsIntroProps) {
    return (
        <PageHeader
            title="My listings"
            summaryLines={listingsSummary({ summary, resultTotal, hasActiveFilters, status })}
            summaryLoading={isLoading}
            summaryPlaceholder="Loading your listings"
            summaryError={hasError ? "Could not load your listing summary. Try again." : undefined}
        />
    );
}
