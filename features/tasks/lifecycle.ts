import { type Task, taskDateKey } from "./model";
import { nextRepeatDate, shiftTaskDate, taskDaysBetween } from "./recurrence";

export function nextTaskDates(task: Task, now = Date.now()) {
    const scheduled = task.dueDate || task.startDate;
    if (!task.repeat || !scheduled) return null;
    const anchor = task.repeatAnchor || scheduled;
    const after = scheduled > taskDateKey(now) ? scheduled : taskDateKey(now);
    const next = nextRepeatDate(anchor, after, task.repeat);
    if (!next) return null;
    const shift = taskDaysBetween(scheduled, next);
    const startDate = task.startDate ? shiftTaskDate(task.startDate, shift) : null;
    if (task.startDate && !startDate) return null;
    return { startDate, dueDate: task.dueDate ? next : null, repeatAnchor: anchor };
}

/** One transaction completes the occurrence and creates the next. Reopening
 * rolls back an untouched successor; changed/completed successors are protected. */
export function setTaskCompleted(
    tasks: Task[],
    id: string,
    completed: boolean,
    now = Date.now(),
    nextId = crypto.randomUUID(),
): Task[] {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.deletedAt || !!task.completedAt === completed) return tasks;
    const at = new Date(now).toISOString();
    const successor = tasks.find((item) => item.repeatFromId === id);
    if (!completed) {
        if (
            successor &&
            (successor.deletedAt ||
                successor.completedAt ||
                successor.updatedAt !== successor.createdAt)
        ) {
            throw new Error(
                "The next occurrence has already been changed. Keep this occurrence completed and work on the next task.",
            );
        }
        return tasks
            .filter((item) => item.id !== successor?.id)
            .map((item) => (item.id === id ? { ...item, completedAt: null, updatedAt: at } : item));
    }
    const finished = tasks.map((item) =>
        item.id === id ? { ...item, completedAt: at, updatedAt: at } : item,
    );
    const dates = nextTaskDates(task, now);
    if (!dates || successor) return finished;
    if (tasks.some((item) => item.id === nextId))
        throw new Error("Couldn’t create the next occurrence. Try again.");
    return [
        ...finished,
        {
            ...task,
            ...dates,
            id: nextId,
            repeatFromId: task.id,
            repeat: task.repeat ? { ...task.repeat, weekdays: [...task.repeat.weekdays] } : null,
            reminders: [...task.reminders],
            deliveredReminderKeys: [],
            createdAt: at,
            updatedAt: at,
            completedAt: null,
        },
    ];
}
