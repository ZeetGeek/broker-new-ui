"use client";

import { useCallback, useSyncExternalStore } from "react";

export type RequestsView = "grid" | "list";

const STORAGE_KEY = "my_requests_view";

function readStoredView(): RequestsView {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "grid" || stored === "list" ? stored : "list";
}

function subscribe(onStoreChange: () => void) {
    window.addEventListener("storage", onStoreChange);
    return () => window.removeEventListener("storage", onStoreChange);
}

export function useRequestsView() {
    const view = useSyncExternalStore(subscribe, readStoredView, () => "list" as const);

    const setView = useCallback((next: RequestsView) => {
        window.localStorage.setItem(STORAGE_KEY, next);
        // Same-tab updates do not fire `storage` — notify subscribers manually.
        window.dispatchEvent(new Event("storage"));
    }, []);

    return { view, setView };
}
