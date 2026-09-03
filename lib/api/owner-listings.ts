import { propertiesApi } from "@/lib/api/properties";

import {
    bhkValuesToApiConfig,
    mapBrowseListingToOwnerItem,
    propertyTypeToApiSubtype,
} from "@/features/properties/owner-listings/map-browse-listing";
import type {
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingsResult,
} from "@/features/properties/owner-listings/types";

const PAGE_SIZE = 60;

/**
 * Broker owner-listings pool from `GET /properties/browse`.
 * Service-area scoping is applied on the backend when the broker has areas.
 */
export async function fetchOwnerListings(
    filters: OwnerListingsFilters,
    context: OwnerListingsFilterContext = {},
): Promise<OwnerListingsResult> {
    const page = filters.cursor ? Number(filters.cursor) || 1 : 1;
    const hasLocationFilter = filters.cities.length > 0 || filters.localities.length > 0;
    const useServiceAreasOnly =
        !hasLocationFilter && filters.yourAreas && (context.serviceAreas?.length ?? 0) > 0;

    const result = await propertiesApi.browse({
        search: filters.q.trim() || undefined,
        city: filters.cities.length ? filters.cities : undefined,
        locality: useServiceAreasOnly
            ? context.serviceAreas
            : filters.localities.length
              ? filters.localities
              : undefined,
        transactionType: filters.type || undefined,
        subtype: propertyTypeToApiSubtype(filters.propertyType),
        bhkConfig: filters.bhk.length ? bhkValuesToApiConfig(filters.bhk) : undefined,
        minPrice: filters.min ? Number(filters.min) : undefined,
        maxPrice: filters.max ? Number(filters.max) : undefined,
        furnishingStatus: filters.furnishing || undefined,
        sort: filters.sort,
        page,
        limit: PAGE_SIZE,
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
    };
}

export async function fetchOwnerListingCities() {
    return propertiesApi.browseCities();
}
