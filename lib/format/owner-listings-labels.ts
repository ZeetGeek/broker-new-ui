import { formatPriceInr, formatRentInr } from "@/lib/format/price";

import type {
    OwnerListingFurnishing,
    OwnerListingPropertyType,
    OwnerListingsBandFilters,
    OwnerListingsFilters,
    OwnerListingsSheetFilters,
    OwnerListingSort,
    OwnerListingTransactionType,
} from "@/features/properties/owner-listings/types";
import { OWNER_LISTING_PROPERTY_TYPES } from "@/features/properties/owner-listings/types";

export function formatLocalitiesLabel(localities: string[], cities: string[] = []): string {
    if (localities.length > 0) {
        if (localities.length <= 2) return localities.join(", ");
        return `${localities.slice(0, 2).join(", ")} +${localities.length - 2}`;
    }
    if (cities.length > 0) {
        if (cities.length <= 2) return cities.join(", ");
        return `${cities.slice(0, 2).join(", ")} +${cities.length - 2}`;
    }
    return "Anywhere";
}

/** Full list for tooltips when the band label is truncated. */
export function formatLocalitiesTooltip(
    localities: string[],
    cities: string[] = [],
): string | null {
    if (localities.length > 2) {
        return localities.join(", ");
    }
    if (localities.length === 0 && cities.length > 2) {
        return cities.join(", ");
    }
    if (localities.length === 0 && cities.length > 0 && cities.length <= 2) {
        return null;
    }
    return null;
}

export function formatTransactionTypeLabel(type: OwnerListingTransactionType | ""): string {
    if (type === "sale") return "Sale";
    if (type === "rent") return "Rent";
    return "Any";
}

export function formatBudgetLabel(
    min: string,
    max: string,
    kind: OwnerListingTransactionType | "" = "",
): string {
    const minInr = min ? Number(min) : null;
    const maxInr = max ? Number(max) : null;
    const format = kind === "rent" ? formatRentInr : formatPriceInr;
    const stripMo = (value: string) => value.replace(/\/mo$/, "");

    if (minInr !== null && !Number.isNaN(minInr) && maxInr !== null && !Number.isNaN(maxInr)) {
        const left = stripMo(format(minInr)).replace("₹", "");
        const right = format(maxInr);
        return `${left} – ${right}`;
    }

    if (maxInr !== null && !Number.isNaN(maxInr)) {
        return `Under ${format(maxInr)}`;
    }

    if (minInr !== null && !Number.isNaN(minInr)) {
        return `${format(minInr)}+`;
    }

    return "Any budget";
}

export function formatBhkLabel(bhk: string[]): string {
    if (bhk.length === 0) return "Any";

    const sorted = [...bhk]
        .map(Number)
        .filter((n) => !Number.isNaN(n))
        .sort((a, b) => a - b)
        .map((n) => (n >= 5 ? "5+" : String(n)));

    if (sorted.length === 0) return "Any";
    if (sorted.length === 1) return `${sorted[0]} BHK`;
    return `${sorted.join(", ")} BHK`;
}

export function formatPropertyTypeLabel(propertyType: OwnerListingPropertyType | ""): string {
    const match = OWNER_LISTING_PROPERTY_TYPES.find((option) => option.value === propertyType);
    return match?.label ?? "Any type";
}

export function formatFurnishingLabel(furnishing: OwnerListingFurnishing | ""): string {
    if (furnishing === "furnished") return "Furnished";
    if (furnishing === "semi") return "Semi-furnished";
    if (furnishing === "unfurnished") return "Unfurnished";
    return "Any";
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

    if (filters.cities.length > 0) {
        return `${totalCount} ${propertyLabel} in ${formatLocalitiesLabel([], filters.cities)}`;
    }

    return `${totalCount} ${propertyLabel}`;
}

export function extractBandFilters(filters: OwnerListingsFilters): OwnerListingsBandFilters {
    return {
        cities: filters.cities,
        localities: filters.localities,
        bhk: filters.bhk,
        type: filters.type,
        min: filters.min,
        max: filters.max,
        propertyType: filters.propertyType,
        furnishing: filters.furnishing,
    };
}

export function extractSheetFilters(filters: OwnerListingsFilters): OwnerListingsSheetFilters {
    return {
        minAreaSqft: filters.minAreaSqft,
        maxAreaSqft: filters.maxAreaSqft,
        listedWithinDays: filters.listedWithinDays,
        minCommissionPercent: filters.minCommissionPercent,
        yourAreas: filters.yourAreas,
        newToday: filters.newToday,
        slotsOpen: filters.slotsOpen,
        commissionSet: filters.commissionSet,
        readyToMove: filters.readyToMove,
    };
}
