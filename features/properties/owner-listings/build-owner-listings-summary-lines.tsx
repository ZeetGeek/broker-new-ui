import type { ReactNode } from "react";

import { formatResultsCountLine } from "@/lib/format/owner-listings-labels";

import { formatNewInAreasThisWeekLine } from "@/features/properties/owner-listings/count-new-listings-this-week";
import type { OwnerListingsFilters } from "@/features/properties/owner-listings/types";

export type OwnerListingsPoolSummary = {
    slotsOpenCount: number;
    newTodayCount: number;
    commissionSetCount: number;
    readyToMoveCount: number;
};

export type OwnerListingsSummaryInput = {
    totalCount: number;
    newThisWeekCount: number;
    serviceAreas: string[];
    filters: OwnerListingsFilters;
    poolSummary: OwnerListingsPoolSummary;
    isLoading: boolean;
    hasActiveFilters: boolean;
};

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

export function buildOwnerListingsSummaryLines({
    totalCount,
    newThisWeekCount,
    serviceAreas,
    filters,
    poolSummary,
    isLoading,
    hasActiveFilters,
}: OwnerListingsSummaryInput): ReactNode[] {
    if (isLoading) {
        return ["Finding properties near you…"];
    }

    const lines: ReactNode[] = [];
    const resultsLine = formatResultsCountLine(totalCount, filters, serviceAreas);

    if (totalCount === 0) {
        lines.push(
            hasActiveFilters
                ? "No properties match these filters — try clearing a few"
                : "No owner listings in the pool yet",
        );
    } else {
        lines.push(resultsLine);
    }

    const newThisWeekLine = formatNewInAreasThisWeekLine(newThisWeekCount, serviceAreas);
    if (newThisWeekLine) {
        lines.push(newThisWeekLine);
    }

    if (poolSummary.slotsOpenCount > 0) {
        lines.push(
            <>
                {countLabel(poolSummary.slotsOpenCount, "property has", "properties have")} broker
                slots open
            </>,
        );
    }

    if (poolSummary.newTodayCount > 0) {
        lines.push(
            <>
                {countLabel(poolSummary.newTodayCount, "new listing", "new listings")} posted today
            </>,
        );
    }

    if (poolSummary.commissionSetCount > 0) {
        lines.push(
            <>
                {countLabel(poolSummary.commissionSetCount, "property has", "properties have")}{" "}
                commission set
            </>,
        );
    }

    if (poolSummary.readyToMoveCount > 0) {
        lines.push(
            <>
                {countLabel(poolSummary.readyToMoveCount, "property is", "properties are")} ready to
                move
            </>,
        );
    }

    if (filters.yourAreas && serviceAreas.length > 0 && totalCount > 0) {
        lines.push("Showing only listings in your service areas");
    }

    if (lines.length === 1 && totalCount > 0) {
        lines.push("Send a request — approved listings land in your pipeline");
    }

    return lines;
}
