import {
    normalizePropertyCriteria,
    type PropertyListCriteria,
} from "@/lib/properties/list-criteria";

import { browseApiTypeFilters } from "@/features/properties/owner-listings/filter-visibility";

/** Listing filters sent to the Requests & Invitations representation queues. */
export type DealListingApiQuery = {
    transactionType?: "sale" | "rent";
    propertyType?: string;
    subtype?: string;
    subtypes?: string[];
    minPrice?: string;
    maxPrice?: string;
    minAreaSqft?: string;
    maxAreaSqft?: string;
    bhk?: string[];
    bathrooms?: string[];
    balconies?: string[];
    parking?: string[];
    floors?: string[];
    facing?: string[];
    propertyCondition?: string[];
    propertyAge?: string[];
    suitableFor?: string[];
    furnishingStatus?: string;
    listedWithinDays?: string;
    minCommissionPercent?: string;
    maxCommissionPercent?: string;
    minCommissionAmount?: string;
    maxCommissionAmount?: string;
};

/**
 * Turns the deals filter sheet into query params.
 * Category is sent only when the broker picked one, so a subtype that exists
 * in more than one category is not dropped.
 */
export function dealListingApiQuery(
    input?: {
        type?: "" | "sale" | "rent";
        propertyFilters?: Partial<PropertyListCriteria> | null;
    } | null,
): DealListingApiQuery | undefined {
    if (!input) return undefined;
    const criteria = normalizePropertyCriteria({
        ...input.propertyFilters,
        type: input.type || input.propertyFilters?.type || "",
    });
    const query: DealListingApiQuery = {};
    if (criteria.type === "sale" || criteria.type === "rent") {
        query.transactionType = criteria.type;
    }
    if (criteria.category) query.propertyType = criteria.category;
    const types = browseApiTypeFilters("", criteria.propertyType);
    if (types.subtypes?.length) query.subtypes = [...types.subtypes];
    else if (types.subtype) query.subtype = types.subtype;
    if (criteria.min) query.minPrice = criteria.min;
    if (criteria.max) query.maxPrice = criteria.max;
    if (criteria.minAreaSqft) query.minAreaSqft = criteria.minAreaSqft;
    if (criteria.maxAreaSqft) query.maxAreaSqft = criteria.maxAreaSqft;
    if (criteria.bhk.length) query.bhk = criteria.bhk;
    if (criteria.bathrooms.length) query.bathrooms = criteria.bathrooms;
    if (criteria.balconies.length) query.balconies = criteria.balconies;
    if (criteria.parking.length) query.parking = criteria.parking;
    if (criteria.floors.length) query.floors = criteria.floors;
    if (criteria.facing.length) query.facing = criteria.facing;
    if (criteria.propertyConditions.length) query.propertyCondition = criteria.propertyConditions;
    if (criteria.propertyAges.length) query.propertyAge = criteria.propertyAges;
    if (criteria.suitableFor.length) query.suitableFor = criteria.suitableFor;
    if (criteria.furnishing) query.furnishingStatus = criteria.furnishing;
    if (criteria.listedWithinDays) query.listedWithinDays = criteria.listedWithinDays;
    if (criteria.minCommissionPercent) query.minCommissionPercent = criteria.minCommissionPercent;
    if (criteria.maxCommissionPercent) query.maxCommissionPercent = criteria.maxCommissionPercent;
    if (criteria.minCommissionAmount) query.minCommissionAmount = criteria.minCommissionAmount;
    if (criteria.maxCommissionAmount) query.maxCommissionAmount = criteria.maxCommissionAmount;

    const active = Object.values(query).some((value) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value),
    );
    return active ? query : undefined;
}

export function appendDealListingQuery(params: URLSearchParams, deal?: DealListingApiQuery) {
    if (!deal) return;
    const set = (key: string, value?: string) => {
        if (value) params.set(key, value);
    };
    const append = (key: string, values?: string[]) => {
        for (const value of values ?? []) {
            if (value) params.append(key, value);
        }
    };
    set("transactionType", deal.transactionType);
    set("propertyType", deal.propertyType);
    set("subtype", deal.subtype);
    append("subtypes", deal.subtypes);
    set("minPrice", deal.minPrice);
    set("maxPrice", deal.maxPrice);
    set("minAreaSqft", deal.minAreaSqft);
    set("maxAreaSqft", deal.maxAreaSqft);
    append("bhk", deal.bhk);
    append("bathrooms", deal.bathrooms);
    append("balconies", deal.balconies);
    append("parking", deal.parking);
    append("floors", deal.floors);
    append("facing", deal.facing);
    append("propertyCondition", deal.propertyCondition);
    append("propertyAge", deal.propertyAge);
    append("suitableFor", deal.suitableFor);
    set("furnishingStatus", deal.furnishingStatus);
    set("listedWithinDays", deal.listedWithinDays);
    set("minCommissionPercent", deal.minCommissionPercent);
    set("maxCommissionPercent", deal.maxCommissionPercent);
    set("minCommissionAmount", deal.minCommissionAmount);
    set("maxCommissionAmount", deal.maxCommissionAmount);
}
