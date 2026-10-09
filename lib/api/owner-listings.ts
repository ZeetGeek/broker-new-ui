import { isMockMode } from "@/lib/api/mock-mode";
import { propertiesApi } from "@/lib/api/properties";

import {
    bhkValuesToApiConfig,
    mapBrowseListingToOwnerItem,
    propertyTypeToApiFilters,
} from "@/features/properties/owner-listings/map-browse-listing";
import { MOCK_OWNER_LISTINGS } from "@/features/properties/owner-listings/mock-owner-listings";
import type {
    OwnerListingItem,
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingsResult,
} from "@/features/properties/owner-listings/types";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";

function amountForType(item: OwnerListingItem, type: OwnerListingsFilters["type"]): number | null {
    if (type === "rent") return item.rentAmountInr;
    if (type === "sale") return item.saleAmountInr;
    return item.saleAmountInr ?? item.rentAmountInr;
}

function filterMockOwnerListings(
    filters: OwnerListingsFilters,
    context: OwnerListingsFilterContext,
): OwnerListingItem[] {
    const needle = filters.q.trim().toLowerCase();
    const min = filters.min ? Number(filters.min) : null;
    const max = filters.max ? Number(filters.max) : null;
    const minArea = filters.minAreaSqft ? Number(filters.minAreaSqft) : null;
    const maxArea = filters.maxAreaSqft ? Number(filters.maxAreaSqft) : null;
    const listedWithin = filters.listedWithinDays ? Number(filters.listedWithinDays) : null;
    const minCommission = filters.minCommissionPercent
        ? Number(filters.minCommissionPercent)
        : null;
    const serviceAreas = (context.serviceAreas ?? []).map((area) => area.toLowerCase());

    let items = MOCK_OWNER_LISTINGS.filter((item) => {
        if (needle) {
            const hay = [item.configLabel, item.locality, item.city, item.ownerName]
                .join(" ")
                .toLowerCase();
            if (!hay.includes(needle)) return false;
        }
        if (filters.cities.length && !filters.cities.includes(item.city)) return false;
        if (filters.localities.length && !filters.localities.includes(item.locality)) return false;
        if (filters.bhk.length && !filters.bhk.includes(String(item.bhk))) return false;
        if (filters.propertyType && item.propertyTypeLabel !== filters.propertyType) return false;
        if (filters.furnishing && item.furnishing !== filters.furnishing) return false;
        if (filters.type === "sale" && item.saleAmountInr == null) return false;
        if (filters.type === "rent" && item.rentAmountInr == null) return false;
        const amount = amountForType(item, filters.type);
        if (min != null && !Number.isNaN(min) && (amount == null || amount < min)) return false;
        if (max != null && !Number.isNaN(max) && (amount == null || amount > max)) return false;
        if (minArea != null && !Number.isNaN(minArea) && item.areaSqft < minArea) return false;
        if (maxArea != null && !Number.isNaN(maxArea) && item.areaSqft > maxArea) return false;
        if (
            listedWithin != null &&
            !Number.isNaN(listedWithin) &&
            item.listedHoursAgo > listedWithin * 24
        ) {
            return false;
        }
        if (
            minCommission != null &&
            !Number.isNaN(minCommission) &&
            item.commissionPercent < minCommission
        ) {
            return false;
        }
        if (filters.newToday && !item.isNew) return false;
        if (filters.slotsOpen && item.brokerSlotsOpen <= 0) return false;
        if (filters.commissionSet && item.commissionPercent <= 0) return false;
        if (filters.readyToMove && !item.readyToMove) return false;
        if (filters.bookmarked && !item.isBookmarked) return false;
        if (filters.yourAreas && serviceAreas.length > 0) {
            const locality = item.locality.toLowerCase();
            const city = item.city.toLowerCase();
            return serviceAreas.some(
                (area) =>
                    locality === area ||
                    city === area ||
                    locality.includes(area) ||
                    city.includes(area),
            );
        }
        return true;
    });

    items = [...items].sort((a, b) => {
        if (filters.sort === "price_asc") {
            return (amountForType(a, filters.type) ?? 0) - (amountForType(b, filters.type) ?? 0);
        }
        if (filters.sort === "price_desc") {
            return (amountForType(b, filters.type) ?? 0) - (amountForType(a, filters.type) ?? 0);
        }
        return a.listedHoursAgo - b.listedHoursAgo;
    });

    return items;
}

function mockOwnerListingsCities() {
    const byCity = new Map<string, Map<string, number>>();
    for (const item of MOCK_OWNER_LISTINGS) {
        const localities = byCity.get(item.city) ?? new Map<string, number>();
        localities.set(item.locality, (localities.get(item.locality) ?? 0) + 1);
        byCity.set(item.city, localities);
    }
    return {
        items: [...byCity.entries()].map(([city, localities]) => ({
            city,
            listingCount: [...localities.values()].reduce((sum, count) => sum + count, 0),
            localities: [...localities.entries()].map(([name, listingCount]) => ({
                name,
                listingCount,
            })),
        })),
    };
}

/** Mock-only id cursor so infinite scroll still works offline. */
function paginateMockByCursor(
    items: OwnerListingItem[],
    cursor: string | null | undefined,
    limit: number,
): OwnerListingsResult {
    const start = cursor ? items.findIndex((item) => item.id === cursor) + 1 : 0;
    const safeStart = start < 0 ? 0 : start;
    const slice = items.slice(safeStart, safeStart + limit);
    const last = slice[slice.length - 1];
    const hasMore = safeStart + limit < items.length;

    return {
        items: slice,
        totalCount: items.length,
        marketValueInr: slice.reduce((sum, item) => sum + (item.saleAmountInr ?? 0), 0),
        nextCursor: hasMore && last ? last.id : null,
        hasMore,
    };
}

type BrowsePageInput = {
    filters: OwnerListingsFilters;
    allAreas: boolean;
    cursor: string | null;
    limit: number;
    signal?: AbortSignal;
};

async function fetchBrowsePage({
    filters,
    allAreas,
    cursor,
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
            bookmarked: filters.bookmarked || undefined,
            furnishingStatus: filters.furnishing || undefined,
            sort: filters.sort,
            cursor: cursor || undefined,
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

    return {
        items,
        totalCount: result.total,
        marketValueInr,
        nextCursor: result.nextCursor ?? null,
        hasMore: Boolean(result.hasMore && result.nextCursor),
    };
}

/**
 * Broker owner-listings pool from `GET /properties/browse`.
 * - Explicit city/locality: filter to those places
 * - Your areas chip on: only broker service-area listings (`allAreas` omitted)
 * - Your areas chip off / Anywhere: `allAreas=true` → all public owner listings
 * - Cursor keyset pagination via `cursor` / `nextCursor`
 */
export async function fetchOwnerListings(
    filters: OwnerListingsFilters,
    context: OwnerListingsFilterContext = {},
    signal?: AbortSignal,
): Promise<OwnerListingsResult> {
    const limit = filters.limit || DEFAULT_OWNER_LISTINGS_FILTERS.limit;
    const cursor = filters.cursor?.trim() || null;

    if (isMockMode()) {
        const matched = filterMockOwnerListings(filters, context);
        return paginateMockByCursor(matched, cursor, limit);
    }

    const hasLocationFilter = filters.cities.length > 0 || filters.localities.length > 0;

    if (hasLocationFilter) {
        return fetchBrowsePage({
            filters,
            allAreas: true,
            cursor,
            limit,
            signal,
        });
    }

    if (filters.yourAreas) {
        const serviceAreas = context.serviceAreas ?? [];
        if (serviceAreas.length === 0) {
            return {
                items: [],
                totalCount: 0,
                marketValueInr: 0,
                nextCursor: null,
                hasMore: false,
            };
        }

        return fetchBrowsePage({
            filters,
            allAreas: false,
            cursor,
            limit,
            signal,
        });
    }

    return fetchBrowsePage({
        filters,
        allAreas: true,
        cursor,
        limit,
        signal,
    });
}

export async function fetchOwnerListingCities() {
    if (isMockMode()) {
        return mockOwnerListingsCities();
    }
    return propertiesApi.browseCities();
}
