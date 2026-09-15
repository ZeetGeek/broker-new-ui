"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { pipelineApi } from "@/lib/api/pipeline";
import { PREF_KEYS } from "@/lib/prefs/keys";
import { usePersistedJson } from "@/hooks/use-persisted-json";

import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import {
    isQuietDeal,
    matchesClientFilters,
    type OtherBuyer,
    otherBuyersOnProperty,
    uniqueLocalities,
    uniqueOwners,
} from "@/features/pipeline/deal-attention";
import { DealCard, type DealCardHandlers } from "@/features/pipeline/deal-card";
import { DealCardRich } from "@/features/pipeline/deal-card-rich";
import { DealDetailModal } from "@/features/pipeline/deal-detail-modal";
import { DealNoteModal } from "@/features/pipeline/deal-note-modal";
import { MakeOfferModal } from "@/features/pipeline/make-offer-modal";
import { PipelineBoard } from "@/features/pipeline/pipeline-board";
import {
    PipelineDoneEmpty,
    PipelineFilteredEmpty,
    PipelineFirstRunEmpty,
} from "@/features/pipeline/pipeline-empty";
import { PipelineBoardSkeleton } from "@/features/pipeline/pipeline-skeleton";
import { PipelineSummaryStrip } from "@/features/pipeline/pipeline-summary-strip";
import { PipelineToolbar } from "@/features/pipeline/pipeline-toolbar";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { type StageMoveRequest, StageNoteModal } from "@/features/pipeline/stage-note-modal";
import { StageTabs } from "@/features/pipeline/stage-tabs";
import {
    DEAL_STAGE_ORDER,
    type DealBoardLayout,
    type DealDetail,
    type DealItem,
    type DealsFilters,
    type DealsSummary,
    type DealStage,
    type DealStatus,
    type DealsView,
    DEFAULT_DEALS_FILTERS,
    isLiveStage,
    type PipelineSummaryChip,
} from "@/features/pipeline/types";
import { useStageSwipe } from "@/features/pipeline/use-stage-swipe";

const DONE_GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 1024, columns: 3 },
];

type PipelinePrefs = {
    filters: DealsFilters;
    view: DealsView;
    boardLayout: DealBoardLayout;
    mobileStage: DealStage;
    pinnedDealIds: string[];
    summaryChip: PipelineSummaryChip;
};

const DEFAULT_PIPELINE_PREFS: PipelinePrefs = {
    filters: DEFAULT_DEALS_FILTERS,
    view: "board",
    boardLayout: "board",
    mobileStage: "new",
    pinnedDealIds: [],
    summaryChip: "running",
};

function isDealStage(value: unknown): value is DealStage {
    return value === "new" || value === "contacted" || value === "visit" || value === "negotiation";
}

function isPipelinePrefs(value: unknown): value is PipelinePrefs {
    if (typeof value !== "object" || value === null) return false;
    const v = value as Partial<PipelinePrefs>;
    const filters = v.filters as DealsFilters | undefined;
    return (
        typeof filters === "object" &&
        filters !== null &&
        typeof filters.q === "string" &&
        (v.view === "board" || v.view === "done") &&
        (v.boardLayout === "board" || v.boardLayout === "list") &&
        isDealStage(v.mobileStage) &&
        Array.isArray(v.pinnedDealIds) &&
        (v.summaryChip === "running" ||
            v.summaryChip === "in_play" ||
            v.summaryChip === "quiet" ||
            v.summaryChip === "finished")
    );
}

function pinSort(pinnedDealIds: string[]) {
    return (a: DealItem, b: DealItem) => {
        const aPin = pinnedDealIds.includes(a.id) ? 0 : 1;
        const bPin = pinnedDealIds.includes(b.id) ? 0 : 1;
        return aPin - bPin;
    };
}

export function PipelinePage() {
    const [prefs, setPrefs] = usePersistedJson<PipelinePrefs>(
        PREF_KEYS.broker.pipeline.prefs,
        DEFAULT_PIPELINE_PREFS,
        { isValid: isPipelinePrefs },
    );
    const { filters, view, boardLayout, mobileStage, pinnedDealIds, summaryChip } = prefs;

    const setFilters = useCallback(
        (next: DealsFilters | ((prev: DealsFilters) => DealsFilters)) => {
            setPrefs((prev) => ({
                ...prev,
                filters: typeof next === "function" ? next(prev.filters) : next,
            }));
        },
        [setPrefs],
    );

    const setMobileStage = useCallback(
        (next: DealStage) => {
            setPrefs((prev) => ({ ...prev, mobileStage: next }));
        },
        [setPrefs],
    );

    const setBoardLayout = useCallback(
        (next: DealBoardLayout) => {
            setPrefs((prev) => ({ ...prev, boardLayout: next }));
        },
        [setPrefs],
    );

    const setSummaryChip = useCallback(
        (next: PipelineSummaryChip) => {
            setPrefs((prev) => ({
                ...prev,
                summaryChip: next,
                view: next === "finished" ? "done" : "board",
                filters: {
                    ...prev.filters,
                    sort: next === "in_play" ? "price_desc" : prev.filters.sort,
                },
            }));
        },
        [setPrefs],
    );

    const [deals, setDeals] = useState<DealItem[] | null>(null);
    const [summary, setSummary] = useState<DealsSummary | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);

    const [moveRequest, setMoveRequest] = useState<StageMoveRequest | null>(null);
    const [isSavingMove, setIsSavingMove] = useState(false);
    const [offerDealId, setOfferDealId] = useState<string | null>(null);
    const [isSavingOffer, setIsSavingOffer] = useState(false);
    const [viewDealId, setViewDealId] = useState<string | null>(null);
    const [viewDetail, setViewDetail] = useState<DealDetail | null>(null);
    const [isLoadingView, setIsLoadingView] = useState(false);
    const [viewError, setViewError] = useState<string | null>(null);
    const [noteDealId, setNoteDealId] = useState<string | null>(null);
    const [isSavingNote, setIsSavingNote] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const timer = window.setTimeout(() => {
            if (cancelled) return;

            setIsFetching(true);
            setError(null);

            void pipelineApi
                .list({
                    q: filters.q,
                    stage: filters.stage,
                    sort: filters.sort,
                    dealType: "",
                    locality: "",
                    ownerName: "",
                })
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
    }, [filters.q, filters.sort, filters.stage, revision]);

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
            .catch((loadError) => {
                setViewError(
                    loadError instanceof Error ? loadError.message : "Could not load lead details.",
                );
            })
            .finally(() => setIsLoadingView(false));
    }, []);

    const applyLocalStage = useCallback((dealId: string, status: DealStatus) => {
        setDeals((prev) =>
            (prev ?? []).map((deal) =>
                deal.id === dealId
                    ? {
                          ...deal,
                          status,
                          stageEnteredAt: new Date().toISOString(),
                          resolvedAt:
                              status === "closed" || status === "lost"
                                  ? new Date().toISOString()
                                  : null,
                      }
                    : deal,
            ),
        );
    }, []);

    const moveOptimistically = useCallback(
        (dealId: string, status: DealStage) => {
            const current = (deals ?? []).find((deal) => deal.id === dealId);
            if (!current || current.status === status) return;

            const previous = current.status;
            applyLocalStage(dealId, status);

            void pipelineApi
                .setStage(dealId, status)
                .then(() => {
                    toast(
                        (t) => (
                            <span className="flex items-center gap-3">
                                <span>Moved to {DEAL_STAGE_META[status].label.toLowerCase()}</span>
                                <button
                                    type="button"
                                    className="font-semibold text-brand underline"
                                    onClick={() => {
                                        applyLocalStage(dealId, previous);
                                        void pipelineApi.setStage(dealId, previous).catch(() => {
                                            toast.error("Could not undo that. Try again.");
                                        });
                                        toast.dismiss(t.id);
                                    }}
                                >
                                    Undo
                                </button>
                            </span>
                        ),
                        { duration: 5_000 },
                    );
                    setRevision((prev) => prev + 1);
                })
                .catch((moveError) => {
                    applyLocalStage(dealId, previous);
                    toast.error(
                        moveError instanceof Error
                            ? moveError.message
                            : "Could not save that. Try again.",
                    );
                });
        },
        [applyLocalStage, deals],
    );

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
            } catch (moveError) {
                toast.error(
                    moveError instanceof Error
                        ? moveError.message
                        : "Could not save that. Try again.",
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
            } catch (offerError) {
                toast.error(
                    offerError instanceof Error
                        ? offerError.message
                        : "Could not submit offer. Try again.",
                );
            } finally {
                setIsSavingOffer(false);
                setBusyId(null);
            }
        },
        [offerDealId],
    );

    const handleConfirmNote = useCallback(
        async (note: string) => {
            if (!noteDealId) return;
            const current = (deals ?? []).find((deal) => deal.id === noteDealId);
            if (!current) return;

            setIsSavingNote(true);
            setBusyId(noteDealId);
            try {
                await pipelineApi.setNote(noteDealId, current.status, note);
                setNoteDealId(null);
                setRevision((prev) => prev + 1);
                toast.success("Note saved");
            } catch (noteError) {
                toast.error(
                    noteError instanceof Error
                        ? noteError.message
                        : "Could not save that. Try again.",
                );
            } finally {
                setIsSavingNote(false);
                setBusyId(null);
            }
        },
        [deals, noteDealId],
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
                    .catch((logError) => {
                        toast.error(
                            logError instanceof Error
                                ? logError.message
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
            onPin: (dealId) => {
                setPrefs((prev) => ({
                    ...prev,
                    pinnedDealIds: prev.pinnedDealIds.includes(dealId)
                        ? prev.pinnedDealIds.filter((id) => id !== dealId)
                        : [...prev.pinnedDealIds, dealId],
                }));
            },
            onNote: (dealId) => {
                setNoteDealId(dealId);
            },
        }),
        [openLeadView, requestMove, setPrefs],
    );

    const handlePatch = useCallback(
        (patch: Partial<DealsFilters>) => {
            setFilters((prev) => ({ ...prev, ...patch }));
        },
        [setFilters],
    );

    const handleClearSearch = useCallback(() => {
        setFilters((prev) => ({
            ...prev,
            q: "",
            dealType: "",
            locality: "",
            ownerName: "",
        }));
        setPrefs((prev) => ({ ...prev, summaryChip: "running", view: "board" }));
    }, [setFilters, setPrefs]);

    const filteredDeals = useMemo(() => {
        const all = deals ?? [];
        return all.filter((deal) => matchesClientFilters(deal, filters));
    }, [deals, filters]);

    const liveDeals = useMemo(() => {
        const live = filteredDeals.filter((deal) => isLiveStage(deal.status));
        const scoped = summaryChip === "quiet" ? live.filter(isQuietDeal) : live;
        return [...scoped].sort(pinSort(pinnedDealIds));
    }, [filteredDeals, pinnedDealIds, summaryChip]);

    const doneDeals = useMemo(
        () => filteredDeals.filter((deal) => !isLiveStage(deal.status)),
        [filteredDeals],
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

    const otherBuyersByDealId = useMemo(() => {
        const map: Record<string, OtherBuyer[]> = {};
        for (const deal of deals ?? []) {
            map[deal.id] = otherBuyersOnProperty(deal, deals ?? []);
        }
        return map;
    }, [deals]);

    const localities = useMemo(() => uniqueLocalities(deals ?? []), [deals]);
    const owners = useMemo(() => uniqueOwners(deals ?? []), [deals]);

    const moveDeal =
        moveRequest != null
            ? ((deals ?? []).find((deal) => deal.id === moveRequest.dealId) ?? null)
            : null;

    const offerDeal =
        offerDealId != null
            ? ((deals ?? []).find((deal) => deal.id === offerDealId) ?? null)
            : null;

    const noteDeal =
        noteDealId != null ? ((deals ?? []).find((deal) => deal.id === noteDealId) ?? null) : null;

    const swipe = useStageSwipe(mobileStage, setMobileStage);

    const isFirstLoad = deals === null;
    const hasSearch =
        filters.q.trim().length > 0 ||
        filters.dealType !== "" ||
        filters.locality !== "" ||
        filters.ownerName !== "" ||
        summaryChip === "quiet";
    const isFirstRun =
        !hasSearch &&
        summary != null &&
        summary.liveTotal + summary.closedCount + summary.lostCount === 0;

    function renderDealCard(deal: DealItem) {
        return (
            <DealCard
                deal={deal}
                handlers={handlers}
                isBusy={busyId === deal.id}
                isPinned={pinnedDealIds.includes(deal.id)}
                otherBuyers={otherBuyersByDealId[deal.id] ?? []}
            />
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {summary && !isFirstRun ? (
                <PipelineSummaryStrip
                    summary={summary}
                    active={summaryChip}
                    onChange={setSummaryChip}
                />
            ) : null}

            {!isFirstRun ? (
                <PipelineToolbar
                    filters={filters}
                    boardLayout={boardLayout}
                    localities={localities}
                    owners={owners}
                    onPatch={handlePatch}
                    onBoardLayoutChange={setBoardLayout}
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
                    <div
                        className={
                            isFetching ? "opacity-60 transition-opacity duration-160" : undefined
                        }
                    >
                        <WindowVirtualGrid
                            items={doneDeals}
                            getKey={(deal) => deal.id}
                            estimateRowHeight={470}
                            gap={12}
                            breakpoints={DONE_GRID_BREAKPOINTS}
                            ariaLabel="Completed and lost deals"
                            renderItem={renderDealCard}
                        />
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
                    {boardLayout === "list" ? (
                        // List view gives one deal a whole row, so it leads with
                        // the photo and shows the full detail set. The board
                        // keeps the compact card — see DealCardRich.
                        <div className="hidden flex-col gap-4 md:flex lg:grid lg:grid-cols-2">
                            {liveDeals.map((deal) => (
                                <DealCardRich
                                    key={deal.id}
                                    deal={deal}
                                    handlers={handlers}
                                    isBusy={busyId === deal.id}
                                    otherBuyers={otherBuyersByDealId[deal.id] ?? []}
                                    photoCount={deal.property.photoCount}
                                />
                            ))}
                        </div>
                    ) : (
                        <PipelineBoard
                            dealsByStage={dealsByStage}
                            allLiveDeals={liveDeals}
                            handlers={handlers}
                            busyId={busyId}
                            pinnedDealIds={pinnedDealIds}
                            otherBuyersByDealId={otherBuyersByDealId}
                            onDropDeal={moveOptimistically}
                        />
                    )}

                    <div className="flex flex-col gap-4 md:hidden" {...swipe}>
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
                            <WindowVirtualGrid
                                items={dealsByStage[mobileStage]}
                                getKey={(deal) => deal.id}
                                estimateRowHeight={470}
                                gap={12}
                                ariaLabel={`${DEAL_STAGE_META[mobileStage].label} deals`}
                                renderItem={renderDealCard}
                            />
                        ) : (
                            <p
                                className="
                                  body-sm rounded-card border border-dashed border-border-warm px-4
                                  py-10 text-center text-ink-muted
                                "
                            >
                                No deals here yet.
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

            <DealNoteModal
                open={noteDealId != null}
                deal={noteDeal}
                isSaving={isSavingNote}
                onConfirm={(note) => {
                    void handleConfirmNote(note);
                }}
                onCancel={() => {
                    if (!isSavingNote) setNoteDealId(null);
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
