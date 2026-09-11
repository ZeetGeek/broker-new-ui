"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { myRequestsApi } from "@/lib/api/my-requests";
import { ownerInvitesApi } from "@/lib/api/owner-invites";
import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import type { InvitesSummary } from "@/features/properties/my-requests/invite-types";
import { InvitesIntro } from "@/features/properties/my-requests/invites-intro";
import { InvitesPanel } from "@/features/properties/my-requests/invites-panel";
import { RequestCard } from "@/features/properties/my-requests/request-card";
import {
    RequestsFilteredEmpty,
    RequestsFirstRunEmpty,
} from "@/features/properties/my-requests/requests-empty";
import { RequestsHeader } from "@/features/properties/my-requests/requests-header";
import { RequestsIntro } from "@/features/properties/my-requests/requests-intro";
import {
    RequestsListSkeleton,
    RequestsPageSkeleton,
} from "@/features/properties/my-requests/requests-skeleton";
import { type RequestsTab, RequestsTabs } from "@/features/properties/my-requests/requests-tabs";
import type { RequestsResult, RequestsSummary } from "@/features/properties/my-requests/types";
import { useRequestsFilters } from "@/features/properties/my-requests/use-requests-filters";
import { useRequestsView } from "@/features/properties/my-requests/use-requests-view";

const REQUEST_GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 1024, columns: 3 },
    { minWidth: 1280, columns: 4 },
];
const SINGLE_COLUMN_BREAKPOINTS: [] = [];

function SentRequestsPanel({ onSummary }: { onSummary?: (summary: RequestsSummary) => void }) {
    const { filters, patchFilters, clearFilters, hasActiveFilters, filterSignature } =
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
                if (cancelled) return;
                setSummary(next);
                onSummary?.(next);
            })
            .catch(() => {
                if (!cancelled) setSummary(null);
            });

        return () => {
            cancelled = true;
        };
    }, [revision, onSummary]);

    const runMutation = useCallback(
        async (id: string, action: () => Promise<void>, successMessage?: string) => {
            setBusyId(id);
            try {
                await action();
                if (successMessage) toast.success(successMessage);
                setRevision((prev) => prev + 1);
            } catch {
                toast.error("Something went wrong. Try again.");
            } finally {
                setBusyId(null);
            }
        },
        [],
    );

    const handleNudge = useCallback(
        (id: string) => {
            void runMutation(id, () => myRequestsApi.nudge(id), "Reminder sent to the owner");
        },
        [runMutation],
    );

    const handleWithdraw = useCallback(
        (id: string) => {
            void runMutation(id, () => myRequestsApi.withdraw(id), "Request cancelled");
        },
        [runMutation],
    );

    /** Buyer changes live in the clients API, so just refetch this list. */
    const handleRefresh = useCallback(() => {
        setRevision((prev) => prev + 1);
    }, []);

    const handleRetry = useCallback(
        (id: string) => {
            void runMutation(id, () => myRequestsApi.retry(id), "Request sent again");
        },
        [runMutation],
    );

    if (!result && isFetching) {
        return <RequestsPageSkeleton />;
    }

    // A broker who has never sent a request gets the pool, not an empty table.
    const isFirstRun = summary != null && summary.counts.all === 0;

    return (
        <div className="flex flex-col gap-6">
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
                            <WindowVirtualGrid
                                items={result.items}
                                getKey={(item) => item.id}
                                estimateRowHeight={view === "list" ? 360 : 620}
                                gap={view === "list" ? 16 : 20}
                                breakpoints={
                                    view === "list"
                                        ? SINGLE_COLUMN_BREAKPOINTS
                                        : REQUEST_GRID_BREAKPOINTS
                                }
                                ariaLabel="Representation requests"
                                renderItem={(item) => (
                                    <RequestCard
                                        item={item}
                                        view={view}
                                        onNudge={handleNudge}
                                        onWithdraw={handleWithdraw}
                                        onRetry={handleRetry}
                                        onBuyersChanged={handleRefresh}
                                        isBusy={busyId === item.id}
                                    />
                                )}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export function MyRequestsPage({ activeTab }: { activeTab: RequestsTab }) {
    const [sentSummary, setSentSummary] = useState<RequestsSummary | null>(null);
    const [inviteSummary, setInviteSummary] = useState<InvitesSummary | null>(null);

    // Both tab counts have to be right whichever tab is open, so the summaries
    // are fetched here rather than only by the panel that renders the list.
    useEffect(() => {
        let cancelled = false;

        void Promise.all([myRequestsApi.summary(), ownerInvitesApi.summary()]).then(
            ([sent, invites]) => {
                if (cancelled) return;
                setSentSummary(sent);
                setInviteSummary(invites);
            },
        );

        return () => {
            cancelled = true;
        };
    }, [activeTab]);

    const isInvites = activeTab === "invites";

    // Title, stats and tabs share the portal header row so the heading always
    // names the tab you are on.
    const headerSection = (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="min-inline-0">
                {isInvites ? (
                    <InvitesIntro summary={inviteSummary} isLoading={!inviteSummary} />
                ) : (
                    <RequestsIntro summary={sentSummary} isLoading={!sentSummary} />
                )}
            </div>

            <RequestsTabs
                activeTab={activeTab}
                sentCount={sentSummary?.counts.all}
                inviteCount={inviteSummary?.counts.all}
                waitingCount={inviteSummary?.waitingOnYouCount ?? 0}
                className="shrink-0 lg:justify-end"
            />
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>{headerSection}</PortalSectionNav>

            {isInvites ? (
                <InvitesPanel onSummary={setInviteSummary} />
            ) : (
                <SentRequestsPanel onSummary={setSentSummary} />
            )}
        </div>
    );
}
