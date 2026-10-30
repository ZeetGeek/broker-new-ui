"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { pipelineApi } from "@/lib/api/pipeline";
import { usePathname, useRouter, useSearchParams } from "@/lib/navigation";
import { PREF_KEYS } from "@/lib/prefs/keys";
import { EMPTY_PROPERTY_CRITERIA, propertyCriteriaCount } from "@/lib/properties/list-criteria";
import { pipelineStageFromQuery } from "@/lib/properties/pipeline-stage-query";
import { StageOperationGate } from "@/lib/properties/stage-operation-gate";
import { usePersistedJson } from "@/hooks/use-persisted-json";

import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import { matchesClientFilters } from "@/features/pipeline/deal-attention";
import { DealCard, type DealCardHandlers } from "@/features/pipeline/deal-card";
import { DealDetailModal } from "@/features/pipeline/deal-detail-modal";
import { DealNoteModal } from "@/features/pipeline/deal-note-modal";
import { MakeOfferModal } from "@/features/pipeline/make-offer-modal";
import { PipelineBoard } from "@/features/pipeline/pipeline-board";
import {
    PipelineDoneEmpty,
    PipelineFilteredEmpty,
    PipelineFirstRunEmpty,
    PipelineOutcomeEmpty,
} from "@/features/pipeline/pipeline-empty";
import { PipelineOutcomeTabs } from "@/features/pipeline/pipeline-outcome-tabs";
import { PipelineBoardSkeleton } from "@/features/pipeline/pipeline-skeleton";
import { PipelineToolbar } from "@/features/pipeline/pipeline-toolbar";
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
import { useStageSwipe } from "@/features/pipeline/use-stage-swipe";
const PIPELINE_BATCH_SIZE = 6;

const DONE_GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 1024, columns: 3 },
    { minWidth: 1280, columns: 4 },
];

type PipelinePrefs = {
    filters: DealsFilters;
    view: DealsView;
    mobileStage: DealStage;
    pinnedDealIds: string[];
};

const DEFAULT_PIPELINE_PREFS: PipelinePrefs = {
    filters: DEFAULT_DEALS_FILTERS,
    view: "board",
    mobileStage: "new",
    pinnedDealIds: [],
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
        (v.view === "board" || v.view === "sold" || v.view === "lost" || v.view === "done") &&
        isDealStage(v.mobileStage) &&
        Array.isArray(v.pinnedDealIds)
    );
}

function pinSort(pinnedDealIds: string[]) {
    return (a: DealItem, b: DealItem) => {
        const aPin = pinnedDealIds.includes(a.id) ? 0 : 1;
        const bPin = pinnedDealIds.includes(b.id) ? 0 : 1;
        return aPin - bPin;
    };
}

export function PipelinePage({ initialLeadId }: { initialLeadId?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const urlStage = pipelineStageFromQuery(searchParams.get("stage"));
    const [prefs, setPrefs] = usePersistedJson<PipelinePrefs>(
        PREF_KEYS.broker.pipeline.prefs,
        DEFAULT_PIPELINE_PREFS,
        { isValid: isPipelinePrefs },
    );
    const filters = useMemo(
        () => (urlStage ? { ...prefs.filters, stage: urlStage } : prefs.filters),
        [prefs.filters, urlStage],
    );
    // "done" is the old combined Finished tab, still in some saved prefs.
    const view: DealsView = urlStage || (prefs.view as string) === "done" ? "board" : prefs.view;
    const mobileStage = urlStage ?? prefs.mobileStage;
    const { pinnedDealIds } = prefs;
    const [stageLimits, setStageLimits] = useState<Record<DealStage, number>>({
        new: PIPELINE_BATCH_SIZE,
        contacted: PIPELINE_BATCH_SIZE,
        visit: PIPELINE_BATCH_SIZE,
        negotiation: PIPELINE_BATCH_SIZE,
    });
    const loadMoreStage = useCallback((stage: DealStage) => {
        setStageLimits((limits) => ({ ...limits, [stage]: limits[stage] + PIPELINE_BATCH_SIZE }));
    }, []);

    useEffect(() => {
        if (!urlStage) return;
        const timer = window.setTimeout(
            () =>
                setPrefs((previous) => ({
                    ...previous,
                    filters: { ...DEFAULT_DEALS_FILTERS, stage: urlStage },
                    view: "board",
                    mobileStage: urlStage,
                })),
            0,
        );
        return () => window.clearTimeout(timer);
    }, [urlStage, setPrefs]);

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
            setPrefs((prev) => ({
                ...prev,
                mobileStage: next,
                filters:
                    urlStage || filters.stage ? { ...prev.filters, stage: next } : prev.filters,
            }));
            if (urlStage) {
                const query = new URLSearchParams(searchParams.toString());
                query.set("stage", next === "visit" ? "site_visit" : next);
                router.replace(`${pathname}?${query}`);
            }
        },
        [setPrefs, urlStage, filters.stage, searchParams, router, pathname],
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
    const [stageGate] = useState(() => new StageOperationGate());
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        const timer = window.setTimeout(() => {
            if (cancelled) return;

            setIsFetching(true);
            setError(null);
            const requestRevision = stageGate.revision;

            void pipelineApi
                .list(
                    {
                        q: filters.q,
                        stage: filters.stage,
                        sort: filters.sort,
                        dealType: "",
                        locality: "",
                        ownerName: "",
                    },
                    controller.signal,
                )
                .then((next) => {
                    if (cancelled || stageGate.revision !== requestRevision) return;
                    setDeals(next.items);
                    setSummary(next.summary);
                })
                .catch(() => {
                    if (!cancelled && stageGate.revision === requestRevision) {
                        setError("Could not load your deals. Check your connection and try again.");
                    }
                })
                .finally(() => {
                    if (!cancelled && stageGate.revision === requestRevision) setIsFetching(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [filters.q, filters.sort, filters.stage, revision, stageGate]);

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

    useEffect(() => {
        if (!initialLeadId) return;
        const timer = window.setTimeout(() => openLeadView(initialLeadId), 0);
        return () => window.clearTimeout(timer);
    }, [initialLeadId, openLeadView]);

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
            const version = stageGate.begin(dealId);
            if (version == null) return;
            setBusyId(dealId);

            const previous = current.status;
            applyLocalStage(dealId, status);

            void pipelineApi
                .setStage(dealId, status)
                .then(() => {
                    if (!mounted.current) return;
                    toast(
                        (t) => (
                            <span className="flex items-center gap-3">
                                <span>Moved to {DEAL_STAGE_META[status].label.toLowerCase()}</span>
                                <button
                                    type="button"
                                    className="font-semibold text-brand underline"
                                    onClick={() => {
                                        if (!mounted.current) {
                                            toast.dismiss(t.id);
                                            return;
                                        }
                                        if (stageGate.begin(dealId, version) == null) {
                                            toast.error(
                                                "This deal changed or is still saving. Check its current stage.",
                                            );
                                            return;
                                        }
                                        setBusyId(dealId);
                                        // Keep the confirmed stage visible until Undo actually saves.
                                        void pipelineApi
                                            .setStage(dealId, previous)
                                            .then(() => {
                                                if (mounted.current)
                                                    applyLocalStage(dealId, previous);
                                            })
                                            .catch(() => {
                                                if (mounted.current)
                                                    toast.error(
                                                        "Could not undo. Reloading the saved stage.",
                                                    );
                                            })
                                            .finally(() => {
                                                stageGate.end();
                                                if (mounted.current) {
                                                    setBusyId(null);
                                                    setRevision((value) => value + 1);
                                                }
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
                })
                .catch((moveError) => {
                    if (!mounted.current) return;
                    setDeals(
                        (items) =>
                            items?.map((item) => (item.id === dealId ? current : item)) ?? null,
                    );
                    toast.error(
                        moveError instanceof Error
                            ? moveError.message
                            : "Could not save that. Try again.",
                    );
                })
                .finally(() => {
                    stageGate.end();
                    if (mounted.current) {
                        setBusyId(null);
                        setRevision((value) => value + 1);
                    }
                });
        },
        [applyLocalStage, deals, stageGate],
    );

    const handleConfirmMove = useCallback(
        async (note: string) => {
            if (!moveRequest) return;
            if (stageGate.begin(moveRequest.dealId) == null) return;

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
                stageGate.end();
                setIsSavingMove(false);
                setBusyId(null);
                setRevision((value) => value + 1);
            }
        },
        [moveRequest, stageGate],
    );

    const handleConfirmOffer = useCallback(
        async (offerAmount: number, notes: string) => {
            if (!offerDealId) return;
            if (stageGate.begin(offerDealId) == null) return;

            setIsSavingOffer(true);
            setBusyId(offerDealId);
            try {
                await pipelineApi.makeOffer(offerDealId, offerAmount, notes);
                setOfferDealId(null);
                setRevision((prev) => prev + 1);
                toast.success("Offer saved");
            } catch (offerError) {
                toast.error(
                    offerError instanceof Error
                        ? offerError.message
                        : "Could not submit offer. Try again.",
                );
            } finally {
                stageGate.end();
                setIsSavingOffer(false);
                setBusyId(null);
                setRevision((value) => value + 1);
            }
        },
        [offerDealId, stageGate],
    );

    const handleConfirmNote = useCallback(
        async (note: string) => {
            if (!noteDealId) return;
            const current = (deals ?? []).find((deal) => deal.id === noteDealId);
            if (!current) return;
            if (stageGate.begin(noteDealId) == null) return;

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
                stageGate.end();
                setIsSavingNote(false);
                setBusyId(null);
                setRevision((value) => value + 1);
            }
        },
        [deals, noteDealId, stageGate],
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
                if (stageGate.begin(dealId) == null) return;
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
                    .finally(() => {
                        stageGate.end();
                        setBusyId(null);
                        setRevision((value) => value + 1);
                    });
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
        [openLeadView, requestMove, setPrefs, stageGate],
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
            stage: "",
            propertyFilters: { ...EMPTY_PROPERTY_CRITERIA },
        }));
        setPrefs((prev) => ({ ...prev, view: "board" }));
        if (searchParams.has("stage")) {
            const query = new URLSearchParams(searchParams.toString());
            query.delete("stage");
            router.replace(`${pathname}${query.size ? `?${query}` : ""}`);
        }
    }, [setFilters, setPrefs, searchParams, router, pathname]);

    const filteredDeals = useMemo(() => {
        const all = deals ?? [];
        return all.filter((deal) => matchesClientFilters(deal, filters));
    }, [deals, filters]);

    const liveDeals = useMemo(() => {
        const live = filteredDeals.filter((deal) => isLiveStage(deal.status));
        return [...live].sort(pinSort(pinnedDealIds));
    }, [filteredDeals, pinnedDealIds]);

    const outcomeDeals = useMemo(() => {
        if (view === "board") return [];
        const status = view === "sold" ? "closed" : "lost";
        return filteredDeals.filter((deal) => deal.status === status).sort(pinSort(pinnedDealIds));
    }, [filteredDeals, view, pinnedDealIds]);

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

    const noteDeal =
        noteDealId != null ? ((deals ?? []).find((deal) => deal.id === noteDealId) ?? null) : null;

    const swipe = useStageSwipe(mobileStage, setMobileStage);

    const isFirstLoad = deals === null;
    const hasSearch =
        filters.q.trim().length > 0 ||
        filters.stage !== "" ||
        filters.dealType !== "" ||
        filters.locality !== "" ||
        propertyCriteriaCount(filters.propertyFilters) > 0;
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
            />
        );
    }

    return (
        <Tabs
            value={view}
            className="gap-5"
            onValueChange={(value) => {
                if (value !== "board" && value !== "sold" && value !== "lost") return;
                const active = value !== "board";
                if (active && searchParams.has("stage")) {
                    const query = new URLSearchParams(searchParams.toString());
                    query.delete("stage");
                    router.replace(`${pathname}${query.size ? `?${query}` : ""}`);
                }
                setPrefs((prev) => ({
                    ...prev,
                    view: value,
                    filters: active ? { ...prev.filters, stage: "" } : prev.filters,
                }));
            }}
        >
            {filters.stage ? (
                <div className="body-sm flex flex-wrap items-center gap-3 text-ink-muted">
                    <span>Showing {DEAL_STAGE_META[filters.stage].label} deals</span>
                    <button
                        type="button"
                        onClick={handleClearSearch}
                        className="font-medium text-brand underline"
                    >
                        Show all stages
                    </button>
                </div>
            ) : null}
            <PipelineToolbar
                filters={filters}
                onPatch={handlePatch}
                leading={
                    <div className="max-inline-full min-inline-0">
                        <PipelineOutcomeTabs
                            view={view}
                            counts={{
                                board: summary?.liveTotal ?? null,
                                sold: summary?.closedCount ?? null,
                                lost: summary?.lostCount ?? null,
                            }}
                        />
                    </div>
                }
            />

            {error ? (
                <p role="alert" className="body-sm text-urgent">
                    {error}
                </p>
            ) : null}

            <TabsContent key={view} value={view}>
                {isFirstLoad && isFetching ? (
                    <PipelineBoardSkeleton />
                ) : isFirstRun && view === "board" ? (
                    <PipelineFirstRunEmpty />
                ) : view !== "board" ? (
                    outcomeDeals.length === 0 ? (
                        hasSearch ? (
                            <PipelineFilteredEmpty onClear={handleClearSearch} />
                        ) : (
                            <PipelineOutcomeEmpty outcome={view} />
                        )
                    ) : (
                        <div
                            className={
                                isFetching
                                    ? "opacity-60 transition-opacity duration-160"
                                    : undefined
                            }
                        >
                            <WindowVirtualGrid
                                items={outcomeDeals}
                                getKey={(deal) => deal.id}
                                estimateRowHeight={360}
                                gridClassName="grid grid-cols-1 inline-full sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                gap={24}
                                breakpoints={DONE_GRID_BREAKPOINTS}
                                ariaLabel={view === "sold" ? "Finished deals" : "Lost deals"}
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
                        <PipelineBoard
                            dealsByStage={dealsByStage}
                            allLiveDeals={liveDeals}
                            handlers={handlers}
                            busyId={busyId}
                            pinnedDealIds={pinnedDealIds}
                            onDropDeal={moveOptimistically}
                            stageLimits={stageLimits}
                            onLoadMore={loadMoreStage}
                        />

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
                                <>
                                    <WindowVirtualGrid
                                        items={dealsByStage[mobileStage].slice(
                                            0,
                                            stageLimits[mobileStage],
                                        )}
                                        getKey={(deal) => deal.id}
                                        estimateRowHeight={470}
                                        gap={12}
                                        ariaLabel={`${DEAL_STAGE_META[mobileStage].label} deals`}
                                        renderItem={renderDealCard}
                                    />
                                    {dealsByStage[mobileStage].length > stageLimits[mobileStage] ? (
                                        <Button
                                            variant="outline"
                                            size="md"
                                            className="shadow-md hover:shadow-lg"
                                            onClick={() => loadMoreStage(mobileStage)}
                                            aria-label={`Load more ${DEAL_STAGE_META[mobileStage].label.toLowerCase()} deals`}
                                        >
                                            Load more deals
                                            <span className="body-xs rounded-full bg-ink/5 px-1.5 font-semibold text-ink-muted tabular-nums min-inline-5">
                                                {dealsByStage[mobileStage].length -
                                                    stageLimits[mobileStage]}
                                            </span>
                                        </Button>
                                    ) : null}
                                </>
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
            </TabsContent>

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
                    if (initialLeadId) router.replace("/broker/pipeline");
                }}
            />
        </Tabs>
    );
}
