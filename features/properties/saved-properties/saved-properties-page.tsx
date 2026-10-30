"use client";

import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { visibleSavedProperties } from "@/lib/properties/saved-properties";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";

import { FEATURE_PLATFORM_OWNER } from "@/config";
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
        () => visibleSavedProperties(query.items).filter((item) => !hiddenIds[item.id]),
        [hiddenIds, query.items],
    );
    const hiddenStillListed = query.items.filter((item) => hiddenIds[item.id]).length;
    // The API total includes hidden owner-pool records. Until paging finishes,
    // only claim the count of visible inventory already loaded.
    const total = FEATURE_PLATFORM_OWNER
        ? Math.max(0, query.total - hiddenStillListed)
        : items.length;
    const checkingMore = items.length === 0 && Boolean(query.hasNextPage);

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
                    isLoading={query.isPending || (checkingMore && !query.isFetchNextPageError)}
                    hasError={query.isError && items.length === 0}
                    hasMore={!FEATURE_PLATFORM_OWNER && Boolean(query.hasNextPage)}
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
            ) : items.length === 0 && !query.hasNextPage ? (
                <SavedPropertiesEmpty />
            ) : (
                <div
                    className={
                        query.isFetching && !query.isFetchingNextPage
                            ? "opacity-60 transition-opacity duration-160"
                            : undefined
                    }
                >
                    {checkingMore ? (
                        <p className="body text-ink" role="status">
                            Checking more saved properties…
                        </p>
                    ) : (
                        <SavedPropertiesGrid
                            items={items}
                            onUnsave={(id) => void handleUnsave(id)}
                        />
                    )}
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
