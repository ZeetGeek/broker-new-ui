import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";

import {
    isReminderOffset,
    MAX_REMINDER_MINUTES,
    MAX_TASK_REMINDERS,
    reminderLabel,
} from "@/lib/reminders";
import { MAX_CHARS } from "@/lib/validation/text-limits";
import { inputValueInIst, inputValueToUtc, istDateKey } from "@/lib/visits/time";

import { type TaskRepeat, taskRepeatSchema } from "./recurrence";

export const TASK_TIME_ZONE = "Asia/Kolkata";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
    urgent: "Priority 1",
    high: "Priority 2",
    medium: "Priority 3",
    low: "Priority 4",
};
export const TASK_PRIORITY_RANK: Record<TaskPriority, number> = {
    low: 1,
    medium: 2,
    high: 3,
    urgent: 4,
};

export const TASK_TABS = [
    { value: "all", label: "To do" },
    { value: "overdue", label: "Overdue" },
    { value: "completed", label: "Completed" },
    { value: "deleted", label: "Deleted" },
] as const;
export type TaskTab = (typeof TASK_TABS)[number]["value"];
export type TaskGroup = "overdue" | "today" | "upcoming" | "undated" | "completed";

export { MAX_REMINDER_MINUTES, MAX_TASK_REMINDERS };
export const TASK_REMINDERS: { value: number; label: string }[] = [
    { value: 0, label: "At due time" },
    { value: 15, label: "15 minutes before" },
    { value: 60, label: "1 hour before" },
    { value: 1440, label: "1 day before" },
];

export function isTaskReminderOffset(minutes: number): boolean {
    return isReminderOffset(minutes);
}

const remindersSchema = z
    .array(z.number().int().min(0).max(MAX_REMINDER_MINUTES))
    .max(MAX_TASK_REMINDERS)
    .refine((values) => new Set(values).size === values.length, "Choose each reminder only once.");

export function isTaskDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01" || value > "9999-12-31")
        return false;
    try {
        return inputValueInIst(inputValueToUtc(`${value}T12:00`)) === `${value}T12:00`;
    } catch {
        return false;
    }
}

export function isTaskTime(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export const taskSchema = z
    .object({
        id: z.string().min(1),
        title: z.string().trim().min(1).max(160),
        details: z.string().max(2000),
        startDate: z.string().refine(isTaskDate).nullable().default(null),
        startTime: z.string().refine(isTaskTime).nullable().optional(),
        startReminderEnabledAt: z.iso.datetime().optional(),
        repeat: taskRepeatSchema.nullable().default(null),
        repeatAnchor: z.string().refine(isTaskDate).nullable().default(null),
        repeatFromId: z.string().min(1).nullable().default(null),
        dueDate: z.string().refine(isTaskDate).nullable(),
        dueTime: z.string().refine(isTaskTime).nullable(),
        reminders: remindersSchema,
        clientId: z.string().min(1).nullable(),
        ownerId: z.string().min(1).nullable().default(null),
        ownerType: z.enum(["platform", "exclusive"]).nullable().optional(),
        client: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
        owner: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
        property: z.object({ id: z.string(), title: z.string() }).nullable().optional(),
        propertyId: z.string().min(1).nullable(),
        completedAt: z.iso.datetime().nullable(),
        deletedAt: z.iso.datetime().nullable().optional(),
        plannerOrder: z.number().finite().optional(),
        listId: z.string().min(1).nullable().optional(),
        createdAt: z.iso.datetime(),
        updatedAt: z.iso.datetime(),
        priority: z.enum(["low", "medium", "high", "urgent"]),
        /** Title offset where the typed P1–P4 chip sat; the label itself is not in the title. */
        priorityAt: z.number().int().min(0).nullable().optional(),
        deliveredReminderKeys: z.array(z.string().min(1)),
    })
    .refine((task) => !task.dueTime || !!task.dueDate, "A time needs a due date.")
    .refine((task) => !task.startTime || !!task.startDate, "A start time needs a start date.")
    .refine(
        (task) =>
            !task.startDate ||
            task.startDate !== task.dueDate ||
            !task.startTime ||
            !task.dueTime ||
            task.startTime <= task.dueTime,
        "Due time must be on or after start time.",
    )
    .refine(
        (task) => !task.startDate || !task.dueDate || task.startDate <= task.dueDate,
        "Due date must be on or after start date.",
    )
    .refine(
        (task) => !task.repeat || !!(task.startDate || task.dueDate),
        "A repeating task needs a date.",
    )
    .refine(
        (task) =>
            !task.repeat?.until || task.repeat.until >= (task.dueDate || task.startDate || ""),
        "Repeat end date must be on or after this occurrence.",
    )
    .refine(
        (task) => task.reminders.length === 0 || (!!task.dueDate && !!task.dueTime),
        "A reminder needs a due date and time.",
    );
export type Task = z.infer<typeof taskSchema>;

export type TaskDraft = {
    title: string;
    details: string;
    startDate: string;
    startTime: string;
    repeat: TaskRepeat | null;
    dueDate: string;
    dueTime: string;
    reminders: number[];
    clientId: string;
    ownerId: string;
    propertyId: string;
    priority: TaskPriority;
};

export const EMPTY_TASK_DRAFT: TaskDraft = {
    title: "",
    details: "",
    startDate: "",
    startTime: "",
    repeat: null,
    dueDate: "",
    dueTime: "",
    reminders: [],
    clientId: "",
    ownerId: "",
    propertyId: "",
    priority: "low",
};

export function newTaskDraft(now = Date.now()): TaskDraft {
    return {
        ...EMPTY_TASK_DRAFT,
        startDate: taskDateKey(now),
        startTime: inputValueInIst(new Date(now)).slice(11, 16),
        reminders: [],
    };
}

/** Upgrade date-only preview records once; keep every explicitly selected time. */
export function backfillTaskStart(task: Task, now = Date.now()): Task {
    if (task.startDate && task.startTime) return task;
    const today = taskDateKey(now);
    const startDate =
        task.startDate || (task.dueDate && task.dueDate < today ? task.dueDate : today);
    const currentTime = inputValueInIst(new Date(now)).slice(11, 16);
    const startTime =
        task.startTime ||
        (startDate === task.dueDate && task.dueTime && currentTime > task.dueTime
            ? task.dueTime
            : currentTime);
    return { ...task, startDate, startTime, startReminderEnabledAt: new Date(now).toISOString() };
}

export function draftFromTask(task: Task): TaskDraft {
    return {
        title: task.title,
        details: task.details,
        startDate: task.startDate ?? "",
        startTime: task.startTime ?? "",
        repeat: task.repeat ? { ...task.repeat, weekdays: [...task.repeat.weekdays] } : null,
        dueDate: task.dueDate ?? "",
        dueTime: task.dueTime ?? "",
        reminders: [...task.reminders],
        clientId: task.clientId ?? "",
        ownerId: task.ownerId ?? "",
        propertyId: task.propertyId ?? "",
        priority: task.priority,
    };
}

export function validateTaskDraft(draft: TaskDraft) {
    const errors: Partial<Record<keyof TaskDraft, string>> = {};
    if (!draft.title.trim()) errors.title = "Give your task a name.";
    else if (draft.title.trim().length > 160)
        errors.title = "Keep the task name under 160 characters.";
    if (draft.details.length > MAX_CHARS.taskDetails)
        errors.details = `Keep the details under ${MAX_CHARS.taskDetails.toLocaleString("en-IN")} characters.`;
    if (!draft.startDate) errors.startDate = "Choose a start date.";
    else if (!isTaskDate(draft.startDate)) errors.startDate = "Choose a valid start date.";
    if (!draft.startTime) errors.startTime = "Choose a start time.";
    else if (!isTaskTime(draft.startTime)) errors.startTime = "Choose a valid start time.";
    if (draft.startTime && !draft.startDate)
        errors.startDate = "Choose a date for this start time.";
    if (draft.dueDate && !isTaskDate(draft.dueDate)) errors.dueDate = "Choose a valid due date.";
    if (draft.dueTime && !isTaskTime(draft.dueTime)) errors.dueTime = "Choose a valid time.";
    if (draft.dueTime && !draft.dueDate) errors.dueDate = "Choose a date for this time.";
    if (draft.startDate && draft.dueDate && draft.startDate > draft.dueDate)
        errors.dueDate = "Due date must be on or after the start date.";
    if (
        draft.startDate &&
        draft.startDate === draft.dueDate &&
        draft.startTime &&
        draft.dueTime &&
        draft.startTime > draft.dueTime
    )
        errors.dueTime = "Due time must be on or after the start time.";
    if (draft.repeat && !taskRepeatSchema.safeParse(draft.repeat).success)
        errors.repeat =
            "Choose a whole repeat interval from 1 to 365 and at least one day for weekly repeats.";
    if (draft.repeat && !draft.startDate && !draft.dueDate)
        errors.startDate = "Add a start date or due date to repeat this task.";
    if (draft.repeat?.until && draft.repeat.until < (draft.dueDate || draft.startDate))
        errors.repeat = "Repeat end date must be on or after this task’s date.";
    if (draft.reminders.length > MAX_TASK_REMINDERS)
        errors.reminders = `You can add up to ${MAX_TASK_REMINDERS} reminders.`;
    else if (!remindersSchema.safeParse(draft.reminders).success)
        errors.reminders =
            "Use different reminders between 0 minutes and 365 days before the task.";
    if (draft.reminders.length > 0 && (!draft.dueDate || !draft.dueTime))
        errors.reminders = "Add a due date and time to set reminders.";
    return { valid: Object.keys(errors).length === 0, errors };
}

/** Canonical UTC instant for a timed task, independent of the device timezone. */
export function taskDueAt(task: Pick<Task, "dueDate" | "dueTime">): string | null {
    if (!task.dueDate || !task.dueTime || !isTaskDate(task.dueDate) || !isTaskTime(task.dueTime))
        return null;
    return inputValueToUtc(`${task.dueDate}T${task.dueTime}`);
}

export function taskReminderAt(
    task: Pick<Task, "dueDate" | "dueTime">,
    minutes: number,
): string | null {
    const due = taskDueAt(task);
    if (!due || !isTaskReminderOffset(minutes)) return null;
    return new Date(Date.parse(due) - minutes * 60_000).toISOString();
}

export function taskReminderKey(
    task: Pick<Task, "dueDate" | "dueTime">,
    minutes: number,
): string | null {
    const due = taskDueAt(task);
    return due && isTaskReminderOffset(minutes) ? `${due}:${minutes}` : null;
}

export type TaskReminder = {
    kind: "start" | "due";
    minutes: number;
    at: string | null;
    key: string;
};

/** Earliest delivery first, regardless of the order offsets were selected. */
export function taskReminders(
    task: Pick<Task, "dueDate" | "dueTime" | "reminders"> &
        Partial<Pick<Task, "startDate" | "startTime">>,
): TaskReminder[] {
    const startAt =
        task.startDate && task.startTime && isTaskDate(task.startDate) && isTaskTime(task.startTime)
            ? inputValueToUtc(`${task.startDate}T${task.startTime}`)
            : null;
    const start: TaskReminder = {
        kind: "start",
        minutes: 0,
        at: startAt,
        key: startAt ? `start:${startAt}` : "start:pending",
    };
    const extra: TaskReminder[] = [...new Set(task.reminders)].flatMap((minutes) => {
        const at = taskReminderAt(task, minutes);
        const key = taskReminderKey(task, minutes);
        return at && key ? [{ kind: "due" as const, minutes, at, key }] : [];
    });
    return [start, ...extra].sort((a, b) => (a.at ?? "9999").localeCompare(b.at ?? "9999"));
}

export function taskDueReminders(task: Task, now = Date.now()): TaskReminder[] {
    if (task.completedAt || task.deletedAt) return [];
    return taskReminders(task).filter(
        (reminder) =>
            !!reminder.at &&
            (reminder.kind !== "start" ||
                !task.startReminderEnabledAt ||
                reminder.at >= task.startReminderEnabledAt) &&
            !task.deliveredReminderKeys.includes(reminder.key) &&
            Date.parse(reminder.at) <= now,
    );
}

export function taskReminderLabel(minutes: number): string {
    return reminderLabel(minutes, "At due time");
}

export function taskReminderDescription(reminder: Pick<TaskReminder, "kind" | "minutes">): string {
    return reminder.kind === "start" ? "At task start" : taskReminderLabel(reminder.minutes);
}

export function taskRemindersSummary(task: Pick<Task, "reminders">): string {
    return task.reminders.length ? `${task.reminders.length + 1} reminders` : "At task start";
}

/**
 * Past due dates are overdue. Same-day tasks with an explicit due time become
 * overdue once that IST clock time has passed (e.g. 11am when it is 12:20).
 * Date-only today tasks stay in Today until the calendar day rolls over.
 */
export function taskIsOverdue(
    task: Pick<Task, "dueDate"> & Partial<Pick<Task, "startDate" | "dueTime">>,
    now = Date.now(),
): boolean {
    const today = istDateKey(new Date(now));
    const date = task.dueDate || task.startDate;
    if (!date) return false;
    if (date < today) return true;
    if (date > today) return false;
    if (task.dueDate && task.dueTime && isTaskTime(task.dueTime)) {
        const currentTime = inputValueInIst(new Date(now)).slice(11, 16);
        return task.dueTime < currentTime;
    }
    return false;
}

/** Use the due date, or planned start for undated list tasks. */
export function taskGroup(task: Task, now = Date.now()): TaskGroup {
    if (task.completedAt) return "completed";
    const today = istDateKey(new Date(now));
    const date = task.dueDate || task.startDate;
    if (!date) return "undated";
    if (taskIsOverdue(task, now)) return "overdue";
    return date === today ? "today" : "upcoming";
}

export function taskMatchesTab(
    task: Task,
    tab: TaskTab,
    completionFeedback = false,
    now = Date.now(),
): boolean {
    if (tab === "deleted") return !!task.deletedAt;
    if (task.deletedAt) return false;
    if (tab === "overdue") return !task.completedAt && taskIsOverdue(task, now);
    if (tab === "completed") return !!task.completedAt;
    return tab === "all" ? !task.completedAt || completionFeedback : false;
}

export type TaskDueFilter = "" | "any" | "overdue" | "today" | "week" | "undated";
export type TaskLinkFilter = "" | "any" | "client" | "owner" | "property" | "personal";

/** Filter original dates in every tab; overdue falls back to the start for tasks without a deadline. */
export function taskMatchesDueFilter(
    task: Pick<Task, "dueDate"> & Partial<Pick<Task, "startDate" | "dueTime">>,
    due: TaskDueFilter,
    now = Date.now(),
): boolean {
    if (!due || due === "any") return true;
    if (due === "undated") return !task.dueDate;
    const today = taskDateKey(now);
    if (due === "overdue") return taskIsOverdue(task, now);
    if (!task.dueDate) return false;
    if (due === "today") return task.dueDate === today;
    return task.dueDate >= today && task.dueDate <= taskDateKey(now + 6 * 86_400_000);
}

export function taskMatchesLinkFilter(
    task: Pick<Task, "clientId" | "ownerId" | "propertyId">,
    linked: TaskLinkFilter,
): boolean {
    if (!linked || linked === "any") return true;
    if (linked === "client") return !!task.clientId;
    if (linked === "owner") return !!task.ownerId;
    if (linked === "property") return !!task.propertyId;
    return !task.clientId && !task.ownerId && !task.propertyId;
}

export function taskReminderIsDue(task: Task, now = Date.now()): boolean {
    return taskDueReminders(task, now).length > 0;
}

export function taskDateKey(value = Date.now()): string {
    return istDateKey(new Date(value));
}

export function taskDateLabel(date: string, now = Date.now()): string {
    const today = taskDateKey(now);
    const tomorrow = taskDateKey(now + 86_400_000);
    if (date === today) return "Today";
    if (date === tomorrow) return "Tomorrow";
    return isTaskDate(date)
        ? formatInTimeZone(inputValueToUtc(`${date}T12:00`), TASK_TIME_ZONE, "EEE, d MMM")
        : "No due date";
}

export function taskTimeLabel(time: string): string {
    if (!isTaskTime(time)) return "Any time";
    return formatInTimeZone(inputValueToUtc(`2026-01-01T${time}`), TASK_TIME_ZONE, "h:mm a");
}

/** Keep date-only tasks honest; ranges never invent a missing start time. */
export function taskScheduleLabel(
    task: Pick<Task, "startDate" | "startTime" | "dueDate" | "dueTime">,
    now = Date.now(),
): string {
    const { startDate, startTime, dueDate, dueTime } = task;
    if (startDate && dueDate && startDate !== dueDate) {
        return `${taskDateLabel(startDate, now)}${startTime ? `, ${taskTimeLabel(startTime)}` : ""} – ${taskDateLabel(dueDate, now)}${dueTime ? `, ${taskTimeLabel(dueTime)}` : ""}${startTime || dueTime ? " IST" : ""}`;
    }
    const times = [
        ...new Set(
            [
                startDate && startTime ? taskTimeLabel(startTime) : "",
                dueDate && dueTime ? taskTimeLabel(dueTime) : "",
            ].filter(Boolean),
        ),
    ];
    const date = startDate || dueDate;
    if (!date) return "";
    return `${taskDateLabel(date, now)}${times.length ? `, ${times.join(" – ")} IST` : ""}`;
}

export function taskDueLabel(task: Task, now = Date.now()): string {
    if (task.completedAt)
        return `Completed ${formatInTimeZone(task.completedAt, TASK_TIME_ZONE, "d MMM, h:mm a")}`;
    if (!task.dueDate) {
        if (!task.startDate) return "No due date";
        const day = taskDateLabel(task.startDate, now);
        return taskGroup(task, now) === "overdue" ? `Overdue · Started ${day}` : `Starts ${day}`;
    }
    const day = taskDateLabel(task.dueDate, now);
    const label = task.dueTime ? `${day}, ${taskTimeLabel(task.dueTime)}` : `${day} · Any time`;
    return taskGroup(task, now) === "overdue" ? `Overdue · ${label}` : label;
}

export type TaskSort = "manual" | "due" | "newest" | "priority" | "title";
export function sortTasks(tasks: Task[], sort: TaskSort = "due"): Task[] {
    return [...tasks].sort((a, b) => {
        if (sort === "manual") {
            if (a.plannerOrder != null || b.plannerOrder != null) {
                const order =
                    (a.plannerOrder ?? Number.POSITIVE_INFINITY) -
                    (b.plannerOrder ?? Number.POSITIVE_INFINITY);
                if (order) return order;
            }
            return Date.parse(a.createdAt) - Date.parse(b.createdAt);
        }
        if (sort === "title")
            return a.title.localeCompare(b.title, "en-IN", { sensitivity: "base", numeric: true });
        if (sort === "newest") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
        if (sort === "priority") {
            const priority = TASK_PRIORITY_RANK[b.priority] - TASK_PRIORITY_RANK[a.priority];
            if (priority) return priority;
        }
        if (a.completedAt && b.completedAt)
            return Date.parse(b.completedAt) - Date.parse(a.completedAt);
        const dueA = a.dueDate ? `${a.dueDate}T${a.dueTime ?? "23:59"}` : "9999-12-31T23:59";
        const dueB = b.dueDate ? `${b.dueDate}T${b.dueTime ?? "23:59"}` : "9999-12-31T23:59";
        return dueA.localeCompare(dueB) || Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
}
