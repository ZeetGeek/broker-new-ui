"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { pipelineApi } from "@/lib/api/pipeline";

import { BoardColumn } from "@/features/pipeline/board-column";
import { DealCard, type DealCardHandlers } from "@/features/pipeline/deal-card";
import { DealDetailModal } from "@/features/pipeline/deal-detail-modal";
import { MakeOfferModal } from "@/features/pipeline/make-offer-modal";
import {
    PipelineDoneEmpty,
    PipelineFilteredEmpty,
    PipelineFirstRunEmpty,
} from "@/features/pipeline/pipeline-empty";
import { PipelineHeader } from "@/features/pipeline/pipeline-header";
import { PipelineIntro } from "@/features/pipeline/pipeline-intro";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { type StageMoveRequest, StageNoteModal } from "@/features/pipeline/stage-note-modal";
import { StageTabs } from "@/features/pipeline/stage-tabs";
import {
    DEAL_STAGE_ORDER,
    type DealDetail,
    type DealItem,
    type DealsFilters,
    type DealsSummary,
    type DealStage,
    type DealStatus,
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

    const [moveRequest, setMoveRequest] = useState<StageMoveRequest | null>(null);
    const [isSavingMove, setIsSavingMove] = useState(false);
    const [offerDealId, setOfferDealId] = useState<string | null>(null);
    const [isSavingOffer, setIsSavingOffer] = useState(false);
    const [viewDealId, setViewDealId] = useState<string | null>(null);
    const [viewDetail, setViewDetail] = useState<DealDetail | null>(null);
    const [isLoadingView, setIsLoadingView] = useState(false);
    const [viewError, setViewError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

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
                    if (!cancelled) {
                        setError("Could not load your deals. Check your connection and try again.");
                    }
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

    const requestMove = useCallback(
        (dealId: string, status: DealStatus, successMessage: string) => {
            setMoveRequest({ dealId, status, successMessage });
        },
        [],
    );

    const openLeadView = useCallback((dealId: string) => {
        setViewDealId(dealId);
        setViewDetail(null);
        setViewError(null);
        setIsLoadingView(true);

        void pipelineApi
            .get(dealId)
            .then((detail) => {
                setViewDetail(detail);
            })
            .catch((error) => {
                setViewError(
                    error instanceof Error ? error.message : "Could not load lead details.",
                );
            })
            .finally(() => setIsLoadingView(false));
    }, []);

    const handleConfirmMove = useCallback(
        async (note: string) => {
            if (!moveRequest) return;

            setIsSavingMove(true);
            setBusyId(moveRequest.dealId);
            try {
                await pipelineApi.setStage(moveRequest.dealId, moveRequest.status, {
                    note,
                });
                setMoveRequest(null);
                setRevision((prev) => prev + 1);
                toast.success(moveRequest.successMessage);
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : "Could not save that. Try again.",
                );
            } finally {
                setIsSavingMove(false);
                setBusyId(null);
            }
        },
        [moveRequest],
    );

    const handleConfirmOffer = useCallback(
        async (offerAmount: number, notes: string) => {
            if (!offerDealId) return;

            setIsSavingOffer(true);
            setBusyId(offerDealId);
            try {
                await pipelineApi.makeOffer(offerDealId, offerAmount, notes);
                setOfferDealId(null);
                setRevision((prev) => prev + 1);
                toast.success("Offer submitted to owner");
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : "Could not submit offer. Try again.",
                );
            } finally {
                setIsSavingOffer(false);
                setBusyId(null);
            }
        },
        [offerDealId],
    );

    const handlers = useMemo<DealCardHandlers>(
        () => ({
            onView: (dealId) => {
                openLeadView(dealId);
            },
            onAdvance: (dealId, stage) => {
                requestMove(
                    dealId,
                    stage,
                    `Moved to ${DEAL_STAGE_META[stage].label.toLowerCase()}`,
                );
            },
            onLogContact: (dealId, currentStatus) => {
                setBusyId(dealId);
                void pipelineApi
                    .logContact(dealId, currentStatus)
                    .then(() => {
                        setRevision((prev) => prev + 1);
                        toast.success("Call logged");
                    })
                    .catch((error) => {
                        toast.error(
                            error instanceof Error
                                ? error.message
                                : "Could not save that. Try again.",
                        );
                    })
                    .finally(() => setBusyId(null));
            },
            onClose: (dealId) => {
                requestMove(dealId, "closed", "Marked as sold");
            },
            onLose: (dealId) => {
                requestMove(dealId, "lost", "Marked as lost");
            },
            onReopen: (dealId, stage) => {
                requestMove(dealId, stage, "Back on the board");
            },
            onMakeOffer: (dealId) => {
                setOfferDealId(dealId);
            },
        }),
        [openLeadView, requestMove],
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

    const moveDeal =
        moveRequest != null
            ? ((deals ?? []).find((deal) => deal.id === moveRequest.dealId) ?? null)
            : null;

    const offerDeal =
        offerDealId != null
            ? ((deals ?? []).find((deal) => deal.id === offerDealId) ?? null)
            : null;

    const isFirstLoad = deals === null;
    const hasSearch = filters.q.trim().length > 0;
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

            {isFirstLoad && isFetching ? null : isFirstRun ? (
                <PipelineFirstRunEmpty />
            ) : view === "done" ? (
                doneDeals.length === 0 ? (
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

                    <div className="flex flex-col gap-4 lg:hidden">
                        <StageTabs
                            active={mobileStage}
                            counts={
                                summary?.counts ?? {
                                    new: 0,
                                    contacted: 0,
                                    visit: 0,
                                    negotiation: 0,
                                }
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
                            <p
                                className="
                                  body-sm rounded-card border border-dashed border-border-warm px-4
                                  py-10 text-center text-ink-muted
                                "
                            >
                                Nothing in {DEAL_STAGE_META[mobileStage].label.toLowerCase()} yet.
                            </p>
                        )}
                    </div>
                </div>
            )}

            <StageNoteModal
                open={moveRequest != null}
                deal={moveDeal}
                request={moveRequest}
                isSaving={isSavingMove}
                onConfirm={(note) => {
                    void handleConfirmMove(note);
                }}
                onCancel={() => {
                    if (!isSavingMove) setMoveRequest(null);
                }}
            />

            <MakeOfferModal
                open={offerDealId != null}
                deal={offerDeal}
                isSaving={isSavingOffer}
                onConfirm={(offerAmount, notes) => {
                    void handleConfirmOffer(offerAmount, notes);
                }}
                onCancel={() => {
                    if (!isSavingOffer) setOfferDealId(null);
                }}
            />

            <DealDetailModal
                open={viewDealId != null}
                deal={viewDetail}
                isLoading={isLoadingView}
                error={viewError}
                onClose={() => {
                    setViewDealId(null);
                    setViewDetail(null);
                    setViewError(null);
                }}
            />
        </div>
    );
}
