import { formatDateIso } from "@/lib/format/date";

import { MOCK_VISITS } from "@/features/site-visits/mock-visits";
import {
    isLiveVisit,
    type VisitCancelReason,
    type VisitItem,
    type VisitOutcome,
    type VisitPropertyOption,
    type VisitsFilters,
    type VisitsResult,
    type VisitsSummary,
    type VisitViewer,
} from "@/features/site-visits/types";
import { needsActionFrom } from "@/features/site-visits/visit-permissions";

/** Mutable in-memory copy so status changes survive within a session. */
let visits: VisitItem[] = MOCK_VISITS.map((visit) => ({ ...visit }));

function delay(ms = 220): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso(): string {
    return new Date().toISOString();
}

/** Local midnight, so a visit earlier today still counts as today. */
function startOfDay(date: Date): Date {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
}

function isSameLocalDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function matchesQuery(visit: VisitItem, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;

    return [
        visit.property.title,
        visit.property.locality,
        visit.property.city,
        visit.owner.name,
        visit.broker.name,
        visit.buyer?.name ?? "",
        visit.buyer?.phoneDigits ?? "",
    ].some((field) => field.toLowerCase().includes(needle));
}

function matchesStatus(
    visit: VisitItem,
    filter: VisitsFilters["status"],
    viewer: VisitViewer,
): boolean {
    const now = new Date();

    switch (filter) {
        case "all":
            // "All" is a planning view, not an archive: it starts at today and
            // runs forward. A finished visit from last week above today's
            // first appointment buries the thing the broker opened the page
            // for. History lives behind Done and Cancelled.
            return new Date(visit.scheduledAt).getTime() >= startOfDay(now).getTime();
        case "upcoming":
            // Live and not yet started. The default view — what is coming.
            return (
                isLiveVisit(visit.status) && new Date(visit.scheduledAt).getTime() >= now.getTime()
            );
        case "needs_action":
            return needsActionFrom(visit, viewer);
        default:
            return visit.status === filter;
    }
}

/**
 * The owner never sees the broker's buyer. A marketplace that leaks the
 * broker's book to the supply side loses its brokers — see AGENTS.md on the
 * consent-gated relationship. Stripping it here rather than in the component
 * means no view can forget.
 */
function forViewer(visit: VisitItem, viewer: VisitViewer): VisitItem {
    if (viewer === "broker") return visit;
    return { ...visit, buyer: null, brokerNote: "" };
}

function summarize(
    items: VisitItem[],
    viewer: VisitViewer,
    /** Already narrowed by status and query, but never by the date window. */
    dayScoped: VisitItem[],
    /** Status and query only — never the property filter. See `properties`. */
    propertyScoped: VisitItem[],
): VisitsSummary {
    const now = new Date();

    let todayCount = 0;
    let upcomingCount = 0;
    let needsActionCount = 0;
    let awaitingOtherCount = 0;
    let missingOutcomeCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    for (const visit of items) {
        const scheduled = new Date(visit.scheduledAt);

        if (visit.status === "confirmed" && isSameLocalDay(scheduled, now)) todayCount += 1;
        if (isLiveVisit(visit.status) && scheduled.getTime() >= now.getTime()) upcomingCount += 1;
        if (needsActionFrom(visit, viewer)) needsActionCount += 1;
        if (visit.status === "proposed" && visit.proposedBy === viewer) awaitingOtherCount += 1;
        if (visit.status === "completed") {
            completedCount += 1;
            // Only the broker keeps a pipeline, so only they are chased for a verdict.
            if (viewer === "broker" && visit.outcome == null) missingOutcomeCount += 1;
        }
        if (
            visit.status === "cancelled" ||
            visit.status === "declined" ||
            visit.status === "no_show"
        ) {
            cancelledCount += 1;
        }
    }

    const dayCounts: Record<string, number> = {};
    for (const visit of dayScoped) {
        const key = formatDateIso(new Date(visit.scheduledAt));
        dayCounts[key] = (dayCounts[key] ?? 0) + 1;
    }

    // Ordered by how busy each property is: the one a broker is showing four
    // times this week is the one they are most likely reaching for.
    const propertyCounts = new Map<string, VisitPropertyOption>();
    for (const visit of propertyScoped) {
        const existing = propertyCounts.get(visit.property.id);
        if (existing) {
            existing.count += 1;
            continue;
        }
        propertyCounts.set(visit.property.id, {
            id: visit.property.id,
            label: `${visit.property.configLabel} · ${visit.property.propertyTypeLabel}`,
            locality: visit.property.locality,
            city: visit.property.city,
            count: 1,
        });
    }
    const properties = [...propertyCounts.values()].sort(
        (a, b) => b.count - a.count || a.label.localeCompare(b.label),
    );

    return {
        dayCounts,
        properties,
        todayCount,
        upcomingCount,
        needsActionCount,
        awaitingOtherCount,
        missingOutcomeCount,
        completedCount,
        cancelledCount,
    };
}

function mutate(visitId: string, patch: (visit: VisitItem) => VisitItem): void {
    visits = visits.map((visit) => (visit.id === visitId ? patch(visit) : visit));
}

function appendHistory(
    visit: VisitItem,
    entry: {
        actor: VisitItem["proposedBy"];
        kind: VisitItem["history"][number]["kind"];
        label: string;
    },
): VisitItem["history"] {
    return [...visit.history, { id: `ev_${visit.history.length + 1}`, at: nowIso(), ...entry }];
}

export const visitsApi = {
    /**
     * Every visit this viewer may see, filtered and sorted.
     *
     * Sorting is soonest-first for upcoming views and most-recent-first for
     * historical ones — a list of finished visits reads backwards from now,
     * while a list of upcoming ones reads forwards.
     */
    async list(filters: VisitsFilters, viewer: VisitViewer): Promise<VisitsResult> {
        await delay();

        const visible = visits.map((visit) => forViewer(visit, viewer));

        // Everything except the date window. The week strip counts this set,
        // so its per-day numbers survive selecting a day or a range.
        // Status and query only. The property selector counts this set, so
        // its options survive picking one of them.
        const beforeProperty = visible
            .filter((visit) => matchesQuery(visit, filters.q))
            .filter((visit) => matchesStatus(visit, filters.status, viewer));

        const beforeDay = beforeProperty.filter(
            (visit) => !filters.propertyId || visit.property.id === filters.propertyId,
        );

        const items = beforeDay
            // The date window, inclusive at both ends. Compared as local day
            // keys rather than instants, so a 6 PM visit belongs to its own
            // day regardless of the reader's clock, and a window ending on
            // the 14th includes everything on the 14th.
            .filter((visit) => {
                const key = formatDateIso(new Date(visit.scheduledAt));
                if (filters.dateFrom && key < filters.dateFrom) return false;
                if (filters.dateTo && key > filters.dateTo) return false;
                return true;
            })
            .sort((a, b) => {
                const at = new Date(a.scheduledAt).getTime();
                const bt = new Date(b.scheduledAt).getTime();
                const historical = filters.status === "completed" || filters.status === "cancelled";
                return historical ? bt - at : at - bt;
            });

        // The chip counts read the whole book, not the filtered slice — a
        // filter that hid the one visit needing action would hide the number
        // too. Only the strip's per-day counts follow the active filters.
        // (`beforeDay` is the status/query slice without the date window.)
        return { items, summary: summarize(visible, viewer, beforeDay, beforeProperty) };
    },

    async get(visitId: string, viewer: VisitViewer): Promise<VisitItem | null> {
        await delay(120);
        const found = visits.find((visit) => visit.id === visitId);
        return found ? forViewer(found, viewer) : null;
    },

    async confirm(visitId: string, viewer: VisitViewer): Promise<void> {
        await delay();
        mutate(visitId, (visit) => ({
            ...visit,
            status: "confirmed",
            updatedAt: nowIso(),
            history: appendHistory(visit, {
                actor: viewer,
                kind: "confirmed",
                label: viewer === "owner" ? "Owner confirmed" : "Broker confirmed",
            }),
        }));
    },

    async decline(visitId: string, viewer: VisitViewer, reason: VisitCancelReason): Promise<void> {
        await delay();
        mutate(visitId, (visit) => ({
            ...visit,
            status: "declined",
            cancelReason: reason,
            cancelledBy: viewer,
            updatedAt: nowIso(),
            history: appendHistory(visit, {
                actor: viewer,
                kind: "declined",
                label: "Could not do that time",
            }),
        }));
    },

    /**
     * Moving a visit sends it back to `proposed` whenever it was confirmed —
     * the other side agreed to a time, not to a blank cheque. See
     * `statusAfterReschedule` in visit-permissions.ts.
     */
    async reschedule(
        visitId: string,
        viewer: VisitViewer,
        next: { scheduledAt: string; durationMin?: number },
    ): Promise<void> {
        await delay();
        mutate(visitId, (visit) => ({
            ...visit,
            scheduledAt: next.scheduledAt,
            durationMin: next.durationMin ?? visit.durationMin,
            status: "proposed",
            proposedBy: viewer,
            updatedAt: nowIso(),
            history: appendHistory(visit, {
                actor: viewer,
                kind: "rescheduled",
                label: "Suggested a new time",
            }),
        }));
    },

    async cancel(visitId: string, viewer: VisitViewer, reason: VisitCancelReason): Promise<void> {
        await delay();
        mutate(visitId, (visit) => ({
            ...visit,
            status: "cancelled",
            cancelReason: reason,
            cancelledBy: viewer,
            updatedAt: nowIso(),
            history: appendHistory(visit, {
                actor: viewer,
                kind: "cancelled",
                label: "Cancelled the visit",
            }),
        }));
    },

    async withdraw(visitId: string, viewer: VisitViewer): Promise<void> {
        await delay();
        mutate(visitId, (visit) => ({
            ...visit,
            status: "cancelled",
            cancelReason: "other",
            cancelledBy: viewer,
            updatedAt: nowIso(),
            history: appendHistory(visit, {
                actor: viewer,
                kind: "cancelled",
                label: "Withdrew the request",
            }),
        }));
    },

    async complete(visitId: string, outcome: VisitOutcome | null): Promise<void> {
        await delay();
        mutate(visitId, (visit) => ({
            ...visit,
            status: "completed",
            outcome,
            updatedAt: nowIso(),
            history: appendHistory(visit, {
                actor: "broker",
                kind: "completed",
                label: "Marked the visit as done",
            }),
        }));
    },

    async recordOutcome(visitId: string, outcome: VisitOutcome): Promise<void> {
        await delay();
        mutate(visitId, (visit) => ({
            ...visit,
            outcome,
            updatedAt: nowIso(),
            history: appendHistory(visit, {
                actor: "broker",
                kind: "note",
                label: "Recorded what the buyer thought",
            }),
        }));
    },

    async markNoShow(visitId: string, viewer: VisitViewer): Promise<void> {
        await delay();
        mutate(visitId, (visit) => ({
            ...visit,
            status: "no_show",
            updatedAt: nowIso(),
            history: appendHistory(visit, {
                actor: viewer,
                kind: "note",
                label: "Marked as nobody turned up",
            }),
        }));
    },

    /** Accepts one of the alternative slots the other side offered. */
    async acceptAlternative(visitId: string, viewer: VisitViewer, slotIso: string): Promise<void> {
        await delay();
        mutate(visitId, (visit) => ({
            ...visit,
            scheduledAt: slotIso,
            status: "confirmed",
            alternativeSlots: [],
            updatedAt: nowIso(),
            history: appendHistory(visit, {
                actor: viewer,
                kind: "confirmed",
                label: "Took one of the suggested times",
            }),
        }));
    },
};
