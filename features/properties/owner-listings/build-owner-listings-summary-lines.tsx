import type { OwnerListingsFilters } from "@/features/properties/owner-listings/types";

export const OWNER_LISTINGS_APPROVAL_MESSAGE =
    "Once the owner approves, it goes to My Deals. No need to add it again";

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
    hasMoreResults?: boolean;
};

/** Use real browse results for updates, followed by the two steps needed to work a deal. */
export function buildOwnerListingsSummaryLines({
    totalCount,
    newThisWeekCount,
    serviceAreas,
    filters,
    poolSummary,
    isLoading,
    hasActiveFilters,
    hasMoreResults = false,
}: OwnerListingsSummaryInput): string[] {
    if (isLoading) return ["Loading properties from owners…"];

    if (totalCount === 0) {
        return [
            hasActiveFilters
                ? "No properties match. Try changing your filters"
                : "No properties listed here yet. Please check again later",
        ];
    }

    const propertyLabel = totalCount === 1 ? "property" : "properties";
    const hasSelectedPlaces = filters.localities.length > 0 || filters.cities.length > 0;
    const areaLabel = hasSelectedPlaces
        ? " in your selected areas"
        : filters.yourAreas && serviceAreas.length > 0
          ? " in your areas"
          : "";
    const resultsLine = hasActiveFilters
        ? `${totalCount} ${propertyLabel} from owners ${totalCount === 1 ? "matches" : "match"} your filters`
        : `${totalCount} ${propertyLabel} listed by owners${areaLabel}`;

    const lines: string[] = [];
    if (newThisWeekCount > 0 && serviceAreas.length > 0) {
        const noun = hasActiveFilters
            ? newThisWeekCount === 1
                ? "match"
                : "matches"
            : newThisWeekCount === 1
              ? "property"
              : "properties";
        lines.push(
            `${hasMoreResults ? "At least " : ""}${newThisWeekCount} new ${noun} in your areas this week`,
        );
    }
    lines.push(resultsLine);

    // Exact feature counts are only available once every result has loaded.
    if (!hasMoreResults && poolSummary.readyToMoveCount > 0) {
        const count = poolSummary.readyToMoveCount;
        lines.push(`${count} ${count === 1 ? "property is" : "properties are"} ready to move in`);
    }
    if (!hasMoreResults && poolSummary.commissionSetCount > 0) {
        const count = poolSummary.commissionSetCount;
        lines.push(
            `Owners have added commission details for ${count} ${count === 1 ? "property" : "properties"}`,
        );
    } else {
        lines.push("Check each property's price and your commission");
    }

    const action =
        filters.type === "sale"
            ? "sell"
            : filters.type === "rent"
              ? "rent out"
              : "sell or rent out";
    lines.push(`Send the owner a request to ${action} their property`);
    lines.push(OWNER_LISTINGS_APPROVAL_MESSAGE);
    return lines;
}
