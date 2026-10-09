"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { visitsApi } from "@/lib/api/visits";
import { formatDateIso } from "@/lib/format/date";
import { PREF_KEYS } from "@/lib/prefs/keys";
import { usePersistedJson } from "@/hooks/use-persisted-json";

import {
    DEFAULT_VISITS_FILTERS,
    type VisitCancelReason,
    type VisitItem,
    type VisitOutcome,
    type VisitsFilters,
    type VisitsSummary,
    type VisitViewer,
} from "@/features/site-visits/types";
import { VisitDetailModal } from "@/features/site-visits/visit-detail-modal";
import { VisitCancelModal, VisitOutcomeModal } from "@/features/site-visits/visit-outcome-modal";
import type { VisitAction } from "@/features/site-visits/visit-permissions";
import { VisitRescheduleModal } from "@/features/site-visits/visit-reschedule-modal";
import type { VisitRowHandlers } from "@/features/site-visits/visit-row";
import { VisitsDateRange } from "@/features/site-visits/visits-date-range";
import {
    VisitsAllClearEmpty,
    VisitsFilteredEmpty,
    VisitsFirstRunEmpty,
} from "@/features/site-visits/visits-empty";
import { VisitsHeader } from "@/features/site-visits/visits-header";
import { VisitsIntro } from "@/features/site-visits/visits-intro";
import { VisitsList } from "@/features/site-visits/visits-list";
import { VisitsListSkeleton } from "@/features/site-visits/visits-skeleton";

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

/** Persisted listing prefs — dates always remount to today. */
type VisitsListPrefs = {
    q: string;
    status: VisitsFilters["status"];
    propertyId: string;
};

const DEFAULT_VISITS_LIST_PREFS: VisitsListPrefs = {
    q: "",
    status: "all",
    propertyId: "",
};

function isVisitsListPrefs(value: unknown): value is VisitsListPrefs {
    if (typeof value !== "object" || value === null) return false;
    const v = value as Partial<VisitsListPrefs>;
    return (
        typeof v.q === "string" && typeof v.status === "string" && typeof v.propertyId === "string"
    );
}

export function VisitsPage({ viewer }: VisitsPageProps) {
    /**
     * The book opens on today, not on the whole week.
     *
     * A broker's first question is "what do I have to do now", and a list
     * running seven days deep buries today's two visits under Thursday's.
     * The week strip is right above the list, so widening back out is one
     * tap — but it has to be a deliberate one.
     *
     * Computed on mount rather than in `DEFAULT_VISITS_FILTERS`, which is a
     * module constant and would freeze on the day the bundle was imported.
     */
    const prefsKey =
        viewer === "owner" ? PREF_KEYS.owner.visits.prefs : PREF_KEYS.broker.visits.prefs;
    const [listPrefs, setListPrefs] = usePersistedJson<VisitsListPrefs>(
        prefsKey,
        DEFAULT_VISITS_LIST_PREFS,
        { isValid: isVisitsListPrefs },
    );

    const [dateWindow, setDateWindow] = useState(() => {
        const today = formatDateIso(new Date());
        return { dateFrom: today, dateTo: today };
    });

    const filters = useMemo<VisitsFilters>(
        () => ({
            q: listPrefs.q,
            status: listPrefs.status,
            propertyId: listPrefs.propertyId,
            dateFrom: dateWindow.dateFrom,
            dateTo: dateWindow.dateTo,
        }),
        [dateWindow.dateFrom, dateWindow.dateTo, listPrefs],
    );

    const setFilters = useCallback(
        (next: VisitsFilters | ((prev: VisitsFilters) => VisitsFilters)) => {
            const resolved = typeof next === "function" ? next(filters) : next;
            setListPrefs({
                q: resolved.q,
                status: resolved.status,
                propertyId: resolved.propertyId,
            });
            setDateWindow({ dateFrom: resolved.dateFrom, dateTo: resolved.dateTo });
        },
        [filters, setListPrefs],
    );

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

    useEffect(() => {
        let cancelled = false;

        const timer = window.setTimeout(() => {
            if (cancelled) return;

            setIsFetching(true);
            setError(null);

            void visitsApi
                .list(filters, viewer)
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
    }, [filters, revision, viewer]);

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

    const handlers = useMemo<VisitRowHandlers>(
        () => ({
            onAction: handleAction,
            onOpen: (visitId) => setModal({ kind: "detail", visitId }),
        }),
        [handleAction],
    );

    const handlePatch = useCallback((patch: Partial<VisitsFilters>) => {
        setFilters((prev) => ({ ...prev, ...patch }));
    }, []);

    /** Clearing goes back to today, the same place the page opens on. */
    const handleClearFilters = useCallback(() => {
        const today = formatDateIso(new Date());
        setFilters({ ...DEFAULT_VISITS_FILTERS, dateFrom: today, dateTo: today });
    }, []);

    /**
     * The week strip narrows the list to one day, written as a one-day window
     * so it and the range picker share a single filter. Passing "" clears it,
     * which is what tapping the selected day again does.
     */
    const handleSelectDay = useCallback((day: string) => {
        setFilters((prev) => ({ ...prev, dateFrom: day, dateTo: day }));
    }, []);

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

    /**
     * Today-only is where the page starts, so it is the resting state rather
     * than a filter. Counting it as one would leave the Clear button showing
     * on a screen the user never narrowed, with nothing to clear.
     */
    const todayKey = formatDateIso(now);
    const isDefaultDayWindow = filters.dateFrom === todayKey && filters.dateTo === todayKey;

    const hasFilters =
        filters.q.trim().length > 0 ||
        filters.status !== DEFAULT_VISITS_FILTERS.status ||
        filters.propertyId !== "" ||
        (!isDefaultDayWindow && (filters.dateFrom !== "" || filters.dateTo !== ""));
    /** True first-run: nothing at all, and no filter hid it. */
    const isFirstRun =
        !hasFilters &&
        summary != null &&
        summary.upcomingCount + summary.completedCount + summary.cancelledCount === 0;

    /**
     * Historical views (Done, Cancelled) read backwards from now, so a strip
     * of the next seven days would point at nothing. It only shows on the
     * forward-looking filters.
     */
    const isForwardOrder = filters.status !== "completed" && filters.status !== "cancelled";

    /**
     * The strip's pill only lights up for a one-day window. A wider range is
     * a real selection, but it belongs to no single day, so no day is shown
     * as picked.
     */
    const selectedDay =
        filters.dateFrom !== "" && filters.dateFrom === filters.dateTo ? filters.dateFrom : "";

    /**
     * A date window was picked and it holds nothing. Distinct from "no visits
     * match" because the strip itself is the way out, so the list must stay.
     */
    const isEmptyDay =
        isForwardOrder &&
        (visits ?? []).length === 0 &&
        (filters.dateFrom !== "" || filters.dateTo !== "");

    /** Object → Map once, so the strip is not rebuilt on every clock tick. */
    const dayCounts = useMemo(
        () => new Map(Object.entries(summary?.dayCounts ?? {})),
        [summary?.dayCounts],
    );

    return (
        <div className="flex flex-col gap-6">
            <VisitsIntro summary={summary} viewer={viewer} isLoading={isFetching} />

            {!isFirstRun ? (
                <VisitsHeader
                    filters={filters}
                    summary={summary}
                    viewer={viewer}
                    onPatch={handlePatch}
                />
            ) : null}

            {error ? (
                <p role="alert" className="body-sm text-urgent">
                    {error}
                </p>
            ) : null}

            {isFirstLoad && isFetching ? (
                <VisitsListSkeleton />
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
                    <VisitsList
                        visits={visits ?? []}
                        viewer={viewer}
                        handlers={handlers}
                        busyId={busyId}
                        now={now}
                        selectedDay={selectedDay}
                        hasDateWindow={filters.dateFrom !== "" || filters.dateTo !== ""}
                        dateFrom={filters.dateFrom}
                        dateTo={filters.dateTo}
                        dayCounts={dayCounts}
                        // The week strip reads forward in time, so it only
                        // makes sense on the forward-looking filters.
                        onSelectDay={isForwardOrder ? handleSelectDay : undefined}
                        // Sits on the strip's own header row, beside the week
                        // arrows — both answer "which dates am I looking at",
                        // so they belong together.
                        dateControl={
                            <VisitsDateRange
                                dateFrom={filters.dateFrom}
                                dateTo={filters.dateTo}
                                onChange={handlePatch}
                            />
                        }
                        // Empty states render inside the list so the week
                        // strip and date control stay on screen — they are
                        // the way out of an empty result, and a page-level
                        // empty state would take them away.
                        emptyState={
                            (visits ?? []).length === 0 && !isEmptyDay ? (
                                hasFilters && filters.status !== "needs_action" ? (
                                    <VisitsFilteredEmpty onClear={handleClearFilters} />
                                ) : (
                                    <VisitsAllClearEmpty viewer={viewer} />
                                )
                            ) : null
                        }
                    />
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
