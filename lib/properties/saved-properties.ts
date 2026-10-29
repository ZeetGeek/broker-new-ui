import { FEATURE_PLATFORM_OWNER } from "@/config";

/** Filter for display only. Deferred owner-pool bookmarks remain saved on the server. */
export function visibleSavedProperties<T extends { source: "your-listing" | "owner-listing" }>(
    items: T[],
    ownerEnabled = FEATURE_PLATFORM_OWNER,
): T[] {
    return items.filter((item) => ownerEnabled || item.source === "your-listing");
}
