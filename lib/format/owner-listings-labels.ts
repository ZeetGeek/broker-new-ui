import { formatPriceInr } from "@/lib/format/price";

import type {
    OwnerListingSort,
    OwnerListingTransactionType,
    OwnerListingsFilters,
} from "@/features/properties/owner-listings/types";

export function formatLocalitiesLabel(localities: string[]): string {
    if (localities.length === 0) return "Anywhere";
    if (localities.length <= 2) return localities.join(", ");
    return `${localities.slice(0, 2).join(", ")} +${localities.length - 2}`;
}

export function formatTransactionTypeLabel(type: OwnerListingTransactionType | ""): string {
    if (type === "sale") return "Sale";
    if (type === "rent") return "Rent";
    return "Any";
}

export function formatBudgetLabel(min: string, max: string): string {
    const minInr = min ? Number(min) : null;
    const maxInr = max ? Number(max) : null;

    if (minInr !== null && !Number.isNaN(minInr) && maxInr !== null && !Number.isNaN(maxInr)) {
        return `${formatPriceInr(minInr).replace("₹", "")} – ${formatPriceInr(maxInr)}`;
    }

    if (maxInr !== null && !Number.isNaN(maxInr)) {
        return `Under ${formatPriceInr(maxInr)}`;
    }

    if (minInr !== null && !Number.isNaN(minInr)) {
        return `${formatPriceInr(minInr)}+`;
    }

    return "Any budget";
}

export function formatBhkLabel(bhk: string[]): string {
    if (bhk.length === 0) return "Any";
    return bhk.map((value) => `${value} BHK`).join(", ");
}

export function formatSortLabel(sort: OwnerListingSort): string {
    if (sort === "price_asc") return "Price low";
    if (sort === "price_desc") return "Price high";
    return "Newest first";
}

export function formatResultsCountLine(
    totalCount: number,
    filters: OwnerListingsFilters,
    serviceAreas: string[],
): string {
    const propertyLabel = totalCount === 1 ? "property" : "properties";

    if (filters.yourAreas && serviceAreas.length > 0) {
        return `${totalCount} ${propertyLabel} in your areas`;
    }

    if (filters.localities.length > 0) {
        return `${totalCount} ${propertyLabel} in ${formatLocalitiesLabel(filters.localities)}`;
    }

    return `${totalCount} ${propertyLabel}`;
}

export function extractBandFilters(
    filters: OwnerListingsFilters,
): Pick<OwnerListingsFilters, "localities" | "bhk" | "type" | "min" | "max"> {
    return {
        localities: filters.localities,
        bhk: filters.bhk,
        type: filters.type,
        min: filters.min,
        max: filters.max,
    };
}

export function extractSheetFilters(
    filters: OwnerListingsFilters,
): Pick<OwnerListingsFilters, "q" | "propertyType" | "furnishing" | "type" | "bhk"> {
    return {
        q: filters.q,
        propertyType: filters.propertyType,
        furnishing: filters.furnishing,
        type: filters.type,
        bhk: filters.bhk,
    };
}
