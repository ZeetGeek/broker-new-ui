import { type Task, type TaskPriority, taskSchema } from "./model";
import { shiftTaskDate, taskDaysBetween } from "./recurrence";

export type TaskQuickChange = {
    dueDate?: string | null;
    dueTime?: string | null;
    priority?: TaskPriority;
    reminders?: number[];
};

export function changeTaskQuickly(
    tasks: Task[],
    id: string,
    change: TaskQuickChange,
    now = Date.now(),
): Task[] {
    const original = tasks.find((task) => task.id === id);
    if (!original || original.deletedAt) throw new Error("This task is no longer available.");
    return tasks.map((task) => {
        if (task.id !== id) return task;
        const updated = { ...task, ...change, updatedAt: new Date(now).toISOString() };
        if (change.dueDate !== undefined && change.dueDate !== task.dueDate) {
            const date = change.dueDate;
            updated.startDate = date
                ? task.dueDate && task.startDate
                    ? shiftTaskDate(task.startDate, taskDaysBetween(task.dueDate, date))
                    : task.startDate && task.startDate <= date
                      ? task.startDate
                      : date
                : task.startDate;
            updated.repeatAnchor = task.repeat ? date || updated.startDate : null;
            updated.startReminderEnabledAt = new Date(now).toISOString();
        }
        if (!updated.dueDate) updated.dueTime = null;
        if (!updated.dueTime) updated.reminders = [];
        const scheduleChanged =
            updated.dueDate !== original.dueDate || updated.dueTime !== original.dueTime;
        if (scheduleChanged) updated.deliveredReminderKeys = [];
        const parsed = taskSchema.safeParse(updated);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        return parsed.data;
    });
}
