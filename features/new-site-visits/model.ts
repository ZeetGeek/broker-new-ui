import { z } from "zod";

import { addVisitDays, inputValueInIst, inputValueToUtc, istDateKey } from "@/lib/visits/time";

export const visitSchema = z.object({
    id: z.string(),
    clientId: z.string(),
    propertyId: z.string(),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    reminderMinutes: z.number().int().nonnegative(),
    notes: z.string(),
    status: z.enum(["scheduled", "completed", "not_attended", "cancelled"]),
    attendanceNote: z.string().default(""),
    history: z.array(z.object({ at: z.iso.datetime(), label: z.string() })),
});

export type SiteVisit = z.infer<typeof visitSchema>;
export type VisitState = "upcoming" | "running" | "needs_update" | SiteVisit["status"];
export type VisitTab = "upcoming" | "running" | "needs_update" | "completed" | "not_attended";

export const VISIT_TABS: { value: VisitTab; label: string }[] = [
    { value: "upcoming", label: "Upcoming" },
    { value: "running", label: "Running" },
    { value: "needs_update", label: "Needs update" },
    { value: "completed", label: "Completed" },
    { value: "not_attended", label: "Not attended" },
];

export const STATE_LABELS: Record<VisitState, string> = {
    scheduled: "Scheduled",
    upcoming: "Upcoming",
    running: "Running",
    needs_update: "Needs update",
    completed: "Completed",
    not_attended: "Not attended",
    cancelled: "Cancelled",
};

export const REMINDERS = [
    { value: 0, label: "No extra reminder" },
    { value: 15, label: "15 minutes before" },
    { value: 30, label: "30 minutes before" },
    { value: 60, label: "1 hour before" },
    { value: 1440, label: "1 day before" },
];

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

export type VisitDraft = {
    clientId: string;
    propertyId: string;
    date: string;
    startTime: string;
    endTime: string;
    reminderMinutes: number;
    notes: string;
};

export const EMPTY_DRAFT: VisitDraft = {
    clientId: "",
    propertyId: "",
    date: "",
    startTime: "",
    endTime: "",
    reminderMinutes: 0,
    notes: "",
};

export function visitState(visit: SiteVisit, now: number): VisitState {
    if (visit.status !== "scheduled") return visit.status;
    if (Date.parse(visit.endsAt) <= now) return "needs_update";
    if (Date.parse(visit.startsAt) <= now) return "running";
    return "upcoming";
}

export type VisitActionKind =
    "edit" | "completed" | "cancelled" | "not_attended" | "delete" | "view";

export function getVisitActions(visit: SiteVisit, now: number): VisitActionKind[] {
    switch (visitState(visit, now)) {
        case "upcoming":
            return ["edit", "cancelled"];
        case "running":
        case "needs_update":
            return ["edit", "completed", "cancelled"];
        case "completed":
            return ["edit", "not_attended", "delete"];
        case "not_attended":
            return ["edit", "completed", "delete"];
        default:
            return ["view"];
    }
}

export function draftTimes(draft: VisitDraft): { startsAt: string; endsAt: string } | null {
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) ||
        !/^\d{2}:\d{2}$/.test(draft.startTime) ||
        !/^\d{2}:\d{2}$/.test(draft.endTime)
    )
        return null;
    try {
        const times = {
            startsAt: inputValueToUtc(`${draft.date}T${draft.startTime}`),
            endsAt: inputValueToUtc(`${draft.date}T${draft.endTime}`),
        };
        if (
            inputValueInIst(times.startsAt) !== `${draft.date}T${draft.startTime}` ||
            inputValueInIst(times.endsAt) !== `${draft.date}T${draft.endTime}`
        )
            return null;
        return times;
    } catch {
        return null;
    }
}

export function validateDraft(
    draft: VisitDraft,
    visits: SiteVisit[],
    now: number,
    excludeId?: string,
) {
    const errors: Partial<Record<keyof VisitDraft | "conflict", string>> = {};
    if (!draft.clientId) errors.clientId = "Choose a client.";
    if (!draft.propertyId) errors.propertyId = "Choose a property.";
    if (!draft.date) errors.date = "Choose a visit date.";
    if (!draft.startTime) errors.startTime = "Choose a start time.";
    if (!draft.endTime) errors.endTime = "Choose an end time.";
    const times = draftTimes(draft);
    if (times) {
        const original = visits.find((visit) => visit.id === excludeId);
        const recorded = original?.status === "completed" || original?.status === "not_attended";
        const keepsTime =
            original &&
            Date.parse(times.startsAt) === Date.parse(original.startsAt) &&
            Date.parse(times.endsAt) === Date.parse(original.endsAt);
        if (!recorded && Date.parse(times.startsAt) <= now && !keepsTime)
            errors.startTime = "Choose a time in the future.";
        if (recorded && Date.parse(times.startsAt) > now && !keepsTime)
            errors.startTime = "A recorded visit cannot start in the future.";
        if (Date.parse(times.endsAt) <= Date.parse(times.startsAt))
            errors.endTime = "End time must be after start time.";
        const conflict = visits.find(
            (v) =>
                v.id !== excludeId &&
                v.status === "scheduled" &&
                Date.parse(v.startsAt) < Date.parse(times.endsAt) &&
                Date.parse(v.endsAt) > Date.parse(times.startsAt),
        );
        if (conflict && !recorded) errors.conflict = conflict.id;
    } else if (draft.date && draft.startTime && draft.endTime)
        errors.date = "Choose a valid date and time.";
    return { errors, times, valid: Object.keys(errors).length === 0 && times !== null };
}

export function notificationKind(
    visit: SiteVisit,
    now: number,
): "reminder" | "start" | "attendance" | null {
    if (visit.status !== "scheduled") return null;
    const start = Date.parse(visit.startsAt);
    if (now >= Date.parse(visit.endsAt)) return "attendance";
    if (now >= start) return "start";
    if (visit.reminderMinutes && now >= start - visit.reminderMinutes * 60_000) return "reminder";
    return null;
}
