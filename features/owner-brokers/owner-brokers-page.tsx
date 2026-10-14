"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import { representativeApi } from "@/lib/api/representative";
import { cn } from "@/lib/utils";

import { InfiniteListStatus } from "@/components/shared/infinite-list-status";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";
import { Button } from "@/components/ui/button";

import { ActiveBrokerCard } from "@/features/owner-brokers/active-broker-card";
import {
    BrowseBrokersSkeleton,
    OWNER_BROKERS_GRID_BREAKPOINTS,
} from "@/features/owner-brokers/browse-brokers-skeleton";
import { OwnerBrokersBrowse } from "@/features/owner-brokers/owner-brokers-browse";
import { OwnerBrokersEmpty } from "@/features/owner-brokers/owner-brokers-empty";
import { OwnerBrokersHeader } from "@/features/owner-brokers/owner-brokers-header";
import { OwnerBrokersIntro } from "@/features/owner-brokers/owner-brokers-intro";
import type { OwnerBrokersTab } from "@/features/owner-brokers/types";
import { OwnerRequestsFilteredEmpty } from "@/features/owner-requests/owner-requests-empty";
import type { OwnerRequestsSort } from "@/features/owner-requests/owner-requests-header";
import { useOwnerRepQueue } from "@/features/owner-requests/use-owner-rep-queue";

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
    const [revision, setRevision] = useState(0);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<OwnerRequestsSort>("recent");

    const [activeCount, setActiveCount] = useState<number | null>(null);
    const [browseCount, setBrowseCount] = useState<number | null>(null);
    const [brokerSearch, setBrokerSearch] = useState("");

    const onBrowseTotalChange = useCallback((total: number | null) => {
        setBrowseCount(total);
    }, []);

    const queue = useOwnerRepQueue({
        kind: "active",
        search,
        sort,
        enabled: tab === "active",
    });

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

    const introCount = tab === "browse" ? browseCount : activeCount;

    let body: ReactNode;

    if (tab === "browse") {
        body = <OwnerBrokersBrowse search={brokerSearch} onTotalChange={onBrowseTotalChange} />;
    } else if (queue.isPending) {
        body = <BrowseBrokersSkeleton />;
    } else if (queue.isError && queue.items.length === 0) {
        body = (
            <div role="alert" className="flex flex-col items-start gap-3 py-12">
                <p className="body-sm font-medium text-ink">
                    Active brokers could not load. Check your connection and try again.
                </p>
                <p className="body-sm text-ink-muted">
                    {apiMessage(queue.error, "Could not load active brokers")}
                </p>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                        setRevision((prev) => prev + 1);
                        void queue.refetch();
                    }}
                >
                    Try again
                </Button>
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
                    estimateRowHeight={320}
                    gap={24}
                    breakpoints={OWNER_BROKERS_GRID_BREAKPOINTS}
                    ariaLabel="Active brokers"
                    renderItem={(item) => <ActiveBrokerCard item={item} />}
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
            <OwnerBrokersIntro tab={tab} count={introCount} />

            <OwnerBrokersHeader
                activeTab={tab}
                browseCount={browseCount}
                activeCount={activeCount}
                search={tab === "browse" ? brokerSearch : search}
                onSearchChange={tab === "browse" ? setBrokerSearch : setSearch}
                sort={sort}
                onSortChange={setSort}
                isLoading={tab === "browse" ? browseCount == null : activeCount == null}
            />

            {body}
        </div>
    );
}
