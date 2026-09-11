"use client";

import { usePersistedJson } from "@/hooks/use-persisted-json";
import { LEGACY_PREF_KEYS, PREF_KEYS } from "@/lib/prefs/keys";
import { migrateLegacyPref } from "@/lib/prefs/storage";

export type RequestsView = "grid" | "list";

function isView(value: unknown): value is RequestsView {
    return value === "grid" || value === "list";
}

let migrated = false;
function ensureMigrated() {
    if (migrated || typeof window === "undefined") return;
    migrated = true;
    migrateLegacyPref(LEGACY_PREF_KEYS.myRequestsView, PREF_KEYS.broker.requests.view, (raw) =>
        raw === "list" || raw === "grid" ? raw : "list",
    );
}

export function useRequestsView() {
    ensureMigrated();
    const [view, setView] = usePersistedJson<RequestsView>(PREF_KEYS.broker.requests.view, "list", {
        isValid: isView,
    });
    return { view, setView };
}
