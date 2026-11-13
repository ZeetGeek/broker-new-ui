import {
    newTaskDraft,
    sortTasks,
    type Task,
    taskDateKey,
    taskReminders,
    taskSchema,
    type TaskSort,
} from "./model";
import { taskListId, type TaskNotebook } from "./notebook-model";
import { shiftTaskDate, taskDaysBetween } from "./recurrence";

export type PlannerDragPreview = {
    taskId: string;
    date: string | null;
    listId?: string;
    beforeId?: string;
};

/** Project the landing position without changing a task's dates, reminders or CRM links. */
export function plannerColumnTasks(
    tasks: Task[],
    date: string | null,
    listId: string | undefined,
    notebook: TaskNotebook,
    today: string,
    sort: TaskSort,
    preview?: PlannerDragPreview | null,
): Task[] {
    const rows = sortPlannerTasks(
        tasks.filter(
            (task) =>
                plannerDate(task, today) === date &&
                (date !== null || taskListId(task, notebook) === listId),
        ),
        sort,
    );
    const dragged = preview && tasks.find((task) => task.id === preview.taskId);
    if (!preview || !dragged) return rows;
    const projected = rows.filter((task) => task.id !== preview.taskId);
    if (preview.date !== date || (date === null && preview.listId !== listId)) return projected;
    const before = projected.findIndex((task) => task.id === preview.beforeId);
    projected.splice(before < 0 ? projected.length : before, 0, dragged);
    return projected;
}

/** Carry unfinished work into today's view without rewriting its real deadline. */
export function plannerDate(task: Task, today: string): string | null {
    if (!task.dueDate) return null;
    return !task.completedAt && task.dueDate < today ? today : task.dueDate;
}

export function sortPlannerTasks(tasks: Task[], sort: TaskSort): Task[] {
    const sorted = sortTasks(tasks, sort);
    if (sort !== "due") return sorted;
    const fallback = new Map(sorted.map((task, index) => [task.id, index]));
    return sorted.sort(
        (a, b) => (a.plannerOrder ?? fallback.get(a.id)!) - (b.plannerOrder ?? fallback.get(b.id)!),
    );
}

export function setTaskDeleted(
    tasks: Task[],
    id: string,
    deleted: boolean,
    now = Date.now(),
): Task[] {
    const at = new Date(now).toISOString();
    return tasks.map((task) =>
        task.id === id
            ? {
                  ...task,
                  deletedAt: deleted ? at : null,
                  // Restoring a task never sends a burst of missed reminders.
                  startReminderEnabledAt: deleted ? task.startReminderEnabledAt : at,
                  deliveredReminderKeys: deleted
                      ? task.deliveredReminderKeys
                      : [
                            ...new Set([
                                ...task.deliveredReminderKeys,
                                ...taskReminders(task)
                                    .filter(
                                        (reminder) => reminder.at && Date.parse(reminder.at) <= now,
                                    )
                                    .map((reminder) => reminder.key),
                            ]),
                        ],
                  updatedAt: at,
              }
            : task,
    );
}

export function createPlannerTask(
    title: string,
    date: string | null,
    now = Date.now(),
    id = crypto.randomUUID(),
    listId?: string,
): Task {
    const draft = newTaskDraft(now);
    const at = new Date(now).toISOString();
    return taskSchema.parse({
        id,
        title,
        details: "",
        startDate: date || draft.startDate,
        startTime: draft.startTime,
        startReminderEnabledAt: at,
        dueDate: date,
        dueTime: null,
        reminders: [],
        clientId: null,
        ownerId: null,
        propertyId: null,
        priority: "medium",
        completedAt: null,
        deletedAt: null,
        listId,
        createdAt: at,
        updatedAt: at,
        deliveredReminderKeys: [],
    });
}

/** Move one occurrence, preserve its time/range, and persist manual order. */
export function movePlannerTask(
    tasks: Task[],
    id: string,
    date: string | null,
    beforeId?: string,
    now = Date.now(),
    listId?: string,
): Task[] {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.deletedAt) return tasks;
    const today = taskDateKey(now);
    const changedDate = plannerDate(task, today) !== date;
    const at = new Date(now).toISOString();
    let moved: Task = {
        ...task,
        updatedAt: at,
        listId: date === null && listId ? listId : task.listId,
    };
    if (changedDate) {
        const shift = task.dueDate && date ? taskDaysBetween(task.dueDate, date) : 0;
        const startDate = date
            ? task.dueDate && task.startDate
                ? shiftTaskDate(task.startDate, shift)
                : task.startDate && task.startDate <= date
                  ? task.startDate
                  : date
            : task.startDate;
        moved = {
            ...moved,
            startDate,
            dueDate: date,
            dueTime: date ? task.dueTime : null,
            reminders: date ? task.reminders : [],
            repeatAnchor: task.repeat ? date || startDate : null,
            startReminderEnabledAt: at,
            deliveredReminderKeys: [],
        };
        // Surface invalid repeat end dates instead of dropping data or the task.
        if (!taskSchema.safeParse(moved).success) {
            throw new Error(
                "This date conflicts with the task's schedule. Use Reschedule to adjust its dates or repeat end date.",
            );
        }
    }
    const destination = sortPlannerTasks(
        tasks.filter(
            (item) =>
                !item.deletedAt &&
                item.id !== id &&
                plannerDate(item, today) === date &&
                (date !== null || !listId || item.listId === listId),
        ),
        "due",
    );
    const before = destination.findIndex((item) => item.id === beforeId);
    destination.splice(before < 0 ? destination.length : before, 0, moved);
    const positions = new Map(destination.map((item, index) => [item.id, index]));
    return tasks.map((item) => {
        const next = item.id === id ? moved : item;
        return positions.has(next.id) ? { ...next, plannerOrder: positions.get(next.id)! } : next;
    });
}
