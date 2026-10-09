"use client";

import { useMemo } from "react";

import { type QueryKey, useInfiniteQuery } from "@tanstack/react-query";

import { type InfinitePage, uniqueInfiniteItems } from "@/lib/pagination/infinite-page";

type Identifiable = { id: string };
type ItemFromPage<TPage> = TPage extends InfinitePage<infer TItem> ? TItem : never;

type InfiniteItemsOptions<TPage extends InfinitePage<Identifiable>> = {
    queryKey: QueryKey;
    queryFn: (input: { cursor: string | null; signal: AbortSignal }) => Promise<TPage>;
    enabled?: boolean;
};

export function useInfiniteItems<TPage extends InfinitePage<Identifiable>>({
    queryKey,
    queryFn,
    enabled = true,
}: InfiniteItemsOptions<TPage>) {
    const query = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam, signal }) => queryFn({ cursor: pageParam, signal }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        enabled,
    });

    const items = useMemo(
        () =>
            uniqueInfiniteItems<ItemFromPage<TPage>>(
                (query.data?.pages ?? []) as unknown as InfinitePage<ItemFromPage<TPage>>[],
            ),
        [query.data?.pages],
    );

    return {
        ...query,
        items,
        total: query.data?.pages[0]?.total ?? 0,
    };
}
