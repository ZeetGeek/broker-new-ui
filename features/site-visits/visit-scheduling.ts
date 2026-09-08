/**
 * Slot arithmetic: conflicts, travel time, and working hours.
 *
 * Pure functions over visits — no React, no fetching. The calendar, the
 * scheduling form, and the drag handler all ask the same questions here so
 * they cannot disagree about what counts as a clash.
 */

import { isLiveVisit, type VisitItem } from "@/features/site-visits/types";

const MIN_MS = 60_000;

/** Working window shown by default in the day and week grids. */
export const VISIT_DAY_START_HOUR = 8;
export const VISIT_DAY_END_HOUR = 21;

/**
 * Minutes a broker needs between two showings. Surat traffic makes
 * back-to-back visits in different localities a promise nobody can keep, so
 * the calendar warns rather than letting the broker discover it on the road.
 */
export const TRAVEL_BUFFER_MIN = 30;

export type VisitSlot = { start: Date; end: Date };

/** `findConflicts` needs the candidate locality to judge travel time. */
export type CandidateSlot = VisitSlot & { locality?: string };

export function visitSlot(visit: VisitItem): VisitSlot {
    const start = new Date(visit.scheduledAt);
    return { start, end: new Date(start.getTime() + visit.durationMin * MIN_MS) };
}

/** Half-open overlap: touching edges (11:00 end, 11:00 start) do not clash. */
export function slotsOverlap(a: VisitSlot, b: VisitSlot): boolean {
    return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

/** Gap in minutes between two non-overlapping slots. Negative when they overlap. */
export function gapBetween(a: VisitSlot, b: VisitSlot): number {
    const [first, second] = a.start.getTime() <= b.start.getTime() ? [a, b] : [b, a];
    return Math.round((second.start.getTime() - first.end.getTime()) / MIN_MS);
}

export type VisitConflict = {
    kind: "overlap" | "tight_travel";
    /** The already-booked visit this one clashes with. */
    against: VisitItem;
    /** Minutes of gap. Negative or zero for an overlap. */
    gapMin: number;
    /** One sentence, already written for a non-technical reader. */
    message: string;
};

/**
 * Everything wrong with putting a visit in this slot.
 *
 * Overlaps are hard errors — a broker cannot be in two flats at once.
 * Tight travel is a warning, not a block: sometimes the two properties are in
 * the same tower and thirty minutes is plenty. The product says so and lets
 * the broker decide, rather than pretending to know the map.
 */
export function findConflicts(
    candidate: CandidateSlot,
    existing: VisitItem[],
    options: { excludeVisitId?: string; travelBufferMin?: number } = {},
): VisitConflict[] {
    const { excludeVisitId, travelBufferMin = TRAVEL_BUFFER_MIN } = options;
    const conflicts: VisitConflict[] = [];

    for (const visit of existing) {
        if (visit.id === excludeVisitId) continue;
        // Cancelled and finished visits do not hold a slot.
        if (!isLiveVisit(visit.status)) continue;

        const slot = visitSlot(visit);

        if (slotsOverlap(candidate, slot)) {
            conflicts.push({
                kind: "overlap",
                against: visit,
                gapMin: gapBetween(candidate, slot),
                message: `Clashes with ${visit.property.configLabel} in ${visit.property.locality}.`,
            });
            continue;
        }

        const gap = gapBetween(candidate, slot);
        if (gap < travelBufferMin) {
            // Same locality, same trip — a tight gap there is not a problem.
            if (candidate.locality && visit.property.locality === candidate.locality) continue;

            conflicts.push({
                kind: "tight_travel",
                against: visit,
                gapMin: gap,
                message: `Only ${gap} min to get from ${visit.property.locality} to here.`,
            });
        }
    }

    return conflicts;
}

export function hasBlockingConflict(conflicts: VisitConflict[]): boolean {
    return conflicts.some((conflict) => conflict.kind === "overlap");
}

/**
 * Suggests the next free slot at or after `from`, stepping in `stepMin`
 * increments and staying inside working hours. Used by the "next free slot"
 * shortcut in the scheduling form so the broker does not hunt the grid.
 */
export function nextFreeSlot(
    from: Date,
    durationMin: number,
    existing: VisitItem[],
    options: { stepMin?: number; maxDaysAhead?: number; locality?: string } = {},
): Date | null {
    const { stepMin = 30, maxDaysAhead = 14, locality } = options;
    const limit = from.getTime() + maxDaysAhead * 24 * 60 * MIN_MS;

    // Round up to the next step boundary so suggestions land on :00 or :30.
    const stepMs = stepMin * MIN_MS;
    let cursor = new Date(Math.ceil(from.getTime() / stepMs) * stepMs);

    while (cursor.getTime() <= limit) {
        const hour = cursor.getHours();

        if (hour < VISIT_DAY_START_HOUR) {
            const atOpen = new Date(cursor);
            atOpen.setHours(VISIT_DAY_START_HOUR, 0, 0, 0);
            cursor = atOpen;
            continue;
        }

        const end = new Date(cursor.getTime() + durationMin * MIN_MS);
        // Past closing, or the visit would run past it — try tomorrow.
        if (hour >= VISIT_DAY_END_HOUR || end.getHours() > VISIT_DAY_END_HOUR) {
            const next = new Date(cursor);
            next.setDate(next.getDate() + 1);
            next.setHours(VISIT_DAY_START_HOUR, 0, 0, 0);
            cursor = next;
            continue;
        }

        const candidate: CandidateSlot = { start: cursor, end, locality };
        if (!hasBlockingConflict(findConflicts(candidate, existing))) {
            return cursor;
        }

        cursor = new Date(cursor.getTime() + stepMs);
    }

    return null;
}

/**
 * Free windows on one day, given what is already booked. Feeds the slot
 * picker so the owner sees times that can actually work rather than a blank
 * grid they have to reason about.
 */
export function freeWindowsOnDay(
    day: Date,
    durationMin: number,
    existing: VisitItem[],
    stepMin = 30,
): Date[] {
    const windows: Date[] = [];
    const cursor = new Date(day);
    cursor.setHours(VISIT_DAY_START_HOUR, 0, 0, 0);

    const dayEnd = new Date(day);
    dayEnd.setHours(VISIT_DAY_END_HOUR, 0, 0, 0);

    while (cursor.getTime() + durationMin * MIN_MS <= dayEnd.getTime()) {
        const slot = {
            start: new Date(cursor),
            end: new Date(cursor.getTime() + durationMin * MIN_MS),
        };
        if (!hasBlockingConflict(findConflicts(slot, existing))) {
            windows.push(new Date(cursor));
        }
        cursor.setTime(cursor.getTime() + stepMin * MIN_MS);
    }

    return windows;
}
