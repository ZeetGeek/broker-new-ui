"use client";

import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";

import { mapSavedProperty } from "@/features/properties/saved-properties/map-saved-property";
import { SavedPropertiesEmpty } from "@/features/properties/saved-properties/saved-properties-empty";
import { SavedPropertiesGrid } from "@/features/properties/saved-properties/saved-properties-grid";
import { SavedPropertiesIntro } from "@/features/properties/saved-properties/saved-properties-intro";
import { SAVED_PROPERTIES_QUERY_KEY } from "@/features/properties/saved-properties/saved-properties-query";
import { SavedPropertiesResultsSkeleton } from "@/features/properties/saved-properties/saved-properties-skeleton";

function mutationErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error) return error.message;
    return fallback;
}

export function SavedPropertiesPage() {
    const queryClient = useQueryClient();
    const [hiddenIds, setHiddenIds] = useState<Record<string, true>>({});

    const query = useInfiniteItems({
        queryKey: SAVED_PROPERTIES_QUERY_KEY,
        staleTime: 0,
        queryFn: async ({ cursor, signal }) => {
            const page = cursor ? Number(cursor) : 1;
            const result = await propertiesApi.listBookmarks({ page, limit: 20 }, signal);
            return {
                items: result.items.map(mapSavedProperty),
                total: result.total,
                nextCursor: page < result.totalPages ? String(page + 1) : null,
            };
        },
    });

    const items = useMemo(
        () => query.items.filter((item) => !hiddenIds[item.id]),
        [hiddenIds, query.items],
    );
    const hiddenStillListed = query.items.filter((item) => hiddenIds[item.id]).length;
    const total = Math.max(0, query.total - hiddenStillListed);

    const handleUnsave = useCallback(
        async (id: string) => {
            setHiddenIds((prev) => ({ ...prev, [id]: true }));
            try {
                await propertiesApi.unbookmark(id);
                toast.success("Removed from saved");
                void queryClient.invalidateQueries({ queryKey: SAVED_PROPERTIES_QUERY_KEY });
            } catch (error) {
                setHiddenIds((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
                toast.error(mutationErrorMessage(error, "Could not update bookmark"));
            }
        },
        [queryClient],
    );

    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>
                <SavedPropertiesIntro
                    total={total}
                    isLoading={query.isPending}
                    hasError={query.isError && query.items.length === 0}
                />
            </PortalSectionNav>

            {query.isError && query.items.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <p className="h6 text-ink">Could not load saved properties</p>
                    <p className="body-sm text-ink-muted">Check your connection and try again.</p>
                    <button
                        type="button"
                        onClick={() => void query.refetch()}
                        className="
                          body-sm font-semibold text-brand underline-offset-4
                          hover:underline
                        "
                    >
                        Try again
                    </button>
                </div>
            ) : query.isPending ? (
                <SavedPropertiesResultsSkeleton />
            ) : items.length === 0 ? (
                <SavedPropertiesEmpty />
            ) : (
                <div
                    className={
                        query.isFetching && !query.isFetchingNextPage
                            ? "opacity-60 transition-opacity duration-160"
                            : undefined
                    }
                >
                    <SavedPropertiesGrid items={items} onUnsave={(id) => void handleUnsave(id)} />
                    <InfiniteListStatus
                        hasNextPage={Boolean(query.hasNextPage)}
                        isFetchingNextPage={query.isFetchingNextPage}
                        error={query.isFetchNextPageError ? query.error : null}
                        onLoadMore={() => void query.fetchNextPage()}
                    />
                </div>
            )}
        </div>
    );
}
