"use client";

import { useMemo } from "react";

import type { MyListingsSummary } from "@/lib/api/my-listings";
import { buildMyListingsSummaryLines } from "@/lib/format/my-listings-summary";
import { cn } from "@/lib/utils";

import { AddFab } from "@/components/shared/add-fab";
import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";
import { Skeleton } from "@/components/shared/skeleton";

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
    const lines = useMemo(
        () =>
            buildMyListingsSummaryLines({
                summary,
                resultTotal,
                hasActiveFilters,
                status,
            }),
        [summary, resultTotal, hasActiveFilters, status],
    );

    return (
        <h1 className="h3 text-start min-inline-0">
            {isLoading ? (
                <span aria-hidden className="relative inline-block align-bottom">
                    <span className="invisible">My Listings.</span>
                    <span
                        className="
                          absolute inset-s-0 inset-bs-[0.12em] overflow-hidden rounded-control
                          bg-border-warm block-[0.8em] inline-full
                        "
                    >
                        <Skeleton className="bg-ink/3 block-full inline-full" />
                    </span>
                </span>
            ) : (
                <span className="text-ink">My Listings.</span>
            )}{" "}
            <RotatingHeaderSummary
                key={`${status}:${lines.join("|")}`}
                lines={lines}
                isLoading={isLoading}
                loadingLabel="Loading your listing counts"
                loadingPlaceholder="Finish your property details, then publish when ready"
                errorMessage={
                    hasError ? "Could not load your listings. Please try again." : undefined
                }
                reservePlaceholder
            />
        </h1>
    );
}
