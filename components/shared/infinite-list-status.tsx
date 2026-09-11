"use client";

import { useCallback } from "react";

import { useInfiniteScrollTrigger } from "@/hooks/use-infinite-scroll-trigger";

import { Button } from "@/components/ui/button";

export function InfiniteListStatus({
    hasNextPage,
    isFetchingNextPage,
    error,
    onLoadMore,
}: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    error?: Error | null;
    onLoadMore: () => void;
}) {
    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) onLoadMore();
    }, [hasNextPage, isFetchingNextPage, onLoadMore]);
    const triggerRef = useInfiniteScrollTrigger({
        enabled: hasNextPage && !isFetchingNextPage && !error,
        onLoadMore: loadMore,
    });

    return (
        <div
            ref={triggerRef}
            className="flex items-center justify-center py-3 text-center min-block-12"
            aria-live="polite"
            aria-busy={isFetchingNextPage}
        >
            {error ? (
                <div className="flex flex-col items-center gap-2">
                    <p className="body-sm text-urgent">Could not load more results.</p>
                    <Button type="button" variant="outline" size="sm" onClick={loadMore}>
                        Try again
                    </Button>
                </div>
            ) : isFetchingNextPage ? (
                <p className="body-sm text-ink-muted">Loading more…</p>
            ) : hasNextPage ? (
                <span className="sr-only">More results load as you scroll.</span>
            ) : (
                <p className="body-xs text-ink-subtle">You’ve reached the end.</p>
            )}
        </div>
    );
}
