/** Stable partition: preserve the selected sort within both groups. */
export function pinnedPropertiesFirst<T extends { id: string }>(
    items: readonly T[],
    pinnedIds: readonly string[],
): T[] {
    const pinned = new Set(pinnedIds);
    return [
        ...items.filter((item) => pinned.has(item.id)),
        ...items.filter((item) => !pinned.has(item.id)),
    ];
}

export function isPinnedPropertyIds(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((id) => typeof id === "string" && id.length > 0);
}

export function togglePinnedProperty(ids: string[], propertyId: string): string[] {
    return ids.includes(propertyId) ? ids.filter((id) => id !== propertyId) : [...ids, propertyId];
}
