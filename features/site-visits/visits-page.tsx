"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { visitsApi } from "@/lib/api/visits";

import {
    DEFAULT_VISITS_FILTERS,
    type VisitCancelReason,
    type VisitItem,
    type VisitOutcome,
    type VisitsFilters,
    type VisitsSummary,
    type VisitsView,
    type VisitViewer,
} from "@/features/site-visits/types";
import { VisitCalendar } from "@/features/site-visits/visit-calendar";
import { VisitCard, type VisitCardHandlers } from "@/features/site-visits/visit-card";
import { VisitDetailModal } from "@/features/site-visits/visit-detail-modal";
import { VisitCancelModal, VisitOutcomeModal } from "@/features/site-visits/visit-outcome-modal";
import type { VisitAction } from "@/features/site-visits/visit-permissions";
import { VisitRescheduleModal } from "@/features/site-visits/visit-reschedule-modal";
import {
    VisitsAllClearEmpty,
    VisitsFilteredEmpty,
    VisitsFirstRunEmpty,
} from "@/features/site-visits/visits-empty";
import { VisitsHeader } from "@/features/site-visits/visits-header";
import { VisitsIntro } from "@/features/site-visits/visits-intro";
import { VisitsCalendarSkeleton, VisitsListSkeleton } from "@/features/site-visits/visits-skeleton";

/** Which modal is open. One at a time — they are all decisions about one visit. */
type ModalState =
    | { kind: "none" }
    | { kind: "detail"; visitId: string }
    | { kind: "reschedule"; visitId: string }
    | { kind: "outcome"; visitId: string }
    | { kind: "cancel"; visitId: string; intent: "cancel" | "decline" | "withdraw" };

type VisitsPageProps = {
    viewer: VisitViewer;
};

export function VisitsPage({ viewer }: VisitsPageProps) {
    const [filters, setFilters] = useState<VisitsFilters>(DEFAULT_VISITS_FILTERS);
    const [view, setView] = useState<VisitsView>("calendar");
    // Date navigation and the view switcher live inside the calendar itself,
    // so this page holds no anchor date of its own.

    const [visits, setVisits] = useState<VisitItem[] | null>(null);
    const [summary, setSummary] = useState<VisitsSummary | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [modal, setModal] = useState<ModalState>({ kind: "none" });
    /** Bumped after a mutation so the list and summary both refetch. */
    const [revision, setRevision] = useState(0);

    /**
     * One clock for the whole screen, ticking each minute.
     *
     * Every relative label ("in 2h 14m", the now-line, whether a visit has
     * ended) derives from this. Calling `new Date()` per component would let
     * two parts of the same screen disagree about what time it is, and would
     * make the now-line freeze until an unrelated re-render.
     */
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 60_000);
        return () => window.clearInterval(timer);
    }, []);

    /**
     * The calendar needs every visit regardless of the status filter — an
     * hour that looks free but holds a filtered-out visit is a double booking
     * waiting to happen. The list respects the filter; the grid does not.
     */
    const listFilters = useMemo(
        () => (view === "calendar" ? { ...filters, status: "all" as const } : filters),
        [filters, view],
    );

    useEffect(() => {
        let cancelled = false;

        const timer = window.setTimeout(() => {
            if (cancelled) return;

            setIsFetching(true);
            setError(null);

            void visitsApi
                .list(listFilters, viewer)
                .then((next) => {
                    if (cancelled) return;
                    setVisits(next.items);
                    setSummary(next.summary);
                })
                .catch(() => {
                    if (!cancelled) {
                        setError(
                            "Could not load your visits. Check your connection and try again.",
                        );
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
    }, [listFilters, revision, viewer]);

    const activeVisit = useMemo(() => {
        if (modal.kind === "none") return null;
        return visits?.find((visit) => visit.id === modal.visitId) ?? null;
    }, [modal, visits]);

    const runMutation = useCallback(
        async (visitId: string, action: () => Promise<void>, message?: string) => {
            setBusyId(visitId);
            try {
                await action();
                setRevision((prev) => prev + 1);
                setModal({ kind: "none" });
                if (message) toast.success(message);
            } catch {
                toast.error("Could not save that. Try again.");
            } finally {
                setBusyId(null);
            }
        },
        [],
    );

    /**
     * Routes an action to either a mutation or the modal that collects what
     * the mutation needs. Anything with a consequence the user should see
     * first — a cancellation, a new time, a verdict — goes through a modal.
     */
    const handleAction = useCallback(
        (visitId: string, action: VisitAction) => {
            switch (action) {
                case "confirm":
                    void runMutation(
                        visitId,
                        () => visitsApi.confirm(visitId, viewer),
                        "Visit confirmed",
                    );
                    return;
                case "complete":
                    setModal({ kind: "outcome", visitId });
                    return;
                case "record_outcome":
                    setModal({ kind: "outcome", visitId });
                    return;
                case "reschedule":
                    setModal({ kind: "reschedule", visitId });
                    return;
                case "cancel":
                    setModal({ kind: "cancel", visitId, intent: "cancel" });
                    return;
                case "decline":
                    setModal({ kind: "cancel", visitId, intent: "decline" });
                    return;
                case "withdraw":
                    setModal({ kind: "cancel", visitId, intent: "withdraw" });
                    return;
                case "mark_no_show":
                    void runMutation(
                        visitId,
                        () => visitsApi.markNoShow(visitId, viewer),
                        "Marked as nobody turned up",
                    );
                    return;
            }
        },
        [runMutation, viewer],
    );

    const handlers = useMemo<VisitCardHandlers>(
        () => ({
            onAction: handleAction,
            onOpen: (visitId) => setModal({ kind: "detail", visitId }),
        }),
        [handleAction],
    );

    const handlePatch = useCallback((patch: Partial<VisitsFilters>) => {
        setFilters((prev) => ({ ...prev, ...patch }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters(DEFAULT_VISITS_FILTERS);
    }, []);

    /**
     * A chip was dragged to a new slot. The calendar has already refused any
     * drop that would double-book (`canDropEvent`), so what reaches here is a
     * time the broker can actually keep — it still goes back through
     * `proposed` for the other side to agree to.
     */
    const handleDragReschedule = useCallback(
        (visitId: string, start: Date, durationMin: number) => {
            void runMutation(
                visitId,
                () =>
                    visitsApi.reschedule(visitId, viewer, {
                        scheduledAt: start.toISOString(),
                        durationMin,
                    }),
                "New time suggested",
            );
        },
        [runMutation, viewer],
    );

    const handleSubmitOutcome = useCallback(
        (visitId: string, outcome: VisitOutcome) => {
            const visit = visits?.find((item) => item.id === visitId);
            // An already-completed visit only needs its verdict; one that just
            // happened needs both the status and the verdict in one step.
            const action =
                visit?.status === "completed"
                    ? () => visitsApi.recordOutcome(visitId, outcome)
                    : () => visitsApi.complete(visitId, outcome);
            void runMutation(visitId, action, "Saved");
        },
        [runMutation, visits],
    );

    const handleSubmitCancel = useCallback(
        (visitId: string, reason: VisitCancelReason) => {
            if (modal.kind !== "cancel") return;

            const { intent } = modal;
            const action =
                intent === "decline"
                    ? () => visitsApi.decline(visitId, viewer, reason)
                    : intent === "withdraw"
                      ? () => visitsApi.withdraw(visitId, viewer)
                      : () => visitsApi.cancel(visitId, viewer, reason);

            void runMutation(
                visitId,
                action,
                intent === "withdraw" ? "Request withdrawn" : "The other side has been told",
            );
        },
        [modal, runMutation, viewer],
    );

    const isFirstLoad = visits === null;
    const hasFilters =
        filters.q.trim().length > 0 ||
        filters.status !== DEFAULT_VISITS_FILTERS.status ||
        filters.propertyId !== "";
    /** True first-run: nothing at all, and no filter hid it. */
    const isFirstRun =
        !hasFilters &&
        summary != null &&
        summary.upcomingCount + summary.completedCount + summary.cancelledCount === 0;

    return (
        <div className="flex flex-col gap-6">
            <VisitsIntro summary={summary} viewer={viewer} isLoading={isFetching} />

            {!isFirstRun ? (
                <VisitsHeader
                    filters={filters}
                    summary={summary}
                    view={view}
                    viewer={viewer}
                    onPatch={handlePatch}
                    onViewChange={setView}
                />
            ) : null}

            {error ? (
                <p role="alert" className="body-sm text-urgent">
                    {error}
                </p>
            ) : null}

            {isFirstLoad && isFetching ? (
                view === "calendar" ? (
                    <VisitsCalendarSkeleton />
                ) : (
                    <VisitsListSkeleton />
                )
            ) : isFirstRun ? (
                <VisitsFirstRunEmpty viewer={viewer} canSchedule={viewer === "broker"} />
            ) : (
                // Filter changes dim the content rather than wiping it.
                // docs/LOADING.md rule 3.
                <div
                    className={
                        isFetching ? "opacity-60 transition-opacity duration-160" : undefined
                    }
                >
                    {view === "calendar" ? (
                        // A month grid does not survive 360px, so the phone
                        // opens on the agenda instead. Both mount the same
                        // calendar — the user can still switch to any view.
                        <>
                            <VisitCalendar
                                visits={visits ?? []}
                                viewer={viewer}
                                defaultView="agenda"
                                now={now}
                                onOpenVisit={(visitId) => setModal({ kind: "detail", visitId })}
                                onReschedule={handleDragReschedule}
                                className="lg:hidden"
                            />
                            <VisitCalendar
                                visits={visits ?? []}
                                viewer={viewer}
                                defaultView="month"
                                now={now}
                                onOpenVisit={(visitId) => setModal({ kind: "detail", visitId })}
                                onReschedule={handleDragReschedule}
                                className="hidden lg:block"
                            />
                        </>
                    ) : (visits ?? []).length === 0 ? (
                        hasFilters ? (
                            filters.status === "needs_action" ? (
                                <VisitsAllClearEmpty viewer={viewer} />
                            ) : (
                                <VisitsFilteredEmpty onClear={handleClearFilters} />
                            )
                        ) : (
                            <VisitsAllClearEmpty viewer={viewer} />
                        )
                    ) : (
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            {(visits ?? []).map((visit) => (
                                <VisitCard
                                    key={visit.id}
                                    visit={visit}
                                    viewer={viewer}
                                    handlers={handlers}
                                    isBusy={busyId === visit.id}
                                    now={now}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <VisitDetailModal
                visit={activeVisit}
                viewer={viewer}
                open={modal.kind === "detail"}
                now={now}
                isBusy={busyId != null}
                onOpenChange={(open) => !open && setModal({ kind: "none" })}
                onAction={handleAction}
                onAcceptAlternative={(visitId, slotIso) => {
                    void runMutation(
                        visitId,
                        () => visitsApi.acceptAlternative(visitId, viewer, slotIso),
                        "Visit confirmed",
                    );
                }}
            />

            <VisitRescheduleModal
                visit={activeVisit}
                viewer={viewer}
                allVisits={visits ?? []}
                open={modal.kind === "reschedule"}
                now={now}
                isBusy={busyId != null}
                onOpenChange={(open) => !open && setModal({ kind: "none" })}
                onConfirm={(visitId, scheduledAt, durationMin) => {
                    void runMutation(
                        visitId,
                        () => visitsApi.reschedule(visitId, viewer, { scheduledAt, durationMin }),
                        "New time suggested",
                    );
                }}
            />

            <VisitOutcomeModal
                visit={activeVisit}
                open={modal.kind === "outcome"}
                isBusy={busyId != null}
                onOpenChange={(open) => !open && setModal({ kind: "none" })}
                onSubmit={handleSubmitOutcome}
            />

            <VisitCancelModal
                visit={activeVisit}
                open={modal.kind === "cancel"}
                intent={modal.kind === "cancel" ? modal.intent : "cancel"}
                isBusy={busyId != null}
                onOpenChange={(open) => !open && setModal({ kind: "none" })}
                onSubmit={handleSubmitCancel}
            />
        </div>
    );
}
