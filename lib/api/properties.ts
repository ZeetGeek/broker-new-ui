import { apiFetch } from "@/lib/api/client";

export type PropertyBrowseSort = "newest" | "price_asc" | "price_desc";

export type PropertyRepresentationStanding = {
    id: string;
    status: string;
    initiatedBy: "owner" | "broker" | string;
    message?: string | null;
    createdAt?: string | null;
    createdByUserId?: string | null;
    createdByName?: string | null;
};

export type PropertyBrowseListing = {
    id: string;
    title?: string | null;
    transactionType?: "sale" | "rent" | "both" | string | null;
    propertyType?: string | null;
    subtype?: string | null;
    bhkConfig?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    areaSqft?: number | null;
    city?: string | null;
    address?: string | null;
    country?: string | null;
    status?: string | null;
    salePrice?: string | number | null;
    monthlyRent?: string | number | null;
    photos?: string[] | null;
    furnishingStatus?: "furnished" | "semi" | "unfurnished" | string | null;
    availableFrom?: string | null;
    publishedAt?: string | null;
    createdAt?: string | null;
    /** True when created within the last 7 days (from API). */
    isNew?: boolean;
    ownerName?: string | null;
    ownerAvatarUrl?: string | null;
    organizationName?: string | null;
    representation?: PropertyRepresentationStanding | null;
};

export type PropertyBrowsePage = {
    items: PropertyBrowseListing[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type PropertyBrowseCityLocality = {
    name: string;
    listingCount: number;
};

export type PropertyBrowseCity = {
    city: string;
    listingCount: number;
    localities: PropertyBrowseCityLocality[];
};

export type PropertyBrowseCitiesResponse = {
    items: PropertyBrowseCity[];
};

export type PropertyBrowseQuery = {
    search?: string;
    city?: string[];
    locality?: string[];
    /** Skip broker service-area scope (Where → Anywhere). */
    allAreas?: boolean;
    transactionType?: "sale" | "rent" | "both";
    propertyType?: string;
    subtype?: string;
    bhkConfig?: string[];
    minPrice?: number;
    maxPrice?: number;
    furnishingStatus?: "furnished" | "semi" | "unfurnished";
    sort?: PropertyBrowseSort;
    page?: number;
    limit?: number;
};

function buildBrowseQuery(params?: PropertyBrowseQuery) {
    const q = new URLSearchParams();
    if (!params) return "";

    if (params.search) q.set("search", params.search);
    if (params.city?.length) {
        params.city.forEach((city) => q.append("city", city));
    }
    if (params.locality?.length) {
        params.locality.forEach((locality) => q.append("locality", locality));
    }
    if (params.allAreas) q.set("allAreas", "1");
    if (params.transactionType) q.set("transactionType", params.transactionType);
    if (params.propertyType) q.set("propertyType", params.propertyType);
    if (params.subtype) q.set("subtype", params.subtype);
    if (params.bhkConfig?.length) {
        params.bhkConfig.forEach((value) => q.append("bhkConfig", value));
    }
    if (params.minPrice != null && !Number.isNaN(params.minPrice)) {
        q.set("minPrice", String(params.minPrice));
    }
    if (params.maxPrice != null && !Number.isNaN(params.maxPrice)) {
        q.set("maxPrice", String(params.maxPrice));
    }
    if (params.furnishingStatus) q.set("furnishingStatus", params.furnishingStatus);
    if (params.sort) q.set("sort", params.sort);
    if (params.page != null && params.page > 1) q.set("page", String(params.page));
    if (params.limit != null) q.set("limit", String(params.limit));

    const qs = q.toString();
    return qs ? `?${qs}` : "";
}

export const propertiesApi = {
    browse(params?: PropertyBrowseQuery) {
        return apiFetch<PropertyBrowsePage>(`/properties/browse${buildBrowseQuery(params)}`);
    },

    browseCities() {
        return apiFetch<PropertyBrowseCitiesResponse>("/properties/browse/cities");
    },
};
