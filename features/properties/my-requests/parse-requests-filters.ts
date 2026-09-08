import {
    DEFAULT_REQUESTS_FILTERS,
    type RequestsFilters,
    type RequestSort,
    type RequestsViewFilter,
} from "@/features/properties/my-requests/types";

const VIEWS: RequestsViewFilter[] = [
    "all",
    "pending",
    "approved",
    "declined",
    "expired",
    "withdrawn",
    "needs_buyer",
    "closing_soon",
    "not_opened",
];

const SORTS: RequestSort[] = ["recent", "oldest", "waiting_longest", "price_desc", "price_asc"];

const PAGE_SIZES = [10, 20, 50];

function first(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return value[0] ?? "";
    return value ?? "";
}

export function parseRequestsFilters(record: Record<string, string | string[]>): RequestsFilters {
    const view = first(record.view) as RequestsViewFilter;
    const sort = first(record.sort) as RequestSort;
    const page = Number.parseInt(first(record.page), 10);
    const limit = Number.parseInt(first(record.limit), 10);

    return {
        q: first(record.q),
        view: VIEWS.includes(view) ? view : DEFAULT_REQUESTS_FILTERS.view,
        sort: SORTS.includes(sort) ? sort : DEFAULT_REQUESTS_FILTERS.sort,
        page: Number.isFinite(page) && page > 0 ? page : DEFAULT_REQUESTS_FILTERS.page,
        limit: PAGE_SIZES.includes(limit) ? limit : DEFAULT_REQUESTS_FILTERS.limit,
    };
}

/** Only non-default values reach the URL, so a clean view has a clean URL. */
export function serializeRequestsFilters(filters: RequestsFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.view !== "all") params.set("view", filters.view);
    if (filters.sort !== "recent") params.set("sort", filters.sort);
    if (filters.page > 1) params.set("page", String(filters.page));
    if (filters.limit !== DEFAULT_REQUESTS_FILTERS.limit)
        params.set("limit", String(filters.limit));

    return params;
}

export function hasActiveRequestsFilters(filters: RequestsFilters): boolean {
    return filters.q.trim().length > 0 || filters.view !== "all";
}
