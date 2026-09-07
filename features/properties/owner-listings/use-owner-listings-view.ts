"use client";

import { useCallback, useSyncExternalStore } from "react";

export type OwnerListingsView = "grid" | "list";

const STORAGE_KEY = "owner_listings_view";

function readStoredView(): OwnerListingsView {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "grid" || stored === "list" ? stored : "grid";
}

function subscribe(onStoreChange: () => void) {
    window.addEventListener("storage", onStoreChange);
    return () => window.removeEventListener("storage", onStoreChange);
}

export function useOwnerListingsView() {
    const view = useSyncExternalStore(subscribe, readStoredView, () => "grid" as const);

    const setView = useCallback((next: OwnerListingsView) => {
        window.localStorage.setItem(STORAGE_KEY, next);
        // Same-tab updates do not fire `storage` — notify subscribers manually.
        window.dispatchEvent(new Event("storage"));
    }, []);

    return { view, setView };
}
