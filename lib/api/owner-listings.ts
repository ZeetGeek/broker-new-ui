import { propertiesApi } from "@/lib/api/properties";

import {
    bhkValuesToApiConfig,
    mapBrowseListingToOwnerItem,
    propertyTypeToApiFilters,
} from "@/features/properties/owner-listings/map-browse-listing";
import type {
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingsResult,
} from "@/features/properties/owner-listings/types";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";

/**
 * Broker owner-listings pool from `GET /properties/browse`.
 * - Serviceable areas (default): omit city/locality → backend scopes to broker areas
 * - Anywhere: `allAreas=true` → all public owner listings
 * - Explicit city/locality: filter to those places
 */
export async function fetchOwnerListings(
    filters: OwnerListingsFilters,
    _context: OwnerListingsFilterContext = {},
): Promise<OwnerListingsResult> {
    const page = filters.cursor ? Number(filters.cursor) || 1 : 1;
    const limit = filters.limit || DEFAULT_OWNER_LISTINGS_FILTERS.limit;
    const hasLocationFilter = filters.cities.length > 0 || filters.localities.length > 0;
    const allAreas = !hasLocationFilter && !filters.yourAreas;
    const typeFilters = propertyTypeToApiFilters(filters.propertyType);

    const result = await propertiesApi.browse({
        search: filters.q.trim() || undefined,
        city: filters.cities.length ? filters.cities : undefined,
        locality: filters.localities.length ? filters.localities : undefined,
        allAreas: allAreas || undefined,
        transactionType: filters.type || undefined,
        propertyType: typeFilters.propertyType,
        subtype: typeFilters.subtype,
        bhkConfig: filters.bhk.length ? bhkValuesToApiConfig(filters.bhk) : undefined,
        minPrice: filters.min ? Number(filters.min) : undefined,
        maxPrice: filters.max ? Number(filters.max) : undefined,
        furnishingStatus: filters.furnishing || undefined,
        sort: filters.sort,
        page,
        limit,
    });

    let items = result.items.map(mapBrowseListingToOwnerItem);

    // Chips that the browse API does not model yet — apply locally on the page.
    if (filters.newToday) {
        items = items.filter((item) => item.isNew);
    }
    if (filters.slotsOpen) {
        items = items.filter((item) => item.brokerSlotsOpen > 0);
    }
    if (filters.commissionSet) {
        items = items.filter((item) => item.commissionPercent > 0);
    }
    if (filters.readyToMove) {
        items = items.filter((item) => item.readyToMove);
    }

    const marketValueInr = items.reduce((sum, item) => sum + (item.saleAmountInr ?? 0), 0);

    const nextPage = result.page < result.totalPages ? String(result.page + 1) : null;

    return {
        items,
        totalCount: result.total,
        marketValueInr,
        nextCursor: nextPage,
        page: result.page,
        totalPages: result.totalPages,
    };
}

export async function fetchOwnerListingCities() {
    return propertiesApi.browseCities();
}
