import type { MyListingsFilters, MyListingSort, MyListingStatus } from "@/features/properties/your-listings/types";
import { DEFAULT_MY_LISTINGS_FILTERS } from "@/features/properties/your-listings/types";

function first(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return value[0] ?? "";
    return value ?? "";
}

function all(value: string | string[] | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

export function parseMyListingsFilters(
    params: Record<string, string | string[] | undefined>,
): MyListingsFilters {
    const sortRaw = first(params.sort);
    const sort: MyListingSort =
        sortRaw === "price_asc" || sortRaw === "price_desc" || sortRaw === "newest"
            ? sortRaw
            : "newest";

    const statusRaw = first(params.status);
    const status: MyListingStatus | "" =
        statusRaw === "draft" || statusRaw === "published" || statusRaw === "unpublished"
            ? statusRaw
            : "";

    const typeRaw = first(params.type);
    const type = typeRaw === "sale" || typeRaw === "rent" ? typeRaw : "";

    const propertyTypeRaw = first(params.propertyType);
    const allowedTypes = ["apartment", "villa", "penthouse", "shop", "office", "plot"] as const;
    const propertyType = allowedTypes.includes(propertyTypeRaw as (typeof allowedTypes)[number])
        ? (propertyTypeRaw as MyListingsFilters["propertyType"])
        : "";

    const page = Math.max(1, Number(first(params.page) || "1") || 1);

    return {
        q: first(params.q),
        type,
        propertyType,
        bhk: all(params.bhk),
        status,
        sort,
        page,
    };
}

export function serializeMyListingsFilters(filters: MyListingsFilters): URLSearchParams {
    const q = new URLSearchParams();
    if (filters.q.trim()) q.set("q", filters.q.trim());
    if (filters.type) q.set("type", filters.type);
    if (filters.propertyType) q.set("propertyType", filters.propertyType);
    filters.bhk.forEach((value) => q.append("bhk", value));
    if (filters.status) q.set("status", filters.status);
    if (filters.sort !== "newest") q.set("sort", filters.sort);
    if (filters.page > 1) q.set("page", String(filters.page));
    return q;
}

export function hasActiveMyListingsFilters(filters: MyListingsFilters): boolean {
    return (
        Boolean(filters.q.trim()) ||
        Boolean(filters.type) ||
        Boolean(filters.propertyType) ||
        filters.bhk.length > 0 ||
        Boolean(filters.status) ||
        filters.sort !== DEFAULT_MY_LISTINGS_FILTERS.sort
    );
}
