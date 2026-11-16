import { type Task, type TaskPriority, taskSchema } from "./model";
import { shiftTaskDate, taskDaysBetween, type TaskRepeat } from "./recurrence";

export type TaskQuickChange = {
    title?: string;
    dueDate?: string | null;
    dueTime?: string | null;
    priority?: TaskPriority;
    priorityAt?: number | null;
    reminders?: number[];
    repeat?: TaskRepeat | null;
    clientId?: string | null;
    ownerId?: string | null;
    propertyId?: string | null;
};

const sameRepeat = (a: TaskRepeat | null, b: TaskRepeat | null) =>
    JSON.stringify(a) === JSON.stringify(b);

export function changeTaskQuickly(
    tasks: Task[],
    id: string,
    change: TaskQuickChange,
    now = Date.now(),
): Task[] {
    const original = tasks.find((task) => task.id === id);
    if (!original || original.deletedAt) throw new Error("This task is no longer available.");
    const defined = Object.fromEntries(
        Object.entries(change).filter(([, value]) => value !== undefined),
    ) as TaskQuickChange;
    return tasks.map((task) => {
        if (task.id !== id) return task;
        const updated = { ...task, ...defined, updatedAt: new Date(now).toISOString() };
        const dateChanged = change.dueDate !== undefined && change.dueDate !== task.dueDate;
        if (dateChanged) {
            const date = change.dueDate ?? null;
            updated.startDate = date
                ? task.dueDate && task.startDate
                    ? shiftTaskDate(task.startDate, taskDaysBetween(task.dueDate, date))
                    : task.startDate && task.startDate <= date
                      ? task.startDate
                      : date
                : task.startDate;
            updated.startReminderEnabledAt = new Date(now).toISOString();
        }
        // An unchanged series keeps its anchor so month-end repeats stay on the 31st.
        const repeatChanged =
            change.repeat !== undefined && !sameRepeat(change.repeat, task.repeat);
        if (dateChanged || repeatChanged)
            updated.repeatAnchor = updated.repeat ? updated.dueDate || updated.startDate : null;
        if (!updated.dueDate) updated.dueTime = null;
        if (!updated.dueTime) updated.reminders = [];
        if (
            updated.dueTime &&
            updated.startTime &&
            updated.startDate === updated.dueDate &&
            updated.startTime > updated.dueTime
        )
            updated.startTime = updated.dueTime;
        const scheduleChanged =
            updated.dueDate !== original.dueDate || updated.dueTime !== original.dueTime;
        if (scheduleChanged) updated.deliveredReminderKeys = [];
        const parsed = taskSchema.safeParse(updated);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        return parsed.data;
    });
}
