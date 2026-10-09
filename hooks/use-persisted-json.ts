"use client";

import { useCallback, useSyncExternalStore } from "react";

import { readPrefJson, subscribePref, writePrefJson } from "@/lib/prefs/storage";

type UsePersistedJsonOptions<T> = {
    /** Narrow/validate stored values; invalid → fallback. */
    isValid?: (value: unknown) => value is T;
};

type CacheEntry<T> = {
    raw: string | null;
    value: T;
};

const snapshotCache = new Map<string, CacheEntry<unknown>>();

function readCachedPref<T>(
    key: string,
    fallback: T,
    isValid?: (value: unknown) => value is T,
): T {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(key);
    const cached = snapshotCache.get(key) as CacheEntry<T> | undefined;
    if (cached && cached.raw === raw) {
        return cached.value;
    }

    const value = readPrefJson(key, fallback, isValid);
    snapshotCache.set(key, { raw, value });
    return value;
}

/**
 * Persist a JSON-serializable value in localStorage.
 * Survives refresh, navigation, and reopen. Same-tab updates notify subscribers.
 *
 * Pass a module-level `fallback` and `isValid` so snapshots stay stable.
 */
export function usePersistedJson<T>(
    key: string,
    fallback: T,
    options?: UsePersistedJsonOptions<T>,
): [T, (next: T | ((prev: T) => T)) => void] {
    const isValid = options?.isValid;

    const subscribe = useCallback(
        (onStoreChange: () => void) => subscribePref(key, onStoreChange),
        [key],
    );

    const getSnapshot = useCallback(
        () => readCachedPref(key, fallback, isValid),
        [fallback, isValid, key],
    );

    const getServerSnapshot = useCallback(() => fallback, [fallback]);

    const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const setValue = useCallback(
        (next: T | ((prev: T) => T)) => {
            const prev = readCachedPref(key, fallback, isValid);
            const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
            snapshotCache.delete(key);
            writePrefJson(key, resolved);
        },
        [fallback, isValid, key],
    );

    return [value, setValue];
}
