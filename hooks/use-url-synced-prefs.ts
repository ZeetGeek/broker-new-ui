"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { readPrefJson, writePrefJson } from "@/lib/prefs/storage";

type UseUrlSyncedPrefsOptions<T> = {
    /** Pref storage key. */
    storageKey: string;
    /** Query keys that mean “URL already carries prefs” (excludes tab-only keys as needed). */
    urlKeys: readonly string[];
    /** Keys that must stay on the URL even when restoring (e.g. `tab`). */
    preserveUrlKeys?: readonly string[];
    parse: (params: URLSearchParams) => T;
    serialize: (value: T) => URLSearchParams;
    /** Strip pagination before writing storage. */
    forStorage?: (value: T) => T;
    isValid?: (value: unknown) => value is T;
    /** Merge stored prefs with URL parse when URL is clean (defaults to stored). */
    mergeStored?: (stored: T, fromUrl: T) => T;
};

function urlHasAnyKey(params: URLSearchParams, keys: readonly string[]): boolean {
    return keys.some((key) => params.has(key));
}

/**
 * Hybrid prefs: URL wins when it carries filter keys; otherwise restore from localStorage
 * into the URL before consumers fetch. Pagination should be stripped via `forStorage`.
 *
 * Pass module-level stable `parse` / `serialize` / `isValid` callbacks.
 */
export function useUrlSyncedPrefs<T>({
    storageKey,
    urlKeys,
    preserveUrlKeys = [],
    parse,
    serialize,
    forStorage,
    isValid,
    mergeStored,
}: UseUrlSyncedPrefsOptions<T>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const urlHasPrefs = urlHasAnyKey(searchParams, urlKeys);
    const [ready, setReady] = useState(urlHasPrefs);
    const didRestoreRef = useRef(false);

    /* Restore stored prefs into a clean URL before the page fetches.
       setReady is the restore-before-fetch gate (avoids a wrong-dataset flash). */
    /* eslint-disable react-hooks/set-state-in-effect -- restore-before-fetch gate */
    useLayoutEffect(() => {
        if (urlHasPrefs) {
            const fromUrl = parse(searchParams);
            const toStore = forStorage ? forStorage(fromUrl) : fromUrl;
            writePrefJson(storageKey, toStore);
            didRestoreRef.current = true;
            setReady(true);
            return;
        }

        // Only auto-restore once per mount when the URL is clean.
        if (didRestoreRef.current) {
            setReady(true);
            return;
        }

        const fromUrl = parse(searchParams);
        const stored = readPrefJson(storageKey, fromUrl, isValid);
        const next = mergeStored ? mergeStored(stored, fromUrl) : stored;
        const toStore = forStorage ? forStorage(next) : next;
        writePrefJson(storageKey, toStore);

        const params = serialize(next);
        for (const key of preserveUrlKeys) {
            const value = searchParams.get(key);
            if (value) params.set(key, value);
        }

        didRestoreRef.current = true;
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        setReady(true);
        // parse/serialize are expected to be module-stable; searchParams drives restores.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable callbacks
    }, [pathname, router, searchParams, storageKey, urlHasPrefs]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const value = useMemo(() => {
        const fromUrl = parse(searchParams);
        if (urlHasPrefs) return fromUrl;

        const stored = readPrefJson(storageKey, fromUrl, isValid);
        return mergeStored ? mergeStored(stored, fromUrl) : stored;
    }, [isValid, mergeStored, parse, searchParams, storageKey, urlHasPrefs]);

    const replace = useCallback(
        (next: T) => {
            const toStore = forStorage ? forStorage(next) : next;
            writePrefJson(storageKey, toStore);
            const params = serialize(next);
            for (const key of preserveUrlKeys) {
                const existing = searchParams.get(key);
                if (existing && !params.has(key)) params.set(key, existing);
            }
            const query = params.toString();
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        },
        [forStorage, pathname, preserveUrlKeys, router, searchParams, serialize, storageKey],
    );

    return {
        value,
        replace,
        ready: ready && (urlHasPrefs || typeof window !== "undefined"),
        urlHasPrefs,
    };
}
