"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import { representativeApi } from "@/lib/api/representative";
import { ownerBrokersHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import { OwnerRequestCard } from "@/features/owner-requests/owner-request-card";
import {
    OwnerRequestsEmpty,
    OwnerRequestsFilteredEmpty,
} from "@/features/owner-requests/owner-requests-empty";
import {
    OwnerRequestsHeader,
    type OwnerRequestsSort,
} from "@/features/owner-requests/owner-requests-header";
import { OwnerRequestsIntro } from "@/features/owner-requests/owner-requests-intro";
import type { OwnerRequestsSummary, OwnerRequestsTab } from "@/features/owner-requests/types";
import { useOwnerRepQueue } from "@/features/owner-requests/use-owner-rep-queue";
import { useOwnerRequestsView } from "@/features/owner-requests/use-owner-requests-view";
import {
    REQUESTS_GRID_BREAKPOINTS,
    REQUESTS_LIST_BREAKPOINTS,
} from "@/features/properties/my-requests/requests-grid-class";
import { RequestsListSkeleton } from "@/features/properties/my-requests/requests-skeleton";

function isRequestsTab(value: string | null): value is OwnerRequestsTab {
    return value === "requests" || value === "invitations";
}

function apiMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}

export function OwnerRequestsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const legacyBrokersTab = tabParam === "browse" || tabParam === "active";
    const tab: OwnerRequestsTab = isRequestsTab(tabParam) ? tabParam : "requests";

    const { view, setView } = useOwnerRequestsView();
    const [revision, setRevision] = useState(0);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<OwnerRequestsSort>("recent");

    const [summary, setSummary] = useState<OwnerRequestsSummary | null>(null);
    const [summariesReady, setSummariesReady] = useState(false);

    const queue = useOwnerRepQueue({
        kind: tab,
        search,
        sort,
        enabled: !legacyBrokersTab,
    });
    const refetchQueue = queue.refetch;

    useEffect(() => {
        if (tabParam === "browse") {
            router.replace(ownerBrokersHref());
            return;
        }
        if (tabParam === "active") {
            router.replace(ownerBrokersHref("active"));
        }
    }, [router, tabParam]);

    useEffect(() => {
        if (legacyBrokersTab) return;
        let cancelled = false;

        void Promise.all([
            representativeApi.ownerRequestPage({ status: "pending", limit: 1 }),
            representativeApi.ownerInvitationPage({ status: "pending", limit: 1 }),
        ])
            .then(([incoming, invites]) => {
                if (cancelled) return;
                setSummary({
                    incomingPending: incoming.total,
                    invitesPending: invites.total,
                });
            })
            .catch(() => {
                /* Intro/chips fall back to empty counts. */
            })
            .finally(() => {
                if (!cancelled) setSummariesReady(true);
            });

        return () => {
            cancelled = true;
        };
    }, [legacyBrokersTab, revision]);

    const runRepAction = useCallback(
        async (id: string, action: () => Promise<unknown>, success: string) => {
            setBusyId(id);
            try {
                await action();
                toast.success(success);
                // Summary counts and the loaded queue pages both move on a decision.
                setRevision((v) => v + 1);
                void refetchQueue();
            } catch (err) {
                toast.error(apiMessage(err, "Something went wrong"));
            } finally {
                setBusyId(null);
            }
        },
        [refetchQueue],
    );

    if (legacyBrokersTab) {
        return (
            <div className="flex justify-center py-24">
                <LoadingSpinner label="Loading brokers" />
            </div>
        );
    }

    const cardActions = tab === "requests" ? "respond" : "withdraw";

    let body: ReactNode;

    if (!summariesReady || queue.isPending) {
        body = <RequestsListSkeleton view={view} />;
    } else if (queue.isError && queue.items.length === 0) {
        body = (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">Could not load your requests</p>
                <p className="body-sm text-ink-muted">
                    {apiMessage(queue.error, "Could not load requests")}
                </p>
                <button
                    type="button"
                    onClick={() => void queue.refetch()}
                    className="body-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    } else if (queue.items.length === 0 && search.trim()) {
        body = (
            <OwnerRequestsFilteredEmpty searchQuery={search} onClearFilters={() => setSearch("")} />
        );
    } else if (queue.items.length === 0) {
        body = <OwnerRequestsEmpty tab={tab} />;
    } else {
        body = (
            <div
                className={cn(
                    "flex flex-col gap-2",
                    queue.isFetching &&
                        !queue.isFetchingNextPage &&
                        "opacity-60 transition-opacity duration-160",
                )}
            >
                <WindowVirtualGrid
                    items={queue.items}
                    getKey={(item) => item.id}
                    estimateRowHeight={view === "list" ? 224 : 480}
                    gap={24}
                    breakpoints={
                        view === "list" ? REQUESTS_LIST_BREAKPOINTS : REQUESTS_GRID_BREAKPOINTS
                    }
                    ariaLabel="Broker representation requests"
                    renderItem={(item) => (
                        <OwnerRequestCard
                            item={item}
                            view={view}
                            actions={cardActions}
                            isBusy={busyId === item.id}
                            onAccept={() =>
                                void runRepAction(
                                    item.id,
                                    () =>
                                        representativeApi.ownerRespond(item.id, {
                                            status: "accepted",
                                        }),
                                    "Request accepted",
                                )
                            }
                            onReject={() =>
                                void runRepAction(
                                    item.id,
                                    () =>
                                        representativeApi.ownerRespond(item.id, {
                                            status: "rejected",
                                        }),
                                    "Request declined",
                                )
                            }
                            onWithdraw={() =>
                                void runRepAction(
                                    item.id,
                                    () => representativeApi.withdraw(item.id),
                                    "Invitation withdrawn",
                                )
                            }
                        />
                    )}
                />
                <InfiniteListStatus
                    hasNextPage={Boolean(queue.hasNextPage)}
                    isFetchingNextPage={queue.isFetchingNextPage}
                    error={queue.isFetchNextPageError ? queue.error : null}
                    onLoadMore={() => void queue.fetchNextPage()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>
                <OwnerRequestsIntro activeTab={tab} summary={summary} isLoading={!summariesReady} />
            </PortalSectionNav>

            <OwnerRequestsHeader
                activeTab={tab}
                summary={summary}
                search={search}
                onSearchChange={setSearch}
                sort={sort}
                onSortChange={setSort}
                view={view}
                onViewChange={setView}
                isLoading={!summariesReady}
            />

            {body}
        </div>
    );
}
