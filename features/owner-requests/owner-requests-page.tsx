"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import { type RepresentationItem, representativeApi } from "@/lib/api/representative";
import { ownerBrokersHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import { mapRepresentationToOwnerCard } from "@/features/owner-requests/map-owner-request";
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
import type {
    OwnerRequestCardItem,
    OwnerRequestsSummary,
    OwnerRequestsTab,
} from "@/features/owner-requests/types";
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

function sortCards(items: OwnerRequestCardItem[], sort: OwnerRequestsSort) {
    const next = [...items];
    next.sort((a, b) => {
        const aTime = Date.parse(a.createdAt) || 0;
        const bTime = Date.parse(b.createdAt) || 0;
        return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });
    return next;
}

function filterCards(items: OwnerRequestCardItem[], search: string) {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
        const haystack = [
            item.title,
            item.locality,
            item.city,
            item.brokerName,
            item.brokerOrgName ?? "",
            item.message ?? "",
        ]
            .join(" ")
            .toLowerCase();
        return haystack.includes(q);
    });
}

function mapItems(rows: RepresentationItem[]): OwnerRequestCardItem[] {
    return rows
        .map((row) => mapRepresentationToOwnerCard(row))
        .filter((row): row is OwnerRequestCardItem => row != null);
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

    const [queueItems, setQueueItems] = useState<OwnerRequestCardItem[]>([]);
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState<string | null>(null);

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

    useEffect(() => {
        if (legacyBrokersTab) return;
        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setQueueLoading(true);
            setQueueError(null);

            const load =
                tab === "requests"
                    ? representativeApi.ownerRequestPage({ status: "pending", limit: 100 })
                    : representativeApi.ownerInvitationPage({ status: "pending", limit: 100 });

            void load
                .then((page) => {
                    if (!cancelled) setQueueItems(mapItems(page.items));
                })
                .catch((err) => {
                    if (!cancelled) {
                        setQueueError(apiMessage(err, "Could not load requests"));
                        setQueueItems([]);
                    }
                })
                .finally(() => {
                    if (!cancelled) setQueueLoading(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [legacyBrokersTab, tab, revision]);

    const runRepAction = useCallback(
        async (id: string, action: () => Promise<unknown>, success: string) => {
            setBusyId(id);
            try {
                await action();
                toast.success(success);
                setRevision((v) => v + 1);
            } catch (err) {
                toast.error(apiMessage(err, "Something went wrong"));
            } finally {
                setBusyId(null);
            }
        },
        [],
    );

    const visibleCards = useMemo(
        () => sortCards(filterCards(queueItems, search), sort),
        [queueItems, search, sort],
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

    if (!summariesReady || (queueLoading && queueItems.length === 0)) {
        body = <RequestsListSkeleton view={view} />;
    } else if (queueError) {
        body = (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">Could not load your requests</p>
                <p className="body-sm text-ink-muted">{queueError}</p>
                <button
                    type="button"
                    onClick={() => setRevision((prev) => prev + 1)}
                    className="body-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    } else if (queueItems.length === 0) {
        body = <OwnerRequestsEmpty tab={tab} />;
    } else if (visibleCards.length === 0) {
        body = (
            <OwnerRequestsFilteredEmpty
                searchQuery={search}
                onClearFilters={search.trim() ? () => setSearch("") : undefined}
            />
        );
    } else {
        body = (
            <div className={cn(queueLoading && "opacity-60 transition-opacity duration-160")}>
                <WindowVirtualGrid
                    items={visibleCards}
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
