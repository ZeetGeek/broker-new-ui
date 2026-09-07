"use client";

import { useCallback, useEffect, useState } from "react";

export type MyListingsView = "grid" | "list";

const STORAGE_KEY = "my_listings_view";

export function useMyListingsView() {
    const [view, setViewState] = useState<MyListingsView>("grid");

    useEffect(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "grid" || stored === "list") {
            setViewState(stored);
        }
    }, []);

    const setView = useCallback((next: MyListingsView) => {
        setViewState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
    }, []);

    return { view, setView };
}
