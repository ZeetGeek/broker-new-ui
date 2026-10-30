import { infiniteQueryOptions } from "@tanstack/react-query";

import { exclusiveOwnersApi } from "@/lib/api/exclusive-owners";

export function exclusiveOwnerPickerOptions(search: string, enabled: boolean) {
    const trimmed = search.trim();
    return infiniteQueryOptions({
        queryKey: ["exclusive-owner-picker", trimmed],
        queryFn: ({ pageParam, signal }) =>
            exclusiveOwnersApi.list(
                { search: trimmed || undefined, sort: "name", page: pageParam, limit: 20 },
                signal,
            ),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
        enabled,
        staleTime: 0,
    });
}
