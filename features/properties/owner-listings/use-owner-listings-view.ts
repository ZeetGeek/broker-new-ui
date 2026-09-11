"use client";

import { usePersistedJson } from "@/hooks/use-persisted-json";
import { LEGACY_PREF_KEYS, PREF_KEYS } from "@/lib/prefs/keys";
import { migrateLegacyPref } from "@/lib/prefs/storage";

export type OwnerListingsView = "grid" | "list";

function isView(value: unknown): value is OwnerListingsView {
    return value === "grid" || value === "list";
}

let migrated = false;
function ensureMigrated() {
    if (migrated || typeof window === "undefined") return;
    migrated = true;
    migrateLegacyPref(
        LEGACY_PREF_KEYS.ownerListingsView,
        PREF_KEYS.broker.ownerListings.view,
        (raw) => (raw === "list" || raw === "grid" ? raw : "grid"),
    );
}

export function useOwnerListingsView() {
    ensureMigrated();
    const [view, setView] = usePersistedJson<OwnerListingsView>(
        PREF_KEYS.broker.ownerListings.view,
        "grid",
        { isValid: isView },
    );
    return { view, setView };
}
