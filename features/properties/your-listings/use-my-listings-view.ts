"use client";

import { usePersistedJson } from "@/hooks/use-persisted-json";
import { LEGACY_PREF_KEYS, PREF_KEYS } from "@/lib/prefs/keys";
import { migrateLegacyPref } from "@/lib/prefs/storage";

export type MyListingsView = "grid" | "list";

function isView(value: unknown): value is MyListingsView {
    return value === "grid" || value === "list";
}

let migrated = false;
function ensureMigrated() {
    if (migrated || typeof window === "undefined") return;
    migrated = true;
    migrateLegacyPref(LEGACY_PREF_KEYS.myListingsView, PREF_KEYS.broker.myListings.view, (raw) =>
        raw === "list" || raw === "grid" ? raw : "grid",
    );
}

export function useMyListingsView() {
    ensureMigrated();
    const [view, setView] = usePersistedJson<MyListingsView>(
        PREF_KEYS.broker.myListings.view,
        "grid",
        {
            isValid: isView,
        },
    );
    return { view, setView };
}
