/**
 * Who may do what to a visit.
 *
 * This is the one place the two portals differ in behaviour, so it is the one
 * place the difference is written down. A card asks `visitActions(visit,
 * viewer)` and renders what comes back — it never reasons about roles itself.
 * When a rule changes, it changes here and both portals follow.
 *
 * The governing rule: **a visit is a two-party agreement.** Neither side may
 * unilaterally put the other on the spot. A broker proposes, the owner
 * confirms. Either may withdraw, but neither may confirm their own proposal.
 */

import {
    isResolvedVisit,
    type VisitItem,
    type VisitStatus,
    type VisitViewer,
} from "@/features/site-visits/types";

export type VisitAction =
    | "confirm"
    | "decline"
    | "reschedule"
    | "cancel"
    | "complete"
    | "mark_no_show"
    | "record_outcome"
    | "withdraw";

export type VisitActionSet = {
    /** Rendered as the filled button. At most one. */
    primary: VisitAction | null;
    /** Rendered as outline buttons, in order. */
    secondary: VisitAction[];
    /** Tucked into the overflow menu. */
    overflow: VisitAction[];
};

const EMPTY_ACTIONS: VisitActionSet = { primary: null, secondary: [], overflow: [] };

/**
 * True when this viewer is the one holding everyone up.
 *
 * Only the side that did *not* propose can confirm, which is what makes the
 * consent gate real. A broker who proposed a slot sees "waiting on the owner",
 * never a Confirm button on their own proposal.
 */
export function needsActionFrom(visit: VisitItem, viewer: VisitViewer): boolean {
    if (visit.status === "proposed") {
        return visit.proposedBy !== viewer;
    }
    // A visit that has happened but has no verdict is the broker's homework.
    if (visit.status === "completed") {
        return viewer === "broker" && visit.outcome == null;
    }
    return false;
}

/** True when this viewer proposed and is waiting on the other side. */
export function isAwaitingOther(visit: VisitItem, viewer: VisitViewer): boolean {
    return visit.status === "proposed" && visit.proposedBy === viewer;
}

/** Whether the visit's start time is in the past. */
export function hasStarted(visit: VisitItem, now: Date): boolean {
    return new Date(visit.scheduledAt).getTime() <= now.getTime();
}

/**
 * Whether the visit's window has fully elapsed. Only then does "how did it
 * go?" make sense — asking mid-visit is noise.
 */
export function hasEnded(visit: VisitItem, now: Date): boolean {
    const end = new Date(visit.scheduledAt).getTime() + visit.durationMin * 60_000;
    return end <= now.getTime();
}

/**
 * The actions this viewer may take, already ranked. Returning ranked slots
 * rather than a flat list keeps "one primary button per card"
 * (docs/DESIGN.md §4.3) enforceable at the source instead of per component.
 */
export function visitActions(
    visit: VisitItem,
    viewer: VisitViewer,
    now: Date = new Date(),
): VisitActionSet {
    if (isResolvedVisit(visit.status)) {
        // A finished visit still needs its verdict recorded, and only the
        // broker keeps the pipeline, so only the broker is asked.
        if (visit.status === "completed" && viewer === "broker" && visit.outcome == null) {
            return { primary: "record_outcome", secondary: [], overflow: [] };
        }
        return EMPTY_ACTIONS;
    }

    if (visit.status === "proposed") {
        // The other side's proposal: accept, push back, or refuse.
        if (visit.proposedBy !== viewer) {
            return {
                primary: "confirm",
                secondary: ["reschedule"],
                overflow: ["decline"],
            };
        }
        // Your own proposal: you may move it or take it back, never confirm it.
        return { primary: null, secondary: ["reschedule"], overflow: ["withdraw"] };
    }

    // Confirmed.
    if (hasEnded(visit, now)) {
        // Past its window: the question is what happened, not whether to move it.
        if (viewer === "broker") {
            return { primary: "complete", secondary: [], overflow: ["mark_no_show", "cancel"] };
        }
        return { primary: null, secondary: [], overflow: ["mark_no_show"] };
    }

    return { primary: null, secondary: ["reschedule"], overflow: ["cancel"] };
}

/**
 * Whether this viewer may drag the visit to a new time on the calendar.
 *
 * Dragging is a *proposal*, not a fait accompli — dropping a confirmed visit
 * on a new slot sends it back to `proposed` for the other side to re-confirm.
 * A resolved visit is history and does not move.
 */
export function canRescheduleVisit(visit: VisitItem, viewer: VisitViewer, now: Date): boolean {
    if (isResolvedVisit(visit.status)) return false;
    if (hasEnded(visit, now)) return false;
    // You cannot drag a proposal you did not make; answer it instead.
    if (visit.status === "proposed" && visit.proposedBy !== viewer) return false;
    return true;
}

/**
 * The status a visit lands in after this viewer moves it.
 *
 * Moving a confirmed visit revokes the confirmation on purpose. The owner
 * agreed to Tuesday 4pm, not to "whenever the broker likes" — so a moved
 * visit has to be agreed again.
 */
export function statusAfterReschedule(visit: VisitItem, viewer: VisitViewer): VisitStatus {
    void viewer;
    return visit.status === "confirmed" ? "proposed" : visit.status;
}

/** Human sentence for what a drag will do, shown before the drop is committed. */
export function rescheduleConsequence(visit: VisitItem, viewer: VisitViewer): string {
    if (visit.status !== "confirmed") {
        return viewer === "broker"
            ? "The owner will be asked to confirm the new time."
            : "The broker will be asked to confirm the new time.";
    }
    return viewer === "broker"
        ? "This is already confirmed. Moving it asks the owner to confirm again."
        : "This is already confirmed. Moving it asks the broker to confirm again.";
}

/** Label for each action, in the viewer's own terms. */
export function visitActionLabel(action: VisitAction, viewer: VisitViewer): string {
    switch (action) {
        case "confirm":
            return "Confirm";
        case "decline":
            return "Cannot do this time";
        case "reschedule":
            return "Suggest another time";
        case "cancel":
            return "Cancel visit";
        case "complete":
            return viewer === "broker" ? "Mark as done" : "It happened";
        case "mark_no_show":
            return "Nobody turned up";
        case "record_outcome":
            return "Record what happened";
        case "withdraw":
            return "Withdraw request";
    }
}

/** Destructive actions get the destructive button variant and a confirm step. */
export function isDestructiveAction(action: VisitAction): boolean {
    return action === "cancel" || action === "decline" || action === "withdraw";
}
