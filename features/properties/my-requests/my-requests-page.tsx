"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { myRequestsApi } from "@/lib/api/my-requests";
import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { AppPagination } from "@/components/shared/app-pagination";

import { RequestCard } from "@/features/properties/my-requests/request-card";
import {
    RequestsFilteredEmpty,
    RequestsFirstRunEmpty,
} from "@/features/properties/my-requests/requests-empty";
import {
    REQUESTS_GRID_CLASS,
    REQUESTS_LIST_CLASS,
} from "@/features/properties/my-requests/requests-grid-class";
import { RequestsHeader } from "@/features/properties/my-requests/requests-header";
import { RequestsIntro } from "@/features/properties/my-requests/requests-intro";
import {
    RequestsListSkeleton,
    RequestsPageSkeleton,
} from "@/features/properties/my-requests/requests-skeleton";
import type { RequestsResult, RequestsSummary } from "@/features/properties/my-requests/types";
import { useRequestsFilters } from "@/features/properties/my-requests/use-requests-filters";
import { useRequestsView } from "@/features/properties/my-requests/use-requests-view";

export function MyRequestsPage() {
    const { filters, patchFilters, setFilters, clearFilters, hasActiveFilters, filterSignature } =
        useRequestsFilters();
    const { view, setView } = useRequestsView();

    const [result, setResult] = useState<RequestsResult | null>(null);
    const [summary, setSummary] = useState<RequestsSummary | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    /** Bumped after a mutation so the list and summary both refetch. */
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let cancelled = false;

        // Deferred so the loading flag does not set state during the effect
        // body, which would cascade an extra render on every filter change.
        const timer = window.setTimeout(() => {
            if (cancelled) return;

            setIsFetching(true);
            setError(null);

            void myRequestsApi
                .list(filters)
                .then((next) => {
                    if (!cancelled) setResult(next);
                })
                .catch(() => {
                    if (!cancelled) setError("Could not load your requests. Try again.");
                })
                .finally(() => {
                    if (!cancelled) setIsFetching(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [filterSignature, filters, revision]);

    useEffect(() => {
        let cancelled = false;

        void myRequestsApi
            .summary()
            .then((next) => {
                if (!cancelled) setSummary(next);
            })
            .catch(() => {
                if (!cancelled) setSummary(null);
            });

        return () => {
            cancelled = true;
        };
    }, [revision]);

    const runMutation = useCallback(async (id: string, action: () => Promise<void>) => {
        setBusyId(id);
        try {
            await action();
            setRevision((prev) => prev + 1);
        } finally {
            setBusyId(null);
        }
    }, []);

    const handleNudge = useCallback(
        (id: string) => {
            void runMutation(id, () => myRequestsApi.nudge(id));
        },
        [runMutation],
    );

    const handleWithdraw = useCallback(
        (id: string) => {
            void runMutation(id, () => myRequestsApi.withdraw(id));
        },
        [runMutation],
    );

    const handleRetry = useCallback(
        (id: string) => {
            void runMutation(id, () => myRequestsApi.retry(id));
        },
        [runMutation],
    );

    const handlePageChange = useCallback(
        (page: number) => {
            setFilters((prev) => ({ ...prev, page: Math.max(1, page) }));
            window.scrollTo({ top: 0, behavior: "smooth" });
        },
        [setFilters],
    );

    const handlePageSizeChange = useCallback(
        (limit: number) => {
            patchFilters({ limit });
            window.scrollTo({ top: 0, behavior: "smooth" });
        },
        [patchFilters],
    );

    const introSection = useMemo(
        () => <RequestsIntro summary={summary} isLoading={isFetching && !summary} />,
        [summary, isFetching],
    );

    if (!result && isFetching) {
        return <RequestsPageSkeleton />;
    }

    // A broker who has never sent a request gets the pool, not an empty table.
    const isFirstRun = summary != null && summary.counts.all === 0;

    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>{introSection}</PortalSectionNav>

            {isFirstRun ? (
                <RequestsFirstRunEmpty />
            ) : (
                <>
                    <RequestsHeader
                        filters={filters}
                        summary={summary}
                        isLoading={isFetching}
                        view={view}
                        onViewChange={setView}
                        onPatch={patchFilters}
                    />

                    {error ? (
                        <div className="flex flex-col items-center gap-4 py-12 text-center">
                            <p className="h6 text-ink">Could not load your requests</p>
                            <p className="body-sm text-ink-muted">{error}</p>
                            <button
                                type="button"
                                onClick={() => setRevision((prev) => prev + 1)}
                                className="
                                  body-sm font-semibold text-brand underline-offset-4
                                  hover:underline
                                "
                            >
                                Try again
                            </button>
                        </div>
                    ) : !result ? (
                        <RequestsListSkeleton view={view} />
                    ) : result.items.length === 0 ? (
                        <RequestsFilteredEmpty
                            onClearFilters={hasActiveFilters ? clearFilters : undefined}
                        />
                    ) : (
                        <div
                            className={cn(
                                "flex flex-col gap-8",
                                isFetching && "opacity-60 transition-opacity duration-160",
                            )}
                        >
                            <ul
                                className={
                                    view === "list" ? REQUESTS_LIST_CLASS : REQUESTS_GRID_CLASS
                                }
                            >
                                {result.items.map((item) => (
                                    <RequestCard
                                        key={item.id}
                                        item={item}
                                        view={view}
                                        onNudge={handleNudge}
                                        onWithdraw={handleWithdraw}
                                        onRetry={handleRetry}
                                        isBusy={busyId === item.id}
                                    />
                                ))}
                            </ul>

                            {result.totalPages > 1 ? (
                                <AppPagination
                                    page={result.page}
                                    totalPages={result.totalPages}
                                    onPageChange={handlePageChange}
                                    pageSize={filters.limit}
                                    onPageSizeChange={handlePageSizeChange}
                                    aria-label="Request pages"
                                />
                            ) : null}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
