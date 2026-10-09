export type InfinitePage<T> = {
    items: T[];
    total: number;
    nextCursor: string | null;
};

export function uniqueInfiniteItems<T extends { id: string }>(pages: InfinitePage<T>[]): T[] {
    const seen = new Set<string>();
    const items: T[] = [];

    for (const page of pages) {
        for (const item of page.items) {
            if (seen.has(item.id)) continue;
            seen.add(item.id);
            items.push(item);
        }
    }

    return items;
}
