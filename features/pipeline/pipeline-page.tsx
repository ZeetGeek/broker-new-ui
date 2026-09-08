"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { pipelineApi } from "@/lib/api/pipeline";

import { BoardColumn } from "@/features/pipeline/board-column";
import { DealCard, type DealCardHandlers } from "@/features/pipeline/deal-card";
import {
    PipelineDoneEmpty,
    PipelineFilteredEmpty,
    PipelineFirstRunEmpty,
} from "@/features/pipeline/pipeline-empty";
import { PipelineHeader } from "@/features/pipeline/pipeline-header";
import { PipelineIntro } from "@/features/pipeline/pipeline-intro";
import { PipelineBoardSkeleton } from "@/features/pipeline/pipeline-skeleton";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { StageTabs } from "@/features/pipeline/stage-tabs";
import {
    DEAL_STAGE_ORDER,
    type DealItem,
    type DealsFilters,
    type DealsSummary,
    type DealStage,
    type DealsView,
    DEFAULT_DEALS_FILTERS,
    isLiveStage,
} from "@/features/pipeline/types";

export function PipelinePage() {
    const [filters, setFilters] = useState<DealsFilters>(DEFAULT_DEALS_FILTERS);
    const [view, setView] = useState<DealsView>("board");
    /** Which stage the mobile tabs are showing. Desktop shows all four. */
    const [mobileStage, setMobileStage] = useState<DealStage>("new");

    const [deals, setDeals] = useState<DealItem[] | null>(null);
    const [summary, setSummary] = useState<DealsSummary | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    /** Bumped after a mutation so the board and summary both refetch. */
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let cancelled = false;

        // Deferred so the loading flag does not set state during the effect
        // body, which would cascade an extra render on every filter change.
        const timer = window.setTimeout(() => {
            if (cancelled) return;

            setIsFetching(true);
            setError(null);

            void pipelineApi
                .list(filters)
                .then((next) => {
                    if (cancelled) return;
                    setDeals(next.items);
                    setSummary(next.summary);
                })
                .catch(() => {
                    if (!cancelled) setError("Could not load your deals. Check your connection and try again.");
                })
                .finally(() => {
                    if (!cancelled) setIsFetching(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [filters, revision]);

    const runMutation = useCallback(
        async (dealId: string, action: () => Promise<void>, message?: string) => {
            setBusyId(dealId);
            try {
                await action();
                setRevision((prev) => prev + 1);
                if (message) toast.success(message);
            } catch {
                toast.error("Could not save that. Try again.");
            } finally {
                setBusyId(null);
            }
        },
        [],
    );

    const handlers = useMemo<DealCardHandlers>(
        () => ({
            onAdvance: (dealId, stage) => {
                void runMutation(
                    dealId,
                    () => pipelineApi.setStage(dealId, stage),
                    `Moved to ${DEAL_STAGE_META[stage].label.toLowerCase()}`,
                );
            },
            onLogContact: (dealId) => {
                void runMutation(dealId, () => pipelineApi.logContact(dealId), "Call logged");
            },
            onClose: (dealId) => {
                void runMutation(dealId, () => pipelineApi.setStage(dealId, "closed"), "Marked as sold");
            },
            onLose: (dealId) => {
                void runMutation(dealId, () => pipelineApi.setStage(dealId, "lost"), "Marked as lost");
            },
            onReopen: (dealId, stage) => {
                void runMutation(dealId, () => pipelineApi.reopen(dealId, stage), "Back on the board");
            },
        }),
        [runMutation],
    );

    const handlePatch = useCallback((patch: Partial<DealsFilters>) => {
        setFilters((prev) => ({ ...prev, ...patch }));
    }, []);

    const handleClearSearch = useCallback(() => {
        setFilters((prev) => ({ ...prev, q: "" }));
    }, []);

    const liveDeals = useMemo(
        () => (deals ?? []).filter((deal) => isLiveStage(deal.status)),
        [deals],
    );

    const doneDeals = useMemo(
        () => (deals ?? []).filter((deal) => !isLiveStage(deal.status)),
        [deals],
    );

    const dealsByStage = useMemo(() => {
        const grouped = Object.fromEntries(
            DEAL_STAGE_ORDER.map((stage) => [stage, [] as DealItem[]]),
        ) as Record<DealStage, DealItem[]>;

        for (const deal of liveDeals) {
            if (isLiveStage(deal.status)) grouped[deal.status].push(deal);
        }

        return grouped;
    }, [liveDeals]);

    const isFirstLoad = deals === null;
    const hasSearch = filters.q.trim().length > 0;
    /** True first-run: no deals at all, and nothing filtered them away. */
    const isFirstRun =
        !hasSearch &&
        summary != null &&
        summary.liveTotal + summary.closedCount + summary.lostCount === 0;

    return (
        <div className="flex flex-col gap-6">
            <PipelineIntro summary={summary} isLoading={isFetching} view={view} />

            {!isFirstRun ? (
                <PipelineHeader
                    filters={filters}
                    view={view}
                    onViewChange={setView}
                    onPatch={handlePatch}
                />
            ) : null}

            {error ? (
                <p role="alert" className="body-sm text-urgent">
                    {error}
                </p>
            ) : null}

            {isFirstLoad && isFetching ? (
                <PipelineBoardSkeleton />
            ) : isFirstRun ? (
                <PipelineFirstRunEmpty />
            ) : view === "done" ? (
                doneDeals.length === 0 ? (
                    hasSearch ? (
                        <PipelineFilteredEmpty onClear={handleClearSearch} />
                    ) : (
                        <PipelineDoneEmpty />
                    )
                ) : (
                    // Finished deals are a list, not a board: they have no
                    // next stage, so columns would carry no information.
                    <div
                        className={
                            isFetching ? "opacity-60 transition-opacity duration-160" : undefined
                        }
                    >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {doneDeals.map((deal) => (
                                <DealCard
                                    key={deal.id}
                                    deal={deal}
                                    handlers={handlers}
                                    isBusy={busyId === deal.id}
                                    layout="list"
                                />
                            ))}
                        </div>
                    </div>
                )
            ) : liveDeals.length === 0 ? (
                hasSearch ? (
                    <PipelineFilteredEmpty onClear={handleClearSearch} />
                ) : (
                    <PipelineDoneEmpty />
                )
            ) : (
                <div
                    className={
                        isFetching ? "opacity-60 transition-opacity duration-160" : undefined
                    }
                >
                    {/* Desktop: four columns, drag to move. */}
                    <div className="hidden gap-3 lg:grid lg:grid-cols-4 lg:items-start">
                        {DEAL_STAGE_ORDER.map((stage) => (
                            <BoardColumn
                                key={stage}
                                stage={stage}
                                deals={dealsByStage[stage]}
                                handlers={handlers}
                                busyId={busyId}
                                onDropDeal={handlers.onAdvance}
                            />
                        ))}
                    </div>

                    {/* Mobile: stage tabs plus one stage's list — a four-column
                        drag board does not fit a phone. docs/DESIGN.md §5.4. */}
                    <div className="flex flex-col gap-4 lg:hidden">
                        <StageTabs
                            active={mobileStage}
                            counts={
                                summary?.counts ?? { new: 0, contacted: 0, visit: 0, negotiation: 0 }
                            }
                            onChange={setMobileStage}
                        />

                        {dealsByStage[mobileStage].length > 0 ? (
                            <div className="flex flex-col gap-2.5">
                                {dealsByStage[mobileStage].map((deal) => (
                                    <DealCard
                                        key={deal.id}
                                        deal={deal}
                                        handlers={handlers}
                                        isBusy={busyId === deal.id}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="
                              body-sm rounded-card border border-dashed border-border-warm px-4
                              py-10 text-center text-ink-muted
                            ">
                                Nothing in {DEAL_STAGE_META[mobileStage].label.toLowerCase()} yet.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
