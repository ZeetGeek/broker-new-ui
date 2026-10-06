"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { myRequestsApi } from "@/lib/api/my-requests";
import { ownerInvitesApi } from "@/lib/api/owner-invites";
import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import {
    DEFAULT_INVITES_FILTERS,
    type InvitesSummary,
} from "@/features/properties/my-requests/invite-types";
import { InvitesPanel } from "@/features/properties/my-requests/invites-panel";
import { RequestCard } from "@/features/properties/my-requests/request-card";
import {
    RequestsFilteredEmpty,
    RequestsFirstRunEmpty,
} from "@/features/properties/my-requests/requests-empty";
import { REQUESTS_GRID_BREAKPOINTS } from "@/features/properties/my-requests/requests-grid-class";
import { MyDealsHeader } from "@/features/properties/my-requests/requests-header";
import { MyDealsIntro } from "@/features/properties/my-requests/requests-intro";
import {
    RequestsListSkeleton,
    RequestsPageSkeleton,
} from "@/features/properties/my-requests/requests-skeleton";
import type { RequestsTab } from "@/features/properties/my-requests/requests-tabs";
import type { RequestsResult, RequestsSummary } from "@/features/properties/my-requests/types";
import { useRequestsFilters } from "@/features/properties/my-requests/use-requests-filters";

function SentRequestsPanel({
    sentSummary,
    inviteSummary,
    onSummary,
}: {
    sentSummary: RequestsSummary | null;
    inviteSummary: InvitesSummary | null;
    onSummary: (summary: RequestsSummary) => void;
}) {
    const { filters, patchFilters, clearFilters, hasActiveFilters, filterSignature } =
        useRequestsFilters();

    const [result, setResult] = useState<RequestsResult | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let cancelled = false;

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
        // Intentionally omit `filters`: its contents are encoded in `filterSignature`.
        // Depending on the object identity retriggers broker/list + clients/leads forever.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- signature is the stable key
    }, [filterSignature, revision]);

    useEffect(() => {
        let cancelled = false;

        void myRequestsApi
            .summary()
            .then((next) => {
                if (cancelled) return;
                onSummary(next);
            })
            .catch(() => {
                /* Keep the last good summary in the header. */
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

    const handleRefresh = useCallback(() => {
        setRevision((prev) => prev + 1);
    }, []);

    const handleRetry = useCallback(
        (id: string) => {
            void runMutation(id, () => myRequestsApi.retry(id), "Request sent again");
        },
        [runMutation],
    );

    const header = (
        <MyDealsHeader
            activeTab="sent"
            sentSummary={sentSummary}
            inviteSummary={inviteSummary}
            sentFilters={filters}
            inviteFilters={DEFAULT_INVITES_FILTERS}
            onPatchSent={patchFilters}
            onPatchInvites={() => undefined}
        />
    );

    let body: ReactNode;

    if (!result && isFetching) {
        body = <RequestsListSkeleton />;
    } else if (sentSummary != null && sentSummary.counts.all === 0) {
        body = <RequestsFirstRunEmpty />;
    } else if (error) {
        body = (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">Could not load your requests</p>
                <p className="body-sm text-ink-muted">{error}</p>
                <button
                    type="button"
                    onClick={() => setRevision((prev) => prev + 1)}
                    className="body-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    } else if (!result) {
        body = <RequestsListSkeleton />;
    } else if (result.items.length === 0) {
        body = (
            <RequestsFilteredEmpty
                onClearFilters={hasActiveFilters ? clearFilters : undefined}
                searchQuery={filters.q}
            />
        );
    } else {
        body = (
            <div className={cn(isFetching && "opacity-60 transition-opacity duration-160")}>
                <WindowVirtualGrid
                    items={result.items}
                    getKey={(item) => item.id}
                    estimateRowHeight={520}
                    gap={24}
                    breakpoints={REQUESTS_GRID_BREAKPOINTS}
                    ariaLabel="Representation requests"
                    renderItem={(item) => (
                        <RequestCard
                            item={item}
                            onNudge={handleNudge}
                            onWithdraw={handleWithdraw}
                            onRetry={handleRetry}
                            onBuyersChanged={handleRefresh}
                            isBusy={busyId === item.id}
                        />
                    )}
                />
            </div>
        );
    }

    return (
        <>
            {header}
            {body}
        </>
    );
}

export function MyRequestsPage({ activeTab }: { activeTab: RequestsTab }) {
    const [sentSummary, setSentSummary] = useState<RequestsSummary | null>(null);
    const [inviteSummary, setInviteSummary] = useState<InvitesSummary | null>(null);
    const [summariesReady, setSummariesReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        void Promise.all([myRequestsApi.summary(), ownerInvitesApi.summary()])
            .then(([sentNext, invitesNext]) => {
                if (cancelled) return;
                setSentSummary(sentNext);
                setInviteSummary(invitesNext);
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
    }, []);

    if (!summariesReady) {
        return <RequestsPageSkeleton />;
    }

    const isInvites = activeTab === "invites";

    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>
                <MyDealsIntro
                    activeTab={activeTab}
                    sentSummary={sentSummary}
                    inviteSummary={inviteSummary}
                    isLoading={!summariesReady}
                />
            </PortalSectionNav>

            {isInvites ? (
                <InvitesPanel
                    sentSummary={sentSummary}
                    inviteSummary={inviteSummary}
                    onSummary={setInviteSummary}
                />
            ) : (
                <SentRequestsPanel
                    sentSummary={sentSummary}
                    inviteSummary={inviteSummary}
                    onSummary={setSentSummary}
                />
            )}
        </div>
    );
}
