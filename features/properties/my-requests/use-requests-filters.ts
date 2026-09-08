"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
    hasActiveRequestsFilters,
    parseRequestsFilters,
    serializeRequestsFilters,
} from "@/features/properties/my-requests/parse-requests-filters";
import {
    DEFAULT_REQUESTS_FILTERS,
    type RequestsFilters,
} from "@/features/properties/my-requests/types";

export function useRequestsFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const filters = useMemo(() => {
        const record: Record<string, string | string[]> = {};
        searchParams.forEach((value, key) => {
            record[key] = value;
        });
        return parseRequestsFilters(record);
    }, [searchParams]);

    const setFilters = useCallback(
        (next: RequestsFilters | ((prev: RequestsFilters) => RequestsFilters)) => {
            const resolved = typeof next === "function" ? next(filters) : next;
            const query = serializeRequestsFilters(resolved).toString();
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        },
        [filters, pathname, router],
    );

    /** Any filter change resets to page 1 — page 4 of a new result set is empty. */
    const patchFilters = useCallback(
        (patch: Partial<RequestsFilters>) => {
            setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
        },
        [setFilters],
    );

    const clearFilters = useCallback(() => {
        setFilters({ ...DEFAULT_REQUESTS_FILTERS, limit: filters.limit });
    }, [filters.limit, setFilters]);

    return {
        filters,
        setFilters,
        patchFilters,
        clearFilters,
        hasActiveFilters: hasActiveRequestsFilters(filters),
        filterSignature: serializeRequestsFilters(filters).toString(),
    };
}
