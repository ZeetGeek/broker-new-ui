/**
 * Bridge between the visit domain and the ReUI event calendar.
 *
 * The calendar knows about events with a start, an end and a colour. It knows
 * nothing about representation, consent, or who is waiting on whom. This file
 * is the only place those two vocabularies meet — every view reads
 * `event.data.visit` rather than reaching for the calendar's own shape.
 */

import type {
    CalendarEvent,
    EventCalendarResource,
} from "@/components/reui/event-calendar/event-calendar-types";

import type { VisitItem, VisitViewer } from "@/features/site-visits/types";
import { needsActionFrom } from "@/features/site-visits/visit-permissions";
import { canRescheduleVisit } from "@/features/site-visits/visit-permissions";

/** What rides along on every calendar event, so chips can render domain truth. */
export type VisitEventData = {
    visit: VisitItem;
    /** Waiting on the viewer right now. Drives the ring on the chip. */
    needsAction: boolean;
};

export type VisitCalendarEvent = CalendarEvent<VisitEventData>;

/**
 * Status → chip colour, from the project palette only.
 *
 * docs/DESIGN.md §1.1 allows one hue family plus three signal colours, so a
 * per-broker rainbow (which is what a generic calendar demo does) is out.
 * Colour here carries status, which is information, and every value is an
 * existing token rather than a new one.
 */
const STATUS_COLOR: Record<VisitItem["status"], string> = {
    proposed: "var(--color-urgent)",
    confirmed: "var(--color-brand)",
    completed: "var(--color-stage-4)",
    cancelled: "var(--color-danger)",
    no_show: "var(--color-danger)",
    declined: "var(--color-danger)",
};

/**
 * Packing prominence. A visit waiting on you outranks a confirmed one, which
 * outranks history — so when three chips fight for one cell, the one you have
 * to act on is the one that survives into view.
 */
function priorityOf(visit: VisitItem, needsAction: boolean): number {
    if (needsAction) return 3;
    if (visit.status === "confirmed") return 2;
    if (visit.status === "proposed") return 1;
    return 0;
}

export function toCalendarEvent(
    visit: VisitItem,
    viewer: VisitViewer,
    now: Date,
): VisitCalendarEvent {
    const start = new Date(visit.scheduledAt);
    const end = new Date(start.getTime() + visit.durationMin * 60_000);
    const needsAction = needsActionFrom(visit, viewer);

    return {
        id: visit.id,
        title: `${visit.property.configLabel} · ${visit.property.locality}`,
        start,
        end,
        color: STATUS_COLOR[visit.status],
        // Resolved visits are history: they render, but nothing drags them.
        readOnly: !canRescheduleVisit(visit, viewer, now),
        // The resource view splits the day by property, so an owner with three
        // listings sees three columns rather than one pile.
        resourceId: visit.property.id,
        priority: priorityOf(visit, needsAction),
        data: { visit, needsAction },
    };
}

export function toCalendarEvents(
    visits: VisitItem[],
    viewer: VisitViewer,
    now: Date,
): VisitCalendarEvent[] {
    return visits.map((visit) => toCalendarEvent(visit, viewer, now));
}

/**
 * One resource column per property present in the range.
 *
 * Built from the visits themselves rather than from a property list: a column
 * for a property nobody is visiting is an empty lane the user has to scroll
 * past. Sorted by locality so the columns read in a stable order.
 */
export function toCalendarResources(visits: VisitItem[]): EventCalendarResource[] {
    const seen = new Map<string, EventCalendarResource>();

    for (const visit of visits) {
        if (seen.has(visit.property.id)) continue;
        seen.set(visit.property.id, {
            id: visit.property.id,
            title: `${visit.property.configLabel} · ${visit.property.locality}`,
        });
    }

    return [...seen.values()].sort((a, b) => a.title.localeCompare(b.title));
}
