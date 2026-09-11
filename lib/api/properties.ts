import { apiFetch } from "@/lib/api/client";

export type PropertyBrowseSort = "newest" | "price_asc" | "price_desc";
export type PropertyPublishStatus = "draft" | "published";

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
    /** Owner-shared broker commission percent (optional). */
    commissionPercent?: string | number | null;
    photos?: string[] | null;
    furnishingStatus?: "furnished" | "semi" | "unfurnished" | string | null;
    availableFrom?: string | null;
    publishedAt?: string | null;
    createdAt?: string | null;
    /** True when created within the last 7 days (from API). */
    isNew?: boolean;
    ownerName?: string | null;
    ownerAvatarUrl?: string | null;
    /** `users.id` for the listing owner. */
    ownerUserId?: string | null;
    /** `owners.id` when the API sends the profile row separately. */
    ownerProfileId?: string | null;
    owner?: {
        id?: string | null;
        userId?: string | null;
        profileId?: string | null;
    } | null;
    /** Where the owner is based. Not yet sent by the browse API. */
    ownerCity?: string | null;
    /** Owner locality within `ownerCity`. Not yet sent by the browse API. */
    ownerLocality?: string | null;
    organizationName?: string | null;
    representation?: PropertyRepresentationStanding | null;
    /**
     * Consent-gated. Present only when `representation.status === "accepted"`.
     * Never trust a nested owner phone on browse payloads.
     */
    ownerPhone?: string | null;
};

/** Inventory listing returned by `GET /properties` (and get/create/update). */
export type PropertyListing = PropertyBrowseListing & {
    visibility?: "public" | "private" | string | null;
    publishStatus?: PropertyPublishStatus | string | null;
    isDraft?: boolean;
    postalCode?: string | null;
    balconyCount?: number | null;
    floorNumber?: number | null;
    totalFloors?: number | null;
    facingDirection?: string | null;
    parkingSpaces?: number | null;
    amenities?: string[] | null;
    description?: string | null;
    maintenanceCharges?: string | number | null;
    updatedAt?: string | null;
    permissions?: {
        canEdit?: boolean;
        canAssign?: boolean;
        canUnassign?: boolean;
        canPublish?: boolean;
    };
};

export type PropertyBrowsePage = {
    items: PropertyBrowseListing[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type PropertyListPage = {
    items: PropertyListing[];
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

export type PropertyListingOptions = {
    counts: {
        total: number;
        assigned: number;
        unassigned: number;
        draft: number;
        published: number;
    };
    capabilities?: {
        canView?: boolean;
        canManage?: boolean;
        canPublish?: boolean;
        canAssign?: boolean;
        canUnassign?: boolean;
        canConfigurePolicy?: boolean;
    };
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
    minAreaSqft?: number;
    maxAreaSqft?: number;
    listedWithinDays?: number;
    minCommissionPercent?: number;
    commissionSet?: boolean;
    readyToMove?: boolean;
    furnishingStatus?: "furnished" | "semi" | "unfurnished";
    sort?: PropertyBrowseSort;
    page?: number;
    limit?: number;
};

export type PropertyListQuery = {
    search?: string;
    city?: string;
    transactionType?: "sale" | "rent" | "both";
    propertyType?: string;
    subtype?: string;
    bhkConfig?: string[];
    publishStatus?: PropertyPublishStatus;
    sort?: PropertyBrowseSort | "title";
    page?: number;
    limit?: number;
};

export type CreatePropertyInput = {
    visibility: "public" | "private";
    publishStatus?: PropertyPublishStatus;
    transactionType: "sale" | "rent" | "both";
    city: string;
    propertyType?: string;
    subtype?: string;
    bhkConfig?: string;
    title?: string;
    bedrooms?: number;
    bathrooms?: number;
    balconyCount?: number;
    floorNumber?: number;
    totalFloors?: number;
    areaSqft?: number;
    address?: string;
    postalCode?: string;
    country?: string;
    status?: string;
    salePrice?: number;
    monthlyRent?: number;
    maintenanceCharges?: number;
    commissionPercent?: number;
    furnishingStatus?: string;
    facingDirection?: string;
    parkingSpaces?: number;
    availableFrom?: string;
    description?: string;
    amenities?: string[];
    photos?: File[];
};

export type UpdatePropertyInput = Partial<Omit<CreatePropertyInput, "photos">> & {
    photos?: File[];
    deletePhotoUrls?: string[];
};

function appendList(q: URLSearchParams, key: string, values: string[] | undefined) {
    if (!values?.length) return;
    values.forEach((value) => q.append(key, value));
}

function buildBrowseQuery(params?: PropertyBrowseQuery) {
    const q = new URLSearchParams();
    if (!params) return "";

    if (params.search) q.set("search", params.search);
    appendList(q, "city", params.city);
    appendList(q, "locality", params.locality);
    if (params.allAreas) q.set("allAreas", "1");
    if (params.transactionType) q.set("transactionType", params.transactionType);
    if (params.propertyType) q.set("propertyType", params.propertyType);
    if (params.subtype) q.set("subtype", params.subtype);
    appendList(q, "bhkConfig", params.bhkConfig);
    if (params.minPrice != null && !Number.isNaN(params.minPrice)) {
        q.set("minPrice", String(params.minPrice));
    }
    if (params.maxPrice != null && !Number.isNaN(params.maxPrice)) {
        q.set("maxPrice", String(params.maxPrice));
    }
    if (params.minAreaSqft != null && !Number.isNaN(params.minAreaSqft)) {
        q.set("minAreaSqft", String(params.minAreaSqft));
    }
    if (params.maxAreaSqft != null && !Number.isNaN(params.maxAreaSqft)) {
        q.set("maxAreaSqft", String(params.maxAreaSqft));
    }
    if (params.listedWithinDays != null && !Number.isNaN(params.listedWithinDays)) {
        q.set("listedWithinDays", String(params.listedWithinDays));
    }
    if (params.minCommissionPercent != null && !Number.isNaN(params.minCommissionPercent)) {
        q.set("minCommissionPercent", String(params.minCommissionPercent));
    }
    if (params.commissionSet) q.set("commissionSet", "1");
    if (params.readyToMove) q.set("readyToMove", "1");
    if (params.furnishingStatus) q.set("furnishingStatus", params.furnishingStatus);
    if (params.sort) q.set("sort", params.sort);
    if (params.page != null && params.page > 1) q.set("page", String(params.page));
    if (params.limit != null) q.set("limit", String(params.limit));

    const qs = q.toString();
    return qs ? `?${qs}` : "";
}

function buildListQuery(params?: PropertyListQuery) {
    const q = new URLSearchParams();
    if (!params) return "";

    if (params.search) q.set("search", params.search);
    if (params.city) q.set("city", params.city);
    if (params.transactionType) q.set("transactionType", params.transactionType);
    if (params.propertyType) q.set("propertyType", params.propertyType);
    if (params.subtype) q.set("subtype", params.subtype);
    appendList(q, "bhkConfig", params.bhkConfig);
    if (params.publishStatus) q.set("publishStatus", params.publishStatus);
    if (params.sort) q.set("sort", params.sort);
    if (params.page != null && params.page > 1) q.set("page", String(params.page));
    if (params.limit != null) q.set("limit", String(params.limit));

    const qs = q.toString();
    return qs ? `?${qs}` : "";
}

function appendFormFields(
    form: FormData,
    fields: Record<string, string | number | boolean | undefined | null>,
) {
    Object.entries(fields).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        form.append(key, String(value));
    });
}

export const propertiesApi = {
    browse(params?: PropertyBrowseQuery, signal?: AbortSignal) {
        return apiFetch<PropertyBrowsePage>(`/properties/browse${buildBrowseQuery(params)}`, {
            signal,
        });
    },

    browseCities() {
        return apiFetch<PropertyBrowseCitiesResponse>("/properties/browse/cities");
    },

    /** One public owner listing for the Owner-listings detail page. */
    browseById(id: string) {
        return apiFetch<
            PropertyListing & {
                representation?: PropertyRepresentationStanding | null;
                ownerPhone?: string | null;
            }
        >(`/properties/browse/${id}`);
    },

    /** Caller's inventory listings (My listings). */
    list(params?: PropertyListQuery, signal?: AbortSignal) {
        return apiFetch<PropertyListPage>(`/properties${buildListQuery(params)}`, { signal });
    },

    options() {
        return apiFetch<PropertyListingOptions>("/properties/options");
    },

    get(id: string) {
        return apiFetch<PropertyListing>(`/properties/${id}`);
    },

    create(input: CreatePropertyInput) {
        const form = new FormData();
        const { photos, amenities, ...fields } = input;
        appendFormFields(form, fields);
        (amenities ?? []).forEach((amenity) => form.append("amenities", amenity));
        (photos ?? []).forEach((file) => form.append("photos", file));
        return apiFetch<PropertyListing>("/properties", { method: "POST", body: form });
    },

    update(id: string, input: UpdatePropertyInput) {
        const form = new FormData();
        const { photos, deletePhotoUrls, amenities, ...fields } = input;
        appendFormFields(form, fields);
        (amenities ?? []).forEach((amenity) => form.append("amenities", amenity));
        (deletePhotoUrls ?? []).forEach((url) => form.append("deletePhotoUrls", url));
        (photos ?? []).forEach((file) => form.append("photos", file));
        return apiFetch<PropertyListing>(`/properties/${id}`, { method: "POST", body: form });
    },

    setPublication(id: string, publishStatus: PropertyPublishStatus) {
        return apiFetch<PropertyListing>(`/properties/${id}/publication`, {
            method: "PATCH",
            body: JSON.stringify({ publishStatus }),
        });
    },
};
