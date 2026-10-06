"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import { representativeApi } from "@/lib/api/representative";
import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import { OwnerBrokersBrowse } from "@/features/owner-brokers/owner-brokers-browse";
import { OwnerBrokersEmpty } from "@/features/owner-brokers/owner-brokers-empty";
import { OwnerBrokersHeader } from "@/features/owner-brokers/owner-brokers-header";
import type { OwnerBrokersTab } from "@/features/owner-brokers/types";
import { OwnerRequestCard } from "@/features/owner-requests/owner-request-card";
import { OwnerRequestsFilteredEmpty } from "@/features/owner-requests/owner-requests-empty";
import type { OwnerRequestsSort } from "@/features/owner-requests/owner-requests-header";
import { useOwnerRepQueue } from "@/features/owner-requests/use-owner-rep-queue";
import { useOwnerRequestsView } from "@/features/owner-requests/use-owner-requests-view";
import {
    REQUESTS_GRID_BREAKPOINTS,
    REQUESTS_LIST_BREAKPOINTS,
} from "@/features/properties/my-requests/requests-grid-class";
import { RequestsListSkeleton } from "@/features/properties/my-requests/requests-skeleton";

function isBrokersTab(value: string | null): value is OwnerBrokersTab {
    return value === "browse" || value === "active";
}

function apiMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}

export function OwnerBrokersPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const tab: OwnerBrokersTab = isBrokersTab(tabParam) ? tabParam : "browse";

    const { view, setView } = useOwnerRequestsView();
    const [revision, setRevision] = useState(0);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<OwnerRequestsSort>("recent");

    const [activeCount, setActiveCount] = useState<number | null>(null);

    const [brokerSearch, setBrokerSearch] = useState("");

    const queue = useOwnerRepQueue({
        kind: "active",
        search,
        sort,
        enabled: tab === "active",
    });

    // Kept apart from the scrolled queue so the tab chip has a count on Browse too.
    useEffect(() => {
        let cancelled = false;
        void representativeApi
            .ownerActivePage({ limit: 1 })
            .then((page) => {
                if (!cancelled) setActiveCount(page.total);
            })
            .catch(() => {
                /* Chip falls back to an empty count. */
            });
        return () => {
            cancelled = true;
        };
    }, [revision]);

    let body: ReactNode;

    if (tab === "browse") {
        body = <OwnerBrokersBrowse search={brokerSearch} view={view} onViewChange={setView} />;
    } else if (queue.isPending) {
        body = <RequestsListSkeleton view={view} />;
    } else if (queue.isError && queue.items.length === 0) {
        body = (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">Could not load active brokers</p>
                <p className="body-sm text-ink-muted">
                    {apiMessage(queue.error, "Could not load active brokers")}
                </p>
                <button
                    type="button"
                    onClick={() => {
                        setRevision((prev) => prev + 1);
                        void queue.refetch();
                    }}
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
        body = <OwnerBrokersEmpty tab="active" />;
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
                    ariaLabel="Active brokers"
                    renderItem={(item) => (
                        <OwnerRequestCard item={item} view={view} actions="none" />
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
                <h1 className="h3 text-start text-ink">
                    Browse brokers.{" "}
                    <span className="text-ink-muted">
                        {tab === "browse"
                            ? "Find brokers and invite them to represent your listings"
                            : "Brokers currently representing your properties"}
                    </span>
                </h1>
            </PortalSectionNav>

            <OwnerBrokersHeader
                activeTab={tab}
                activeCount={activeCount}
                search={tab === "browse" ? brokerSearch : search}
                onSearchChange={tab === "browse" ? setBrokerSearch : setSearch}
                sort={sort}
                onSortChange={setSort}
                view={view}
                onViewChange={setView}
                isLoading={activeCount == null}
            />

            {body}
        </div>
    );
}
