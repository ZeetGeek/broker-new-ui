"use client";

import { PREF_KEYS } from "@/lib/prefs/keys";
import { usePersistedJson } from "@/hooks/use-persisted-json";

export type OwnerRequestsView = "grid" | "list";

function isView(value: unknown): value is OwnerRequestsView {
    return value === "grid" || value === "list";
}

export function useOwnerRequestsView() {
    const [view, setView] = usePersistedJson<OwnerRequestsView>(
        PREF_KEYS.owner.requests.view,
        "grid",
        { isValid: isView },
    );
    return { view, setView };
}
