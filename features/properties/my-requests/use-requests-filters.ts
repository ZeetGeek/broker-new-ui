"use client";

import { useCallback } from "react";

import { useUrlSyncedPrefs } from "@/hooks/use-url-synced-prefs";
import { PREF_KEYS } from "@/lib/prefs/keys";

import {
    hasActiveRequestsFilters,
    parseRequestsFilters,
    serializeRequestsFilters,
} from "@/features/properties/my-requests/parse-requests-filters";
import {
    DEFAULT_REQUESTS_FILTERS,
    type RequestsFilters,
} from "@/features/properties/my-requests/types";

const REQUESTS_URL_KEYS = ["q", "view", "sort", "limit"] as const;

function isRequestsFilters(value: unknown): value is RequestsFilters {
    if (typeof value !== "object" || value === null) return false;
    const v = value as Partial<RequestsFilters>;
    return typeof v.q === "string" && typeof v.view === "string" && typeof v.sort === "string";
}

function forStorage(filters: RequestsFilters): RequestsFilters {
    return { ...filters, page: 1 };
}

function parse(params: URLSearchParams): RequestsFilters {
    const record: Record<string, string | string[]> = {};
    params.forEach((value, key) => {
        record[key] = value;
    });
    return parseRequestsFilters(record);
}

function serialize(filters: RequestsFilters): URLSearchParams {
    return serializeRequestsFilters(forStorage(filters));
}

export function useRequestsFilters() {
    const {
        value: filters,
        replace,
        ready,
    } = useUrlSyncedPrefs<RequestsFilters>({
        storageKey: PREF_KEYS.broker.requests.filters,
        urlKeys: REQUESTS_URL_KEYS,
        preserveUrlKeys: ["tab"],
        parse,
        serialize,
        forStorage,
        isValid: isRequestsFilters,
    });

    const setFilters = useCallback(
        (next: RequestsFilters | ((prev: RequestsFilters) => RequestsFilters)) => {
            const resolved = typeof next === "function" ? next(filters) : next;
            replace(resolved);
        },
        [filters, replace],
    );

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
        scopeReady: ready,
    };
}
