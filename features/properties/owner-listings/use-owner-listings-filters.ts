"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
    filtersToSearchParams,
    hasActiveOwnerListingsFilters,
    ownerListingsFilterSignature,
    parseOwnerListingsFilters,
} from "@/features/properties/owner-listings/filter-owner-listings";
import type { OwnerListingsFilters } from "@/features/properties/owner-listings/types";

export function useOwnerListingsFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const filters = useMemo(
        () => parseOwnerListingsFilters(searchParams),
        [searchParams],
    );

    const replaceFilters = useCallback(
        (next: OwnerListingsFilters) => {
            const params = filtersToSearchParams(next);
            const query = params.toString();
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        },
        [pathname, router],
    );

    const setFilters = useCallback(
        (patch: Partial<OwnerListingsFilters>) => {
            replaceFilters({ ...filters, ...patch });
        },
        [filters, replaceFilters],
    );

    const toggleFilter = useCallback(
        <K extends keyof OwnerListingsFilters>(key: K, value: OwnerListingsFilters[K]) => {
            setFilters({ [key]: filters[key] === value ? ("" as OwnerListingsFilters[K]) : value });
        },
        [filters, setFilters],
    );

    const clearFilters = useCallback(() => {
        router.replace(pathname, { scroll: false });
    }, [pathname, router]);

    const toggleQuickChip = useCallback(
        (key: "yourAreas" | "newToday" | "slotsOpen" | "commissionSet" | "readyToMove") => {
            setFilters({ [key]: !filters[key] });
        },
        [filters, setFilters],
    );

    const applyFilters = useCallback(
        (next: OwnerListingsFilters) => {
            replaceFilters(next);
        },
        [replaceFilters],
    );

    return {
        filters,
        setFilters,
        toggleFilter,
        toggleQuickChip,
        applyFilters,
        clearFilters,
        hasActiveFilters: hasActiveOwnerListingsFilters(filters),
        filterSignature: ownerListingsFilterSignature(filters),
    };
}
