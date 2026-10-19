"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { myRequestsApi } from "@/lib/api/my-requests";
import { ownerInvitesApi } from "@/lib/api/owner-invites";
import { cn } from "@/lib/utils";

import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import { InviteCard } from "@/features/properties/my-requests/invite-card";
import type { InviteItem, InvitesSummary } from "@/features/properties/my-requests/invite-types";
import { RequestCard } from "@/features/properties/my-requests/request-card";
import { RequestsFilteredEmpty } from "@/features/properties/my-requests/requests-empty";
import { REQUESTS_GRID_BREAKPOINTS } from "@/features/properties/my-requests/requests-grid-class";
import { MyDealsHeader } from "@/features/properties/my-requests/requests-header";
import { RequestsListSkeleton } from "@/features/properties/my-requests/requests-skeleton";
import type {
    RequestItem,
    RequestSort,
    RequestsSummary,
} from "@/features/properties/my-requests/types";
import { useRequestsFilters } from "@/features/properties/my-requests/use-requests-filters";

type RejectedRow =
    | { kind: "request"; item: RequestItem; sortAt: number }
    | { kind: "invite"; item: InviteItem; sortAt: number };

function toTime(iso: string | null | undefined): number {
    return iso ? new Date(iso).getTime() : 0;
}

function inviteSortFromRequestSort(
    sort: RequestSort,
): "recent" | "oldest" | "price_desc" | "price_asc" {
    if (sort === "oldest" || sort === "price_desc" || sort === "price_asc") return sort;
    return "recent";
}

export function RejectedPanel({
    sentSummary,
    inviteSummary,
    onSentSummary,
    onInviteSummary,
}: {
    sentSummary: RequestsSummary | null;
    inviteSummary: InvitesSummary | null;
    onSentSummary: (summary: RequestsSummary) => void;
    onInviteSummary: (summary: InvitesSummary) => void;
}) {
    const { filters, patchFilters, clearFilters, filterSignature } = useRequestsFilters();

    const [rows, setRows] = useState<RejectedRow[] | null>(null);
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

            const inviteFilters = {
                q: filters.q,
                stage: "declined" as const,
                sort: inviteSortFromRequestSort(filters.sort),
                type: filters.type,
                page: 1,
                limit: filters.limit,
            };

            void Promise.all([
                myRequestsApi.list({ ...filters, view: "declined" }),
                ownerInvitesApi.list(inviteFilters),
            ])
                .then(([sent, invites]) => {
                    if (cancelled) return;

                    const next: RejectedRow[] = [
                        ...sent.items.map((item) => ({
                            kind: "request" as const,
                            item,
                            sortAt: toTime(item.resolvedAt ?? item.requestedAt),
                        })),
                        ...invites.items.map((item) => ({
                            kind: "invite" as const,
                            item,
                            sortAt: toTime(item.respondedAt ?? item.invitedAt),
                        })),
                    ];

                    next.sort((a, b) => {
                        switch (filters.sort) {
                            case "oldest":
                                return a.sortAt - b.sortAt;
                            case "price_desc":
                                return b.item.amountInr - a.item.amountInr;
                            case "price_asc":
                                return a.item.amountInr - b.item.amountInr;
                            default:
                                return b.sortAt - a.sortAt;
                        }
                    });

                    setRows(next);
                })
                .catch(() => {
                    if (!cancelled) setError("Could not load rejected deals. Try again.");
                })
                .finally(() => {
                    if (!cancelled) setIsFetching(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- signature is the stable key
    }, [filterSignature, revision]);

    useEffect(() => {
        let cancelled = false;

        void Promise.all([myRequestsApi.summary(), ownerInvitesApi.summary()])
            .then(([sentNext, invitesNext]) => {
                if (cancelled) return;
                onSentSummary(sentNext);
                onInviteSummary(invitesNext);
            })
            .catch(() => {
                /* Keep last good summaries in the header. */
            });

        return () => {
            cancelled = true;
        };
    }, [revision, onInviteSummary, onSentSummary]);

    const handleRefresh = useCallback(() => setRevision((prev) => prev + 1), []);

    const runMutation = useCallback(async (id: string, action: () => Promise<void>) => {
        setBusyId(id);
        try {
            await action();
            setRevision((prev) => prev + 1);
        } catch {
            toast.error("Something went wrong. Try again.");
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

    const narrowFilters = filters.q.trim().length > 0 || Boolean(filters.type);

    const rejectedTotal = useMemo(
        () => (sentSummary?.counts.declined ?? 0) + (inviteSummary?.counts.declined ?? 0),
        [inviteSummary?.counts.declined, sentSummary?.counts.declined],
    );

    const header = (
        <MyDealsHeader
            activeTab="rejected"
            sentSummary={sentSummary}
            inviteSummary={inviteSummary}
            sentFilters={filters}
            inviteFilters={{
                q: filters.q,
                stage: "declined",
                sort: inviteSortFromRequestSort(filters.sort),
                type: filters.type,
                page: 1,
                limit: filters.limit,
            }}
            onPatchSent={patchFilters}
            onPatchInvites={() => undefined}
        />
    );

    let body: ReactNode;

    if (!rows && isFetching) {
        body = <RequestsListSkeleton />;
    } else if (error) {
        body = (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">Could not load rejected deals</p>
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
    } else if (!rows) {
        body = <RequestsListSkeleton />;
    } else if (rejectedTotal === 0 && !narrowFilters) {
        body = (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">No rejected deals</p>
                <p className="body-sm max-w-prose text-ink-muted">
                    When an owner turns down your request, or you turn down their invite, it shows
                    up here.
                </p>
            </div>
        );
    } else if (rows.length === 0) {
        body = (
            <RequestsFilteredEmpty
                onClearFilters={narrowFilters ? clearFilters : undefined}
                searchQuery={filters.q}
            />
        );
    } else {
        body = (
            <div className={cn(isFetching && "opacity-60 transition-opacity duration-160")}>
                <WindowVirtualGrid
                    items={rows}
                    getKey={(row) => `${row.kind}-${row.item.id}`}
                    estimateRowHeight={520}
                    gap={24}
                    breakpoints={REQUESTS_GRID_BREAKPOINTS}
                    ariaLabel="Rejected deals"
                    renderItem={(row) =>
                        row.kind === "request" ? (
                            <RequestCard
                                item={row.item}
                                onNudge={handleNudge}
                                onWithdraw={handleWithdraw}
                                onRetry={handleRetry}
                                onBuyersChanged={handleRefresh}
                                isBusy={busyId === row.item.id}
                            />
                        ) : (
                            <InviteCard
                                item={row.item}
                                onAccept={() => undefined}
                                onDecline={() => undefined}
                                onBuyersChanged={handleRefresh}
                                isBusy={busyId === row.item.id}
                            />
                        )
                    }
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
