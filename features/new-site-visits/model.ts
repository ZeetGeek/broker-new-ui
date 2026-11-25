import { ApiError } from "@/lib/api/client";
import type { BookableLead, BrokerVisit, VisitDuration, VisitTab } from "@/lib/api/site-visits";
import { isReminderOffset, reminderLabel } from "@/lib/reminders";
import { MAX_CHARS } from "@/lib/validation/text-limits";
import { addVisitDays, istDateKey } from "@/lib/visits/time";

export const MAX_VISIT_REMINDERS = 6;

/** Where a visit sits right now. Matches the server's tabs. */
export type VisitState = VisitTab;

export const VISIT_TABS: { value: VisitTab; label: string }[] = [
    { value: "upcoming", label: "Upcoming" },
    { value: "running", label: "Running" },
    { value: "needs_update", label: "Needs update" },
    { value: "completed", label: "Completed" },
    { value: "not_attended", label: "Not attended" },
    { value: "cancelled", label: "Cancelled" },
];

export const STATE_LABELS: Record<VisitState, string> = {
    upcoming: "Upcoming",
    running: "Running",
    needs_update: "Needs update",
    completed: "Completed",
    not_attended: "Not attended",
    cancelled: "Cancelled",
};

export const VISIT_REMINDERS = [
    { value: 0, label: "At visit time" },
    { value: 15, label: "15 minutes before" },
    { value: 30, label: "30 minutes before" },
    { value: 60, label: "1 hour before" },
    { value: 1440, label: "1 day before" },
];

export const DURATION_CHIPS: { value: VisitDuration; label: string }[] = [
    { value: 30, label: "30 min" },
    { value: 45, label: "45 min" },
    { value: 60, label: "1 hour" },
];

/** Visits can be booked today through today + 13 days (IST). */
export const BOOKABLE_DAYS = 14;

export const DATE_RANGES = [
    { value: "next7", label: "Next 7 days" },
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "past30", label: "Past 30 days" },
    { value: "all", label: "All dates" },
    { value: "custom", label: "Custom dates" },
];

export function visitDateBounds(range: string, now: number) {
    const today = istDateKey(new Date(now));
    if (range === "today") return { from: today, to: today };
    if (range === "tomorrow") {
        const day = istDateKey(addVisitDays(new Date(now), 1));
        return { from: day, to: day };
    }
    if (range === "next7") return { from: today, to: istDateKey(addVisitDays(new Date(now), 6)) };
    if (range === "past30")
        return { from: istDateKey(addVisitDays(new Date(now), -29)), to: today };
    return { from: "", to: "" };
}

export function visitState(
    visit: Pick<BrokerVisit, "status" | "startsAt" | "endsAt">,
    now: number,
): VisitState {
    if (visit.status === "completed") return "completed";
    if (visit.status === "no_show") return "not_attended";
    if (visit.status === "cancelled") return "cancelled";
    if (Date.parse(visit.endsAt) <= now) return "needs_update";
    if (Date.parse(visit.startsAt) <= now) return "running";
    return "upcoming";
}

export type VisitActionKind = "reschedule" | "completed" | "not_attended" | "cancelled" | "view";

export function getVisitActions(visit: BrokerVisit, now: number): VisitActionKind[] {
    const actions: VisitActionKind[] = (() => {
        switch (visitState(visit, now)) {
            case "upcoming":
                return ["reschedule", "cancelled"];
            case "running":
            case "needs_update":
                return ["completed", "not_attended", "reschedule", "cancelled"];
            case "completed":
                return ["not_attended"];
            case "not_attended":
                return ["completed"];
            default:
                return ["view"];
        }
    })();
    // Owner-listed visits follow the owner's published times: cancel and rebook.
    return visit.isExclusive ? actions : actions.filter((action) => action !== "reschedule");
}

export type VisitDraft = {
    leadId: string;
    clientId: string;
    propertyId: string;
    durationMinutes: VisitDuration | null;
    /** IST date key, YYYY-MM-DD. */
    date: string;
    /** ISO start chosen from the server's free times. */
    startAt: string;
    notes: string;
    reminders: number[];
};

export const VISIT_DEFAULT_REMINDERS = [30];

export const EMPTY_DRAFT: VisitDraft = {
    leadId: "",
    clientId: "",
    propertyId: "",
    durationMinutes: null,
    date: "",
    startAt: "",
    notes: "",
    reminders: [30],
};

export function draftForLead(lead: BookableLead | null | undefined): VisitDraft {
    return lead
        ? {
              ...EMPTY_DRAFT,
              leadId: lead.leadId,
              clientId: lead.clientId,
              propertyId: lead.propertyId,
          }
        : { ...EMPTY_DRAFT };
}

/**
 * Reschedule starts from the visit's length. Its time is kept only while it is
 * still ahead; an overdue visit from an earlier day starts on today instead.
 */
export function rescheduleDraft(visit: BrokerVisit, now: number): VisitDraft {
    const length = DURATION_CHIPS.find((chip) => chip.value === visit.durationMinutes)?.value;
    const upcoming = Date.parse(visit.startsAt) > now;
    const today = istDateKey(new Date(now));
    const visitDay = istDateKey(visit.startsAt);
    return {
        ...EMPTY_DRAFT,
        leadId: visit.leadId,
        clientId: visit.clientId,
        propertyId: visit.propertyId,
        durationMinutes: length ?? null,
        date: visitDay < today ? today : visitDay,
        startAt: upcoming ? visit.startsAt : "",
        notes: visit.notes,
        reminders: visit.reminders.length ? [...visit.reminders] : [...VISIT_DEFAULT_REMINDERS],
    };
}

export type DraftErrors = Partial<Record<keyof VisitDraft, string>>;

export function validateVisitDraft(draft: VisitDraft, now: number): DraftErrors {
    const errors: DraftErrors = {};
    if (!draft.clientId) errors.clientId = "Choose a client.";
    if (!draft.propertyId || !draft.leadId) errors.propertyId = "Choose a property.";
    if (!draft.durationMinutes) errors.durationMinutes = "Choose a visit length.";
    if (!draft.date) errors.date = "Choose a visit date.";
    if (!draft.startAt) errors.startAt = "Choose a start time.";
    else if (Date.parse(draft.startAt) <= now) errors.startAt = "Pick a time in the future.";
    if (draft.notes.length > MAX_CHARS.visitNote)
        errors.notes = `Keep the notes under ${MAX_CHARS.visitNote} characters.`;
    if (!draft.reminders.length) errors.reminders = "Keep at least one reminder for this visit.";
    return errors;
}

/** What a Pipeline "Schedule visit" link asked for, or null when it isn't one. */
export type ScheduleIntent = { leadId?: string; clientId?: string; propertyId?: string };

export function parseScheduleIntent(params: URLSearchParams): ScheduleIntent | null {
    if (params.get("schedule") !== "1") return null;
    const intent: ScheduleIntent = {};
    for (const key of ["leadId", "clientId", "propertyId"] as const) {
        const value = params.get(key)?.trim();
        if (value) intent[key] = value;
    }
    return intent;
}

/** The bookable deal a link points at: by deal id, else by client + property. */
export function matchIntent(intent: ScheduleIntent, leads: BookableLead[]): BookableLead | null {
    if (intent.leadId) {
        const byLead = leads.find((lead) => lead.leadId === intent.leadId);
        if (byLead) return byLead;
    }
    if (intent.clientId && intent.propertyId) {
        return (
            leads.find(
                (lead) =>
                    lead.clientId === intent.clientId && lead.propertyId === intent.propertyId,
            ) ?? null
        );
    }
    return null;
}

export type IntentView =
    | { kind: "reschedule"; visit: BrokerVisit }
    | { kind: "schedule"; intent: BookableLead | null; intentMissed: boolean };

/**
 * Where a Pipeline link lands. Only a bookable deal (open, on the broker's own
 * listing) may move its booked visit; anything else gets the explanation.
 */
export function resolveScheduleIntent(
    intent: ScheduleIntent,
    leads: BookableLead[],
    activeVisit: BrokerVisit | null,
): IntentView {
    const lead = matchIntent(intent, leads);
    if (!lead) return { kind: "schedule", intent: null, intentMissed: true };
    if (activeVisit && activeVisit.isExclusive && activeVisit.leadId === lead.leadId)
        return { kind: "reschedule", visit: activeVisit };
    return { kind: "schedule", intent: lead, intentMissed: false };
}

const TIME_TAKEN_CODES = new Set(["LEAD_TIME_CONFLICT", "BROKER_TIME_CONFLICT"]);

/** The chosen time was taken meanwhile, so the form should drop it. */
export function isTimeTaken(error: unknown): boolean {
    if (!(error instanceof ApiError) || error.status !== 400) return false;
    const code = (error.body as { code?: unknown } | undefined)?.code;
    return (
        (typeof code === "string" && TIME_TAKEN_CODES.has(code)) ||
        /already booked|already has a visit|already have a visit|open visit times/i.test(
            error.message,
        )
    );
}

/** Plain words for a failed save. Never a server address or internal error. */
export function visitErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 0)
            return "You seem to be offline. Check your connection and try again.";
        if (error.status >= 500) return "Something went wrong on our side. Try again in a minute.";
        if (error.message) return error.message;
    }
    return "That didn't save. Check your connection and try again.";
}

export function bookableDates(now: number): string[] {
    return Array.from({ length: BOOKABLE_DAYS }, (_, day) =>
        istDateKey(addVisitDays(new Date(now), day)),
    );
}

export function visitDurationLabel(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    if (!hours) return `${remaining} min`;
    return `${hours} hour${hours === 1 ? "" : "s"}${remaining ? ` ${remaining} min` : ""}`;
}

export function visitReminderLabel(minutes: number): string {
    return reminderLabel(minutes, "At visit time");
}

export function visitReminderAt(startsAt: string, minutes: number): string | null {
    const start = Date.parse(startsAt);
    if (!Number.isFinite(start) || !isReminderOffset(minutes)) return null;
    return new Date(start - minutes * 60_000).toISOString();
}

/** Each selected offset has its own scheduled instant, earliest first. */
export function visitReminders(visit: { startsAt: string; reminders: number[] }) {
    return [...new Set(visit.reminders)]
        .flatMap((minutes) => {
            const at = visitReminderAt(visit.startsAt, minutes);
            return at ? [{ minutes, at, key: `${visit.startsAt}:${minutes}` }] : [];
        })
        .sort((a, b) => a.at.localeCompare(b.at));
}
