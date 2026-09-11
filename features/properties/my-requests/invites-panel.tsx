"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Inbox, ListFilter, Search } from "lucide-react";

import { ownerInvitesApi } from "@/lib/api/owner-invites";
import { cn } from "@/lib/utils";

import { AppPagination } from "@/components/shared/app-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { InviteCard } from "@/features/properties/my-requests/invite-card";
import {
    INVITE_STAGE_META,
    INVITE_STAGE_ORDER,
} from "@/features/properties/my-requests/invite-stage-meta";
import type {
    InvitesResult,
    InvitesSummary,
    InviteStageFilter,
} from "@/features/properties/my-requests/invite-types";
import {
    REQUESTS_GRID_CLASS,
    REQUESTS_LIST_CLASS,
} from "@/features/properties/my-requests/requests-grid-class";
import { RequestsListSkeleton } from "@/features/properties/my-requests/requests-skeleton";
import { RequestsViewToggle } from "@/features/properties/my-requests/requests-view-toggle";
import { useInvitesFilters } from "@/features/properties/my-requests/use-invites-filters";
import { useRequestsView } from "@/features/properties/my-requests/use-requests-view";
import { ownerListingsChipClassName } from "@/features/properties/owner-listings/owner-listings-chip-styles";

const STAGE_LABELS: Record<InviteStageFilter, string> = {
    all: "All invites",
    pending: INVITE_STAGE_META.pending.label,
    accepted: INVITE_STAGE_META.accepted.label,
    declined: INVITE_STAGE_META.declined.label,
    expired: INVITE_STAGE_META.expired.label,
};

function countFor(summary: InvitesSummary | null, stage: InviteStageFilter): number {
    if (!summary) return 0;
    return stage === "all" ? summary.counts.all : summary.counts[stage];
}

export function InvitesPanel({ onSummary }: { onSummary?: (summary: InvitesSummary) => void }) {
    const { filters, setFilters, patchFilters, clearFilters, hasActiveFilters, filterSignature } =
        useInvitesFilters();
    const { view, setView } = useRequestsView();

    const [result, setResult] = useState<InvitesResult | null>(null);
    const [summary, setSummary] = useState<InvitesSummary | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);
    const [draft, setDraft] = useState(filters.q);
    const [prevQuery, setPrevQuery] = useState(filters.q);

    // An external change (back button, cleared filters) wins over a stale draft.
    if (filters.q !== prevQuery) {
        setPrevQuery(filters.q);
        setDraft(filters.q);
    }

    useEffect(() => {
        if (draft === filters.q) return undefined;
        const timer = window.setTimeout(() => patchFilters({ q: draft }), 300);
        return () => window.clearTimeout(timer);
    }, [draft, filters.q, patchFilters]);

    useEffect(() => {
        let cancelled = false;

        // Deferred so the loading flag does not set state during the effect body.
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setIsFetching(true);

            void ownerInvitesApi
                .list(filters)
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
    }, [filterSignature, filters, revision]);

    useEffect(() => {
        let cancelled = false;

        void ownerInvitesApi.summary().then((next) => {
            if (cancelled) return;
            setSummary(next);
            onSummary?.(next);
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

    const handlePageChange = useCallback(
        (page: number) => {
            setFilters((prev) => ({ ...prev, page: Math.max(1, page) }));
            window.scrollTo({ top: 0, behavior: "smooth" });
        },
        [setFilters],
    );

    if (!result && isFetching) {
        return <RequestsListSkeleton view={view} />;
    }

    // Nothing has ever arrived — explain the mechanism rather than show a filter.
    if (summary && summary.counts.all === 0) {
        return (
            <EmptyState
                icon={Inbox}
                heading="No invites yet"
                description="When an owner picks you to sell their property, their invite shows up here."
            />
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <button
                                type="button"
                                aria-label="Show invites at one stage"
                                className={cn(
                                    ownerListingsChipClassName(filters.stage !== "all"),
                                    "gap-2",
                                    filters.stage === "all" && "text-ink-muted",
                                )}
                            >
                                <ListFilter
                                    aria-hidden
                                    className="text-brand block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                {STAGE_LABELS[filters.stage]}
                                <span className="font-medium tabular-nums">
                                    ( {countFor(summary, filters.stage)} )
                                </span>
                            </button>
                        }
                    />
                    <DropdownMenuContent
                        align="start"
                        sideOffset={10}
                        className="p-2 min-inline-64"
                    >
                        <DropdownMenuRadioGroup
                            value={filters.stage}
                            onValueChange={(next) =>
                                patchFilters({ stage: next as InviteStageFilter })
                            }
                        >
                            {(["all", ...INVITE_STAGE_ORDER] as InviteStageFilter[]).map(
                                (stage) => (
                                    <DropdownMenuRadioItem
                                        key={stage}
                                        value={stage}
                                        className={cn(
                                            `
                                              my-0.5 cursor-pointer! items-center gap-3 rounded-inner
                                              border border-transparent px-2.5 py-2 pe-9 font-normal
                                              text-ink
                                            `,
                                            `
                                              **:data-[slot=dropdown-menu-radio-item-indicator]:text-brand
                                            `,
                                            filters.stage === stage &&
                                                "border-brand bg-brand-soft! text-ink!",
                                        )}
                                    >
                                        <span
                                            className="
                                              flex flex-1 items-baseline gap-1.5 text-start
                                            "
                                        >
                                            <span className="text-[15px] font-medium">
                                                {STAGE_LABELS[stage]}
                                            </span>
                                            <span className="tabular text-[13px] text-ink-muted">
                                                {countFor(summary, stage)}
                                            </span>
                                        </span>
                                    </DropdownMenuRadioItem>
                                ),
                            )}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex shrink-0 items-center gap-2.5">
                    <Input
                        size="sm"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="Search invites"
                        aria-label="Search owner invites"
                        startIcon={Search}
                        clearable
                        wrapperClassName="
                          min-inline-44 inline-44 shadow-sm
                          sm:min-inline-52 sm:inline-52
                        "
                        className="
                          rounded-control border! border-border-warm bg-surface text-sm font-medium
                          shadow-sm block-[38px]!
                          hover:border-ink/25!
                          focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20
                        "
                    />
                    <RequestsViewToggle view={view} onViewChange={setView} />
                </div>
            </div>

            {!result ? (
                <RequestsListSkeleton view={view} />
            ) : result.items.length === 0 ? (
                <EmptyState
                    icon={Inbox}
                    heading="Nothing matches what you picked"
                    description="Try another option above, or clear it to see every invite."
                >
                    {hasActiveFilters ? (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="
                              body-sm font-semibold text-brand underline-offset-4
                              hover:underline
                            "
                        >
                            Clear filters
                        </button>
                    ) : null}
                </EmptyState>
            ) : (
                <div
                    className={cn(
                        "flex flex-col gap-8",
                        isFetching && "opacity-60 transition-opacity duration-160",
                    )}
                >
                    <ul className={view === "list" ? REQUESTS_LIST_CLASS : REQUESTS_GRID_CLASS}>
                        {result.items.map((item) => (
                            <InviteCard
                                key={item.id}
                                item={item}
                                view={view}
                                onAccept={handleAccept}
                                onDecline={handleDecline}
                                onBuyersChanged={handleRefresh}
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
                            onPageSizeChange={(limit) => patchFilters({ limit })}
                            aria-label="Invite pages"
                        />
                    ) : null}
                </div>
            )}
        </div>
    );
}
