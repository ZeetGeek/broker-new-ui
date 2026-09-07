"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
    hasActiveMyListingsFilters,
    parseMyListingsFilters,
    serializeMyListingsFilters,
} from "@/features/properties/your-listings/filter-my-listings";
import type { MyListingsFilters } from "@/features/properties/your-listings/types";
import { DEFAULT_MY_LISTINGS_FILTERS } from "@/features/properties/your-listings/types";

export function useMyListingsFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const filters = useMemo(() => {
        const record: Record<string, string | string[]> = {};
        searchParams.forEach((value, key) => {
            if (key === "tab") return;
            const existing = record[key];
            if (existing == null) {
                record[key] = value;
                return;
            }
            if (Array.isArray(existing)) {
                existing.push(value);
                return;
            }
            record[key] = [existing, value];
        });
        return parseMyListingsFilters(record);
    }, [searchParams]);

    const setFilters = useCallback(
        (next: MyListingsFilters | ((prev: MyListingsFilters) => MyListingsFilters)) => {
            const resolved = typeof next === "function" ? next(filters) : next;
            const qs = serializeMyListingsFilters(resolved);
            const tab = searchParams.get("tab");
            if (tab) qs.set("tab", tab);
            const query = qs.toString();
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        },
        [filters, pathname, router, searchParams],
    );

    const clearFilters = useCallback(() => {
        setFilters({ ...DEFAULT_MY_LISTINGS_FILTERS });
    }, [setFilters]);

    return {
        filters,
        setFilters,
        clearFilters,
        hasActiveFilters: hasActiveMyListingsFilters(filters),
        filterSignature: serializeMyListingsFilters(filters).toString(),
    };
}
