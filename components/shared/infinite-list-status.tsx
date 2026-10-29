"use client";

import { useCallback } from "react";

import { cn } from "@/lib/utils";
import { useInfiniteScrollTrigger } from "@/hooks/use-infinite-scroll-trigger";

import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";

export function InfiniteListStatus({
    hasNextPage,
    isFetchingNextPage,
    error,
    onLoadMore,
    placement = "page",
}: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    error?: Error | null;
    onLoadMore: () => void;
    /** `page` is the last thing in the portal main. `embedded` sits inside a card that already spaces its children. */
    placement?: "page" | "embedded";
}) {
    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) onLoadMore();
    }, [hasNextPage, isFetchingNextPage, onLoadMore]);
    const triggerRef = useInfiniteScrollTrigger({
        enabled: hasNextPage && !isFetchingNextPage && !error,
        onLoadMore: loadMore,
    });
    const reachedEnd = !error && !isFetchingNextPage && !hasNextPage;
    // Portal main already pads the bottom (nav clearance on phones, pbe-10 on
    // desktop). Match that above the line only — extra padding-bottom makes
    // the gap under the message look deeper than the gap above it.
    const endSpacing = placement === "page" ? "pt-8 pb-0 md:pt-10" : "py-2";

    return (
        <div
            ref={triggerRef}
            className={cn(
                "flex items-center justify-center text-center",
                reachedEnd ? endSpacing : isFetchingNextPage ? "pbs-10 pbe-4" : "py-3 min-block-12",
            )}
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
                <div className="flex items-center justify-center gap-2.5">
                    <LoadingSpinner size="sm" label="Loading more" />
                    <p className="body-sm text-ink-muted">Loading more…</p>
                </div>
            ) : hasNextPage ? (
                <span className="sr-only">More results load as you scroll.</span>
            ) : (
                <p className="body flex items-center justify-center gap-3 text-ink-muted">
                    <span aria-hidden className="shrink-0 bg-ink-subtle/70 block-px inline-8" />
                    You’ve reached the end
                    <span aria-hidden className="shrink-0 bg-ink-subtle/70 block-px inline-8" />
                </p>
            )}
        </div>
    );
}
