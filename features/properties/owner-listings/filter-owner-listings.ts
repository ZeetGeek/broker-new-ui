import type {
    OwnerListingItem,
    OwnerListingPropertyType,
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingsResult,
} from "@/features/properties/owner-listings/types";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";
import { listingCompareAmountInr } from "@/lib/format/listing-availability";

function parseParam(
    params: URLSearchParams | Record<string, string | string[] | undefined>,
    key: string,
): string {
    if (params instanceof URLSearchParams) {
        return params.get(key) ?? "";
    }
    const value = params[key];
    if (Array.isArray(value)) return value[0] ?? "";
    return value ?? "";
}

function parseListParam(
    params: URLSearchParams | Record<string, string | string[] | undefined>,
    key: string,
): string[] {
    if (params instanceof URLSearchParams) {
        const raw = params.get(key);
        if (!raw) return [];
        return raw.split(",").map((part) => part.trim()).filter(Boolean);
    }
    const value = params[key];
    if (!value) return [];
    if (Array.isArray(value)) return value.flatMap((v) => v.split(",")).map((p) => p.trim()).filter(Boolean);
    return value.split(",").map((part) => part.trim()).filter(Boolean);
}

function parseBoolParam(
    params: URLSearchParams | Record<string, string | string[] | undefined>,
    key: string,
): boolean {
    return parseParam(params, key) === "1";
}

const PROPERTY_TYPES = new Set<OwnerListingPropertyType>([
    "apartment",
    "villa",
    "penthouse",
    "shop",
    "office",
    "plot",
]);

export function parseOwnerListingsFilters(
    params: URLSearchParams | Record<string, string | string[] | undefined>,
): OwnerListingsFilters {
    const sort = parseParam(params, "sort");
    const type = parseParam(params, "type");
    const furnishing = parseParam(params, "furnishing");
    const propertyType = parseParam(params, "propertyType");

    return {
        q: parseParam(params, "q"),
        localities: parseListParam(params, "locality"),
        bhk: parseListParam(params, "bhk"),
        type: type === "sale" || type === "rent" ? type : "",
        min: parseParam(params, "min"),
        max: parseParam(params, "max"),
        furnishing:
            furnishing === "furnished" || furnishing === "semi" || furnishing === "unfurnished"
                ? furnishing
                : "",
        propertyType: PROPERTY_TYPES.has(propertyType as OwnerListingPropertyType)
            ? (propertyType as OwnerListingPropertyType)
            : "",
        yourAreas: parseBoolParam(params, "yourAreas"),
        newToday: parseBoolParam(params, "newToday"),
        slotsOpen: parseBoolParam(params, "slotsOpen"),
        commissionSet: parseBoolParam(params, "commissionSet"),
        readyToMove: parseBoolParam(params, "readyToMove"),
        sort: sort === "price_asc" || sort === "price_desc" ? sort : "newest",
        cursor: parseParam(params, "cursor"),
    };
}

export function filtersToSearchParams(filters: OwnerListingsFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.localities.length > 0) params.set("locality", filters.localities.join(","));
    if (filters.bhk.length > 0) params.set("bhk", filters.bhk.join(","));
    if (filters.type) params.set("type", filters.type);
    if (filters.min) params.set("min", filters.min);
    if (filters.max) params.set("max", filters.max);
    if (filters.furnishing) params.set("furnishing", filters.furnishing);
    if (filters.propertyType) params.set("propertyType", filters.propertyType);
    if (filters.yourAreas) params.set("yourAreas", "1");
    if (filters.newToday) params.set("newToday", "1");
    if (filters.slotsOpen) params.set("slotsOpen", "1");
    if (filters.commissionSet) params.set("commissionSet", "1");
    if (filters.readyToMove) params.set("readyToMove", "1");
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (filters.cursor) params.set("cursor", filters.cursor);

    return params;
}

export function countSheetFilters(
    filters: OwnerListingsFilters,
    options?: { includeTypeAndBhk?: boolean },
): number {
    let count = 0;
    if (filters.q.trim()) count++;
    if (filters.propertyType) count++;
    if (filters.furnishing) count++;
    if (options?.includeTypeAndBhk) {
        if (filters.type) count++;
        if (filters.bhk.length > 0) count++;
    }
    return count;
}

export function hasActiveOwnerListingsFilters(filters: OwnerListingsFilters): boolean {
    return (
        Boolean(filters.q.trim()) ||
        filters.localities.length > 0 ||
        filters.bhk.length > 0 ||
        Boolean(filters.type) ||
        Boolean(filters.min) ||
        Boolean(filters.max) ||
        Boolean(filters.furnishing) ||
        Boolean(filters.propertyType) ||
        filters.yourAreas ||
        filters.newToday ||
        filters.slotsOpen ||
        filters.commissionSet ||
        filters.readyToMove ||
        filters.sort !== DEFAULT_OWNER_LISTINGS_FILTERS.sort
    );
}

export function ownerListingsFilterSignature(filters: OwnerListingsFilters): string {
    return [
        filters.q,
        filters.localities.join(","),
        filters.bhk.join(","),
        filters.type,
        filters.min,
        filters.max,
        filters.furnishing,
        filters.propertyType,
        filters.yourAreas ? "1" : "0",
        filters.newToday ? "1" : "0",
        filters.slotsOpen ? "1" : "0",
        filters.commissionSet ? "1" : "0",
        filters.readyToMove ? "1" : "0",
        filters.sort,
        filters.cursor,
    ].join("|");
}

function matchesQuery(item: OwnerListingItem, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;

    const haystack = [
        item.configLabel,
        item.locality,
        item.city,
        item.detailLabel,
        item.furnishingLabel,
        item.propertyTypeLabel,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return haystack.includes(needle);
}

export function filterOwnerListings(
    items: OwnerListingItem[],
    filters: OwnerListingsFilters,
    context: OwnerListingsFilterContext = {},
): OwnerListingsResult {
    const minInr = filters.min ? Number(filters.min) : null;
    const maxInr = filters.max ? Number(filters.max) : null;
    const bhkValues = filters.bhk.map(Number).filter((n) => !Number.isNaN(n));
    const serviceAreas = context.serviceAreas ?? [];

    let filtered = items.filter((item) => {
        if (!matchesQuery(item, filters.q)) return false;

        if (filters.yourAreas && serviceAreas.length > 0) {
            if (!serviceAreas.includes(item.locality)) return false;
        } else if (filters.localities.length > 0 && !filters.localities.includes(item.locality)) {
            return false;
        }

        if (bhkValues.length > 0 && !bhkValues.includes(item.bhk)) return false;
        if (filters.type === "sale" && (item.saleAmountInr == null || item.saleAmountInr <= 0)) {
            return false;
        }
        if (filters.type === "rent" && (item.rentAmountInr == null || item.rentAmountInr <= 0)) {
            return false;
        }
        if (filters.furnishing && item.furnishing !== filters.furnishing) return false;
        if (filters.propertyType && item.propertyTypeLabel !== filters.propertyType) return false;
        if (filters.newToday && !item.isNew) return false;
        if (filters.slotsOpen && item.brokerSlotsOpen <= 0) return false;
        if (filters.commissionSet && item.commissionPercent <= 0) return false;
        if (filters.readyToMove && !item.readyToMove) return false;

        const compareAmount = listingCompareAmountInr(item, filters.type);
        if (minInr !== null && !Number.isNaN(minInr) && compareAmount < minInr) return false;
        if (maxInr !== null && !Number.isNaN(maxInr) && compareAmount > maxInr) return false;
        return true;
    });

    filtered = [...filtered].sort((a, b) => {
        if (filters.sort === "price_asc") {
            return (
                listingCompareAmountInr(a, filters.type) - listingCompareAmountInr(b, filters.type)
            );
        }
        if (filters.sort === "price_desc") {
            return (
                listingCompareAmountInr(b, filters.type) - listingCompareAmountInr(a, filters.type)
            );
        }
        return a.listedHoursAgo - b.listedHoursAgo;
    });

    const marketValueInr = filtered.reduce((sum, item) => sum + (item.saleAmountInr ?? 0), 0);

    return {
        items: filtered,
        totalCount: filtered.length,
        marketValueInr,
        nextCursor: null,
    };
}
