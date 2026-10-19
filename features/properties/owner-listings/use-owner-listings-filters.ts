"use client";

import { useCallback } from "react";

import { LEGACY_PREF_KEYS, PREF_KEYS } from "@/lib/prefs/keys";
import { readPrefJson, writePrefJson } from "@/lib/prefs/storage";
import { useUrlSyncedPrefs } from "@/hooks/use-url-synced-prefs";

import {
    filtersToSearchParams,
    hasActiveOwnerListingsFilters,
    ownerListingsFilterSignature,
    parseOwnerListingsFilters,
} from "@/features/properties/owner-listings/filter-owner-listings";
import type { OwnerListingsFilters } from "@/features/properties/owner-listings/types";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";

const OWNER_LISTINGS_URL_KEYS = [
    "q",
    "country",
    "state",
    "city",
    "locality",
    "bhk",
    "type",
    "min",
    "max",
    "furnishing",
    "propertyType",
    "minArea",
    "maxArea",
    "listedWithin",
    "minCommission",
    "maxCommission",
    "minCommissionAmt",
    "maxCommissionAmt",
    "yourAreas",
    "newToday",
    "slotsOpen",
    "commissionSet",
    "readyToMove",
    "sort",
    "limit",
] as const;

function isOwnerListingsFilters(value: unknown): value is OwnerListingsFilters {
    if (typeof value !== "object" || value === null) return false;
    const v = value as Partial<OwnerListingsFilters>;
    const ok =
        typeof v.q === "string" &&
        (v.countries === undefined || Array.isArray(v.countries)) &&
        (v.states === undefined || Array.isArray(v.states)) &&
        Array.isArray(v.cities) &&
        Array.isArray(v.localities) &&
        Array.isArray(v.bhk) &&
        typeof v.yourAreas === "boolean" &&
        typeof v.sort === "string";
    if (!ok) return false;

    // Older prefs predate country/state multi-select.
    if (!Array.isArray(v.countries)) v.countries = [];
    if (!Array.isArray(v.states)) v.states = [];
    return true;
}

function forStorage(filters: OwnerListingsFilters): OwnerListingsFilters {
    return { ...filters, cursor: "" };
}

function parse(params: URLSearchParams): OwnerListingsFilters {
    return parseOwnerListingsFilters(params);
}

function serialize(filters: OwnerListingsFilters): URLSearchParams {
    return filtersToSearchParams(forStorage(filters));
}

let migratedLegacyWhere = false;
function migrateLegacyWhereScope() {
    if (migratedLegacyWhere || typeof window === "undefined") return;
    migratedLegacyWhere = true;

    const existing = readPrefJson(
        PREF_KEYS.broker.ownerListings.filters,
        null as OwnerListingsFilters | null,
        (value): value is OwnerListingsFilters => value === null || isOwnerListingsFilters(value),
    );
    if (existing) return;

    const raw =
        window.localStorage.getItem(LEGACY_PREF_KEYS.ownerListingsWhereScope) ??
        window.localStorage.getItem(LEGACY_PREF_KEYS.ownerListingsYourAreas);
    if (!raw) return;

    try {
        if (raw === "0" || raw === "1") {
            writePrefJson(PREF_KEYS.broker.ownerListings.filters, {
                ...DEFAULT_OWNER_LISTINGS_FILTERS,
                yourAreas: raw === "1",
            });
            return;
        }
        const parsed = JSON.parse(raw) as {
            yourAreas?: boolean;
            cities?: string[];
            localities?: string[];
        };
        writePrefJson(PREF_KEYS.broker.ownerListings.filters, {
            ...DEFAULT_OWNER_LISTINGS_FILTERS,
            yourAreas: Boolean(parsed.yourAreas),
            countries: [],
            states: [],
            cities: Array.isArray(parsed.cities) ? parsed.cities.map(String) : [],
            localities: Array.isArray(parsed.localities) ? parsed.localities.map(String) : [],
        });
    } catch {
        // Ignore unreadable legacy values.
    }
}

export function useOwnerListingsFilters() {
    migrateLegacyWhereScope();

    const {
        value: filters,
        replace,
        ready,
    } = useUrlSyncedPrefs<OwnerListingsFilters>({
        storageKey: PREF_KEYS.broker.ownerListings.filters,
        urlKeys: OWNER_LISTINGS_URL_KEYS,
        parse,
        serialize,
        forStorage,
        isValid: isOwnerListingsFilters,
    });

    const setFilters = useCallback(
        (patch: Partial<OwnerListingsFilters>) => {
            replace({ ...filters, ...patch });
        },
        [filters, replace],
    );

    const toggleFilter = useCallback(
        <K extends keyof OwnerListingsFilters>(key: K, value: OwnerListingsFilters[K]) => {
            setFilters({ [key]: filters[key] === value ? ("" as OwnerListingsFilters[K]) : value });
        },
        [filters, setFilters],
    );

    const clearFilters = useCallback(() => {
        // Reset band / chip / sheet / search filters, but keep the current Where
        // mode (Anywhere vs localities / Your areas). Forcing Your areas on was
        // selecting that chip whenever someone cleared a filtered empty state.
        replace({
            ...DEFAULT_OWNER_LISTINGS_FILTERS,
            yourAreas: filters.yourAreas,
            countries: filters.countries ?? [],
            states: filters.states ?? [],
            cities: filters.cities,
            localities: filters.localities,
        });
    }, [
        filters.cities,
        filters.countries,
        filters.localities,
        filters.states,
        filters.yourAreas,
        replace,
    ]);

    const toggleQuickChip = useCallback(
        (key: "yourAreas" | "newToday" | "slotsOpen" | "commissionSet" | "readyToMove") => {
            if (key === "yourAreas") {
                const nextYourAreas = !filters.yourAreas;
                replace({
                    ...filters,
                    yourAreas: nextYourAreas,
                    countries: [],
                    states: [],
                    cities: [],
                    localities: [],
                    cursor: "",
                });
                return;
            }
            setFilters({ [key]: !filters[key], cursor: "" });
        },
        [filters, replace, setFilters],
    );

    const applyFilters = useCallback(
        (next: OwnerListingsFilters) => {
            replace(next);
        },
        [replace],
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
        scopeReady: ready,
    };
}
