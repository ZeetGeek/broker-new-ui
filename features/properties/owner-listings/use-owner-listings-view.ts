"use client";

import { useCallback, useEffect, useState } from "react";

export type OwnerListingsView = "grid" | "list";

const STORAGE_KEY = "owner_listings_view";

export function useOwnerListingsView() {
    const [view, setViewState] = useState<OwnerListingsView>("grid");

    useEffect(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "grid" || stored === "list") {
            setViewState(stored);
        }
    }, []);

    const setView = useCallback((next: OwnerListingsView) => {
        setViewState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
    }, []);

    return { view, setView };
}
