import { sessionCountryName } from "@/lib/auth/session";
import { listingCompareAmountInr } from "@/lib/format/listing-availability";

import {
    isOwnerListingCategory,
    isOwnerListingSubtype,
} from "@/features/properties/owner-listings/filter-visibility";
import { normalizeAreaFilterStrings } from "@/features/properties/owner-listings/owner-listings-area-presets";
import type {
    OwnerListingItem,
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingsResult,
} from "@/features/properties/owner-listings/types";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";

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
        return raw
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);
    }
    const value = params[key];
    if (!value) return [];
    if (Array.isArray(value))
        return value
            .flatMap((v) => v.split(","))
            .map((p) => p.trim())
            .filter(Boolean);
    return value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
}

function parseBoolParam(
    params: URLSearchParams | Record<string, string | string[] | undefined>,
    key: string,
): boolean {
    return parseParam(params, key) === "1";
}

function parseNumberParam(
    params: URLSearchParams | Record<string, string | string[] | undefined>,
    key: string,
): string {
    const raw = parseParam(params, key).trim();
    if (!raw) return "";
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? raw : "";
}

/** Commission range as numbers. `null` ends are open. */
export function commissionRanges(filters: OwnerListingsFilters) {
    const toNumber = (value: string) => {
        if (!value) return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };
    return {
        minPercent: toNumber(filters.minCommissionPercent),
        maxPercent: toNumber(filters.maxCommissionPercent),
        minAmount: toNumber(filters.minCommissionAmount),
        maxAmount: toNumber(filters.maxCommissionAmount),
    };
}

/**
 * Clears the commission range that does not apply to "Looking for":
 * Sale keeps only the percent range, Rent keeps only the amount range, Any keeps both.
 */
export function commissionRangeForType(
    type: OwnerListingsFilters["type"],
): Partial<
    Pick<
        OwnerListingsFilters,
        | "minCommissionPercent"
        | "maxCommissionPercent"
        | "minCommissionAmount"
        | "maxCommissionAmount"
    >
> {
    if (type === "sale") return { minCommissionAmount: "", maxCommissionAmount: "" };
    if (type === "rent") return { minCommissionPercent: "", maxCommissionPercent: "" };
    return {};
}

function hasCommissionRange(filters: OwnerListingsFilters): boolean {
    return Boolean(
        filters.minCommissionPercent ||
        filters.maxCommissionPercent ||
        filters.minCommissionAmount ||
        filters.maxCommissionAmount,
    );
}

function parseListedWithinDays(value: string): string {
    return value === "7" || value === "30" ? value : "";
}

export function parseOwnerListingsFilters(
    params: URLSearchParams | Record<string, string | string[] | undefined>,
): OwnerListingsFilters {
    const sort = parseParam(params, "sort");
    const type = parseParam(params, "type");
    const furnishing = parseParam(params, "furnishing");
    const categoryRaw = parseParam(params, "category");
    const propertyType = parseParam(params, "propertyType");
    const countries = parseListParam(params, "country");
    const states = parseListParam(params, "state");
    const cities = parseListParam(params, "city");
    const localities = parseListParam(params, "locality");
    const yourAreasRaw = parseParam(params, "yourAreas");
    const hasLocationFilter =
        countries.length > 0 || states.length > 0 || cities.length > 0 || localities.length > 0;
    // Explicit place picks turn off your-areas priority.
    // Missing param defaults to Anywhere. Saved prefs and yourAreas=1 still select serviceable areas.
    const yourAreas = hasLocationFilter ? false : yourAreasRaw === "1";

    return {
        q: parseParam(params, "q"),
        countries,
        states,
        cities,
        localities,
        bhk: parseListParam(params, "bhk"),
        bathrooms: parseListParam(params, "baths"),
        balconies: parseListParam(params, "balconies"),
        parking: parseListParam(params, "parking"),
        floors: parseListParam(params, "floors"),
        facing: parseListParam(params, "facing"),
        propertyConditions: parseListParam(params, "condition"),
        propertyAges: parseListParam(params, "age"),
        suitableFor: parseListParam(params, "suitableFor"),
        type: type === "sale" || type === "rent" ? type : "",
        min: parseParam(params, "min"),
        max: parseParam(params, "max"),
        furnishing:
            furnishing === "furnished" || furnishing === "semi" || furnishing === "unfurnished"
                ? furnishing
                : "",
        category: isOwnerListingCategory(categoryRaw) ? categoryRaw : "",
        propertyType: isOwnerListingSubtype(propertyType) ? propertyType : "",
        ...normalizeAreaFilterStrings(parseParam(params, "minArea"), parseParam(params, "maxArea")),
        listedWithinDays: parseListedWithinDays(parseParam(params, "listedWithin")),
        minCommissionPercent: parseNumberParam(params, "minCommission"),
        maxCommissionPercent: parseNumberParam(params, "maxCommission"),
        minCommissionAmount: parseNumberParam(params, "minCommissionAmt"),
        maxCommissionAmount: parseNumberParam(params, "maxCommissionAmt"),
        yourAreas,
        newToday: parseBoolParam(params, "newToday"),
        slotsOpen: parseBoolParam(params, "slotsOpen"),
        commissionSet: parseBoolParam(params, "commissionSet"),
        readyToMove: parseBoolParam(params, "readyToMove"),
        sort: sort === "price_asc" || sort === "price_desc" ? sort : "newest",
        cursor: parseParam(params, "cursor"),
        limit: parseLimitParam(params),
    };
}

function parseLimitParam(
    params: URLSearchParams | Record<string, string | string[] | undefined>,
): number {
    const raw = Number(parseParam(params, "limit"));
    if (raw === 10 || raw === 20 || raw === 30 || raw === 50) return raw;
    return DEFAULT_OWNER_LISTINGS_FILTERS.limit;
}

export function filtersToSearchParams(filters: OwnerListingsFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.countries.length > 0) params.set("country", filters.countries.join(","));
    if (filters.states.length > 0) params.set("state", filters.states.join(","));
    if (filters.cities.length > 0) params.set("city", filters.cities.join(","));
    if (filters.localities.length > 0) params.set("locality", filters.localities.join(","));
    if (filters.bhk.length > 0) params.set("bhk", filters.bhk.join(","));
    if (filters.bathrooms.length > 0) params.set("baths", filters.bathrooms.join(","));
    if (filters.balconies.length > 0) params.set("balconies", filters.balconies.join(","));
    if (filters.parking.length > 0) params.set("parking", filters.parking.join(","));
    if (filters.floors.length > 0) params.set("floors", filters.floors.join(","));
    if (filters.facing.length > 0) params.set("facing", filters.facing.join(","));
    if (filters.propertyConditions.length > 0) {
        params.set("condition", filters.propertyConditions.join(","));
    }
    if (filters.propertyAges.length > 0) params.set("age", filters.propertyAges.join(","));
    if (filters.suitableFor.length > 0) params.set("suitableFor", filters.suitableFor.join(","));
    if (filters.type) params.set("type", filters.type);
    if (filters.min) params.set("min", filters.min);
    if (filters.max) params.set("max", filters.max);
    if (filters.furnishing) params.set("furnishing", filters.furnishing);
    if (filters.category) params.set("category", filters.category);
    if (filters.propertyType) params.set("propertyType", filters.propertyType);
    if (filters.minAreaSqft) params.set("minArea", filters.minAreaSqft);
    if (filters.maxAreaSqft) params.set("maxArea", filters.maxAreaSqft);
    if (filters.listedWithinDays) params.set("listedWithin", filters.listedWithinDays);
    if (filters.minCommissionPercent) params.set("minCommission", filters.minCommissionPercent);
    if (filters.maxCommissionPercent) params.set("maxCommission", filters.maxCommissionPercent);
    if (filters.minCommissionAmount) params.set("minCommissionAmt", filters.minCommissionAmount);
    if (filters.maxCommissionAmount) params.set("maxCommissionAmt", filters.maxCommissionAmount);
    // Persist Your areas chip when Where is not pinned to a place.
    if (
        filters.countries.length === 0 &&
        filters.states.length === 0 &&
        filters.cities.length === 0 &&
        filters.localities.length === 0
    ) {
        params.set("yourAreas", filters.yourAreas ? "1" : "0");
    }
    if (filters.newToday) params.set("newToday", "1");
    if (filters.slotsOpen) params.set("slotsOpen", "1");
    if (filters.commissionSet) params.set("commissionSet", "1");
    if (filters.readyToMove) params.set("readyToMove", "1");
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (filters.cursor) params.set("cursor", filters.cursor);
    if (filters.limit !== DEFAULT_OWNER_LISTINGS_FILTERS.limit) {
        params.set("limit", String(filters.limit));
    }

    return params;
}

/** Counts Advanced sheet controls (layout, listed, commission, …). */
export function countSheetFilters(filters: OwnerListingsFilters): number {
    let count = 0;
    if (filters.listedWithinDays) count++;
    if (hasCommissionRange(filters)) count++;
    if (filters.bhk.length > 0) count++;
    if (filters.bathrooms.length > 0) count++;
    if (filters.balconies.length > 0) count++;
    if (filters.parking.length > 0) count++;
    if (filters.floors.length > 0) count++;
    if (filters.facing.length > 0) count++;
    if (filters.propertyConditions.length > 0) count++;
    if (filters.propertyAges.length > 0) count++;
    if (filters.suitableFor.length > 0) count++;
    if (filters.furnishing) count++;
    if (filters.readyToMove && !filters.propertyConditions.includes("ready_to_move")) count++;
    return count;
}

export function hasActiveOwnerListingsFilters(filters: OwnerListingsFilters): boolean {
    return (
        Boolean(filters.q.trim()) ||
        filters.countries.length > 0 ||
        filters.states.length > 0 ||
        filters.cities.length > 0 ||
        filters.localities.length > 0 ||
        filters.bhk.length > 0 ||
        filters.bathrooms.length > 0 ||
        filters.balconies.length > 0 ||
        filters.parking.length > 0 ||
        filters.floors.length > 0 ||
        filters.facing.length > 0 ||
        filters.propertyConditions.length > 0 ||
        filters.propertyAges.length > 0 ||
        filters.suitableFor.length > 0 ||
        Boolean(filters.type) ||
        Boolean(filters.min) ||
        Boolean(filters.max) ||
        Boolean(filters.furnishing) ||
        Boolean(filters.category) ||
        Boolean(filters.propertyType) ||
        Boolean(filters.minAreaSqft) ||
        Boolean(filters.maxAreaSqft) ||
        Boolean(filters.listedWithinDays) ||
        hasCommissionRange(filters) ||
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
        filters.countries.join(","),
        filters.states.join(","),
        filters.cities.join(","),
        filters.localities.join(","),
        filters.bhk.join(","),
        filters.bathrooms.join(","),
        filters.balconies.join(","),
        filters.parking.join(","),
        filters.floors.join(","),
        filters.facing.join(","),
        filters.propertyConditions.join(","),
        filters.propertyAges.join(","),
        filters.suitableFor.join(","),
        filters.type,
        filters.min,
        filters.max,
        filters.furnishing,
        filters.category,
        filters.propertyType,
        filters.minAreaSqft,
        filters.maxAreaSqft,
        filters.listedWithinDays,
        filters.minCommissionPercent,
        filters.maxCommissionPercent,
        filters.minCommissionAmount,
        filters.maxCommissionAmount,
        filters.yourAreas ? "1" : "0",
        filters.newToday ? "1" : "0",
        filters.slotsOpen ? "1" : "0",
        filters.commissionSet ? "1" : "0",
        filters.readyToMove ? "1" : "0",
        filters.sort,
        filters.cursor,
        String(filters.limit),
    ].join("|");
}

/** Missing listing data → pass through (design filters until browse API fills fields). */
function matchesBathroomChips(selected: string[], value: number | null | undefined): boolean {
    if (selected.length === 0) return true;
    if (value == null || !Number.isFinite(value)) return true;
    return selected.some((chip) => {
        const n = Number(chip);
        if (!Number.isFinite(n)) return false;
        return chip === "5" ? value >= 5 : value === n;
    });
}

function matchesPlusChips(
    selected: string[],
    value: number | null | undefined,
    plusAt: number,
): boolean {
    if (selected.length === 0) return true;
    if (value == null || !Number.isFinite(value)) return true;
    return selected.some((chip) => {
        const n = Number(chip);
        if (!Number.isFinite(n)) return false;
        return n >= plusAt ? value >= n : value === n;
    });
}

function matchesFloorBucket(selected: string[], floor: number | null | undefined): boolean {
    if (selected.length === 0) return true;
    if (floor == null || !Number.isFinite(floor)) return true;
    return selected.some((bucket) => {
        if (bucket === "ground") return floor <= 0;
        if (bucket === "low") return floor >= 1 && floor <= 5;
        if (bucket === "mid") return floor >= 6 && floor <= 15;
        if (bucket === "high") return floor >= 16;
        return false;
    });
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
    const commission = commissionRanges(filters);
    const bhkValues = filters.bhk.map(Number).filter((n) => !Number.isNaN(n));
    const serviceAreas = context.serviceAreas ?? [];

    let filtered = items.filter((item) => {
        if (!matchesQuery(item, filters.q)) return false;

        const hasPlaceFilter =
            filters.countries.length > 0 ||
            filters.states.length > 0 ||
            filters.cities.length > 0 ||
            filters.localities.length > 0;

        if (hasPlaceFilter) {
            const itemCountry = item.country?.trim() || sessionCountryName();
            const itemState = item.state?.trim() || item.city;
            const itemCity = item.city.toLowerCase();
            const stateKey = `${itemCountry}|${itemState}`.toLowerCase();

            const matchesCountry = filters.countries.some(
                (country) => country.toLowerCase() === itemCountry.toLowerCase(),
            );
            const matchesState = filters.states.some((state) => state.toLowerCase() === stateKey);
            const matchesCity = filters.cities.some((city) => city.toLowerCase() === itemCity);
            const matchesLocality = filters.localities.includes(item.locality);

            if (!matchesCountry && !matchesState && !matchesCity && !matchesLocality) {
                return false;
            }
        }

        if (bhkValues.length > 0 && !bhkValues.includes(item.bhk)) return false;
        if (!matchesBathroomChips(filters.bathrooms, item.bathrooms)) return false;
        if (!matchesPlusChips(filters.balconies, item.balconies, 4)) return false;
        if (!matchesPlusChips(filters.parking, item.parkingSpaces, 4)) return false;
        if (!matchesFloorBucket(filters.floors, item.floorNumber)) return false;
        if (filters.facing.length > 0 && item.facing && !filters.facing.includes(item.facing)) {
            return false;
        }
        if (
            filters.propertyConditions.length > 0 &&
            item.propertyCondition &&
            !filters.propertyConditions.includes(item.propertyCondition)
        ) {
            return false;
        }
        if (
            filters.propertyAges.length > 0 &&
            item.propertyAge &&
            !filters.propertyAges.includes(item.propertyAge)
        ) {
            return false;
        }
        if (filters.suitableFor.length > 0 && item.suitableFor && item.suitableFor.length > 0) {
            const tags = new Set(item.suitableFor);
            if (!filters.suitableFor.some((tag) => tags.has(tag))) return false;
        }
        if (filters.type === "sale" && (item.saleAmountInr == null || item.saleAmountInr <= 0)) {
            return false;
        }
        if (filters.type === "rent" && (item.rentAmountInr == null || item.rentAmountInr <= 0)) {
            return false;
        }
        if (filters.furnishing && item.furnishing !== filters.furnishing) return false;
        if (filters.category) {
            const itemCategory = item.category || "";
            if (itemCategory && itemCategory !== filters.category) return false;
        }
        if (filters.propertyType) {
            const subtype = item.subtype || item.propertyTypeLabel;
            const matchesSubtype =
                subtype === filters.propertyType ||
                item.propertyTypeLabel === filters.propertyType ||
                (filters.propertyType === "office" && subtype === "office_space") ||
                (filters.propertyType === "office_space" && item.propertyTypeLabel === "office") ||
                (filters.propertyType === "plot" &&
                    (item.propertyTypeLabel === "plot" || Boolean(item.subtype?.includes("plot"))));
            if (!matchesSubtype) return false;
        }
        if (filters.newToday && !item.isNew) return false;
        if (filters.slotsOpen && item.brokerSlotsOpen <= 0) return false;
        if (filters.commissionSet && item.commissionPercent <= 0 && item.commissionAmount <= 0)
            return false;
        const wantsReadyToMove =
            filters.readyToMove || filters.propertyConditions.includes("ready_to_move");
        if (wantsReadyToMove && !item.readyToMove) return false;

        const minArea = filters.minAreaSqft ? Number(filters.minAreaSqft) : null;
        const maxArea =
            filters.maxAreaSqft && !filters.maxAreaSqft.endsWith("+")
                ? Number(filters.maxAreaSqft)
                : null;
        if (minArea !== null && !Number.isNaN(minArea) && item.areaSqft < minArea) return false;
        if (maxArea !== null && !Number.isNaN(maxArea) && item.areaSqft > maxArea) return false;

        const listedWithinDays = filters.listedWithinDays ? Number(filters.listedWithinDays) : null;
        if (
            listedWithinDays !== null &&
            !Number.isNaN(listedWithinDays) &&
            item.listedHoursAgo > listedWithinDays * 24
        ) {
            return false;
        }

        if (commission.minPercent !== null && item.commissionPercent < commission.minPercent) {
            return false;
        }
        if (commission.maxPercent !== null && item.commissionPercent > commission.maxPercent) {
            return false;
        }
        if (commission.minAmount !== null && item.commissionAmount < commission.minAmount) {
            return false;
        }
        if (commission.maxAmount !== null && item.commissionAmount > commission.maxAmount) {
            return false;
        }

        if (filters.yourAreas && serviceAreas.length > 0) {
            const areaSet = new Set(serviceAreas.map((area) => area.toLowerCase()));
            const locality = item.locality.toLowerCase();
            const city = item.city.toLowerCase();
            const inArea = [...areaSet].some(
                (area) =>
                    locality === area ||
                    city === area ||
                    locality.includes(area) ||
                    city.includes(area),
            );
            if (!inArea) return false;
        }

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
        hasMore: false,
    };
}
