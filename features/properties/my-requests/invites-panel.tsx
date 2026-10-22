"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { ownerInvitesApi } from "@/lib/api/owner-invites";
import { cn } from "@/lib/utils";

import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import { InviteCard } from "@/features/properties/my-requests/invite-card";
import type { InvitesResult, InvitesSummary } from "@/features/properties/my-requests/invite-types";
import {
    InvitesFirstRunEmpty,
    RequestsFilteredEmpty,
} from "@/features/properties/my-requests/requests-empty";
import {
    REQUESTS_GRID_BREAKPOINTS,
    REQUESTS_GRID_CLASS,
} from "@/features/properties/my-requests/requests-grid-class";
import { MyDealsHeader } from "@/features/properties/my-requests/requests-header";
import { RequestsListSkeleton } from "@/features/properties/my-requests/requests-skeleton";
import {
    DEFAULT_REQUESTS_FILTERS,
    type RequestsSummary,
} from "@/features/properties/my-requests/types";
import { useInvitesFilters } from "@/features/properties/my-requests/use-invites-filters";

export function InvitesPanel({
    sentSummary,
    inviteSummary,
    onSummary,
}: {
    sentSummary: RequestsSummary | null;
    inviteSummary: InvitesSummary | null;
    onSummary: (summary: InvitesSummary) => void;
}) {
    const { filters, patchFilters, clearFilters, hasActiveFilters, filterSignature } =
        useInvitesFilters();

    const [result, setResult] = useState<InvitesResult | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setIsFetching(true);

            void ownerInvitesApi
                .list({ ...filters, stage: "pending" })
                .then((next) => {
                    if (!cancelled) setResult(next);
                })
                .finally(() => {
                    if (!cancelled) setIsFetching(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
        // Intentionally omit `filters`: contents live in `filterSignature`.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- signature is the stable key
    }, [filterSignature, revision]);

    useEffect(() => {
        let cancelled = false;

        void ownerInvitesApi.summary().then((next) => {
            if (cancelled) return;
            onSummary(next);
        });

        return () => {
            cancelled = true;
        };
    }, [revision, onSummary]);

    const runMutation = useCallback(
        async (id: string, action: () => Promise<void>, ok?: string) => {
            setBusyId(id);
            try {
                await action();
                if (ok) toast.success(ok);
                setRevision((prev) => prev + 1);
            } catch {
                toast.error("Something went wrong. Try again.");
            } finally {
                setBusyId(null);
            }
        },
        [],
    );

    const handleAccept = useCallback(
        (id: string) =>
            void runMutation(
                id,
                () => ownerInvitesApi.accept(id),
                "Invite accepted — you can sell this property",
            ),
        [runMutation],
    );

    const handleDecline = useCallback(
        (id: string) => void runMutation(id, () => ownerInvitesApi.decline(id), "Invite declined"),
        [runMutation],
    );

    const handleRefresh = useCallback(() => setRevision((prev) => prev + 1), []);

    const header = (
        <MyDealsHeader
            activeTab="invites"
            sentSummary={sentSummary}
            inviteSummary={inviteSummary}
            sentFilters={DEFAULT_REQUESTS_FILTERS}
            inviteFilters={filters}
            onPatchSent={() => undefined}
            onPatchInvites={patchFilters}
        />
    );

    let body: ReactNode;

    if (!result && isFetching) {
        body = (
            <RequestsListSkeleton
                activeTab="invites"
                count={Math.max(1, Math.min(10, inviteSummary?.waitingOnYouCount || 5))}
            />
        );
    } else if (inviteSummary && inviteSummary.counts.all === 0) {
        body = <InvitesFirstRunEmpty />;
    } else if (
        inviteSummary &&
        inviteSummary.waitingOnYouCount === 0 &&
        !(filters.q.trim() || filters.type)
    ) {
        body = (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">No invitations waiting</p>
                <p className="body-sm max-w-prose text-ink-muted">
                    Invites you already answered are under Representing.
                </p>
            </div>
        );
    } else if (!result) {
        body = (
            <RequestsListSkeleton
                activeTab="invites"
                count={Math.max(1, Math.min(10, inviteSummary?.waitingOnYouCount || 5))}
            />
        );
    } else if (result.items.length === 0) {
        const narrowFilters = filters.q.trim().length > 0 || Boolean(filters.type);
        body = (
            <RequestsFilteredEmpty
                onClearFilters={narrowFilters || hasActiveFilters ? clearFilters : undefined}
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
                    gridClassName={REQUESTS_GRID_CLASS}
                    ariaLabel="Owner invitations"
                    renderItem={(item) => (
                        <InviteCard
                            item={item}
                            onAccept={handleAccept}
                            onDecline={handleDecline}
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
