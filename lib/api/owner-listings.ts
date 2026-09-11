import { propertiesApi } from "@/lib/api/properties";

import {
    encodeOwnerListingsCursor,
    parseOwnerListingsCursor,
} from "@/features/properties/owner-listings/owner-listings-area-scope";
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

type BrowsePageInput = {
    filters: OwnerListingsFilters;
    allAreas: boolean;
    page: number;
    limit: number;
    signal?: AbortSignal;
};

async function fetchBrowsePage({
    filters,
    allAreas,
    page,
    limit,
    signal,
}: BrowsePageInput): Promise<OwnerListingsResult> {
    const typeFilters = propertyTypeToApiFilters(filters.propertyType);

    const listedWithinDays = filters.listedWithinDays
        ? Number(filters.listedWithinDays)
        : filters.newToday
          ? 7
          : undefined;
    const minCommission = filters.minCommissionPercent
        ? Number(filters.minCommissionPercent)
        : undefined;

    const result = await propertiesApi.browse(
        {
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
            minAreaSqft: filters.minAreaSqft ? Number(filters.minAreaSqft) : undefined,
            maxAreaSqft: filters.maxAreaSqft ? Number(filters.maxAreaSqft) : undefined,
            listedWithinDays:
                listedWithinDays != null && !Number.isNaN(listedWithinDays)
                    ? listedWithinDays
                    : undefined,
            minCommissionPercent:
                minCommission != null && !Number.isNaN(minCommission) ? minCommission : undefined,
            commissionSet: filters.commissionSet || undefined,
            readyToMove: filters.readyToMove || undefined,
            furnishingStatus: filters.furnishing || undefined,
            sort: filters.sort,
            page,
            limit,
        },
        signal,
    );

    let items = result.items.map(mapBrowseListingToOwnerItem);

    // Slots-open is still a local signal until the API models broker slots.
    if (filters.slotsOpen) {
        items = items.filter((item) => item.brokerSlotsOpen > 0);
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

/**
 * Broker owner-listings pool from `GET /properties/browse`.
 * - Explicit city/locality: filter to those places
 * - Your areas chip: broker-area listings first, then elsewhere (two-phase cursor)
 * - Anywhere: `allAreas=true` → all public owner listings
 * - Advanced sheet filters (area / listed / commission / ready-to-move) go to the API
 */
export async function fetchOwnerListings(
    filters: OwnerListingsFilters,
    _context: OwnerListingsFilterContext = {},
    signal?: AbortSignal,
): Promise<OwnerListingsResult> {
    const limit = filters.limit || DEFAULT_OWNER_LISTINGS_FILTERS.limit;
    const hasLocationFilter = filters.cities.length > 0 || filters.localities.length > 0;

    // Specific Where areas — single-phase browse for those places.
    if (hasLocationFilter) {
        const page = filters.cursor ? Number(filters.cursor) || 1 : 1;
        return fetchBrowsePage({
            filters,
            allAreas: true,
            page,
            limit,
            signal,
        });
    }

    // Anywhere (Your areas chip off) — single-phase all-areas browse.
    if (!filters.yourAreas) {
        const page = filters.cursor ? Number(filters.cursor) || 1 : 1;
        return fetchBrowsePage({
            filters,
            allAreas: true,
            page,
            limit,
            signal,
        });
    }

    // Your areas chip on — phase 1: broker coverage, phase 2: remaining listings.
    const { phase, page } = parseOwnerListingsCursor(filters.cursor);

    if (phase === "serviceable") {
        const result = await fetchBrowsePage({
            filters,
            allAreas: false,
            page,
            limit,
            signal,
        });

        if (result.page < result.totalPages) {
            return {
                ...result,
                nextCursor: encodeOwnerListingsCursor("serviceable", result.page + 1),
            };
        }

        // Exhausted serviceable inventory. If this page is empty (nothing in coverage),
        // jump straight into the anywhere phase so the UI does not flash an empty state.
        if (result.items.length === 0 && page === 1) {
            const anywhere = await fetchBrowsePage({
                filters,
                allAreas: true,
                page: 1,
                limit,
                signal,
            });
            return {
                ...anywhere,
                nextCursor:
                    anywhere.page < anywhere.totalPages
                        ? encodeOwnerListingsCursor("anywhere", anywhere.page + 1)
                        : null,
            };
        }

        return {
            ...result,
            nextCursor: encodeOwnerListingsCursor("anywhere", 1),
        };
    }

    const result = await fetchBrowsePage({
        filters,
        allAreas: true,
        page,
        limit,
        signal,
    });

    return {
        ...result,
        nextCursor:
            result.page < result.totalPages
                ? encodeOwnerListingsCursor("anywhere", result.page + 1)
                : null,
    };
}

export async function fetchOwnerListingCities() {
    return propertiesApi.browseCities();
}
