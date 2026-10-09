"use client";

import { PREF_KEYS } from "@/lib/prefs/keys";
import { usePersistedJson } from "@/hooks/use-persisted-json";

/** Same two layouts, same names, as the broker's pipeline toggle. */
export type OwnerLeadsLayout = "board" | "list";

function isLayout(value: unknown): value is OwnerLeadsLayout {
    return value === "board" || value === "list";
}

export function useOwnerLeadsLayout() {
    const [layout, setLayout] = usePersistedJson<OwnerLeadsLayout>(
        PREF_KEYS.owner.leads.layout,
        "board",
        { isValid: isLayout },
    );
    return { layout, setLayout };
}
