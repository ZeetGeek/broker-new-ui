"use client";

import { useCallback, useMemo } from "react";

import { PREF_KEYS } from "@/lib/prefs/keys";
import { useUrlSyncedPrefs } from "@/hooks/use-url-synced-prefs";

import {
    hasActiveMyListingsFilters,
    normalizeMyListingsStoredFilters,
    parseMyListingsFilters,
    serializeMyListingsFilters,
} from "@/features/properties/your-listings/filter-my-listings";
import type { MyListingsFilters } from "@/features/properties/your-listings/types";
import { DEFAULT_MY_LISTINGS_FILTERS } from "@/features/properties/your-listings/types";

const MY_LISTINGS_URL_KEYS = [
    "q",
    "ownerId",
    "clientId",
    "type",
    "propertyType",
    "bhk",
    "status",
    "sort",
    "propertyFilters",
] as const;

function isMyListingsFilters(value: unknown): value is MyListingsFilters {
    if (typeof value !== "object" || value === null) return false;
    const v = value as Partial<MyListingsFilters>;
    return typeof v.q === "string" && Array.isArray(v.bhk) && typeof v.sort === "string";
}

function parse(params: URLSearchParams): MyListingsFilters {
    const record: Record<string, string | string[]> = {};
    params.forEach((value, key) => {
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
}

function serialize(filters: MyListingsFilters): URLSearchParams {
    return serializeMyListingsFilters(normalizeMyListingsStoredFilters(filters));
}

export function useMyListingsFilters(peopleEnabled = false) {
    const {
        value: filters,
        replace,
        ready,
    } = useUrlSyncedPrefs<MyListingsFilters>({
        storageKey: PREF_KEYS.broker.myListings.filters,
        urlKeys: MY_LISTINGS_URL_KEYS,
        preserveUrlKeys: ["tab"],
        parse,
        serialize,
        forStorage: normalizeMyListingsStoredFilters,
        isValid: isMyListingsFilters,
    });

    const setFilters = useCallback(
        (next: MyListingsFilters | ((prev: MyListingsFilters) => MyListingsFilters)) => {
            const resolved = typeof next === "function" ? next(filters) : next;
            replace(resolved);
        },
        [filters, replace],
    );

    const clearFilters = useCallback(() => {
        replace({ ...DEFAULT_MY_LISTINGS_FILTERS });
    }, [replace]);

    const normalizedFilters = useMemo(
        () =>
            normalizeMyListingsStoredFilters({
                ...filters,
                ...(!peopleEnabled ? { ownerId: "", clientId: "" } : {}),
            }),
        [filters, peopleEnabled],
    );
    return {
        filters: normalizedFilters,
        setFilters,
        clearFilters,
        hasActiveFilters: hasActiveMyListingsFilters(normalizedFilters),
        filterSignature: serializeMyListingsFilters(normalizedFilters).toString(),
        scopeReady: ready,
    };
}
