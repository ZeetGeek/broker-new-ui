import {
    isTaskTime,
    newTaskDraft,
    sortTasks,
    type Task,
    taskDateKey,
    type TaskPriority,
    taskReminders,
    taskSchema,
    type TaskSort,
} from "./model";
import { taskListId, type TaskNotebook } from "./notebook-model";
import { shiftTaskDate, taskDaysBetween, type TaskRepeat } from "./recurrence";

export type PlannerTaskExtras = {
    priority?: TaskPriority;
    priorityAt?: number | null;
    startTime?: string | null;
    dueDate?: string | null;
    dueTime?: string | null;
    repeat?: TaskRepeat | null;
    reminders?: number[];
    clientId?: string | null;
    ownerId?: string | null;
    propertyId?: string | null;
};

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

/** Keep tasks on their start day; due is an optional deadline on top. */
export function plannerDate(task: Task, _today: string): string | null {
    return task.startDate;
}

export function countPopulatedPlannerDays(tasks: Task[], today: string): number {
    const dates = new Set<string>();
    for (const task of tasks) {
        const date = plannerDate(task, today);
        if (date) dates.add(date);
    }
    return dates.size;
}

export function sortPlannerTasks(tasks: Task[], sort: TaskSort): Task[] {
    return sortTasks(tasks, sort);
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
    extras: PlannerTaskExtras = {},
): Task {
    const draft = newTaskDraft(now);
    const at = new Date(now).toISOString();
    // `date` is the planner column: a calendar day, or null for Someday (unscheduled).
    const startDate = date;
    const startTime =
        extras.startTime && isTaskTime(extras.startTime)
            ? extras.startTime
            : date !== null
              ? draft.startTime
              : null;
    const dueDate = extras.dueDate ?? null;
    const dueTime = dueDate && extras.dueTime && isTaskTime(extras.dueTime) ? extras.dueTime : null;
    // Keep start ≤ due on the same day when both times are set.
    const safeStartTime =
        dueTime && startDate === dueDate && startTime && startTime > dueTime ? dueTime : startTime;
    const repeat = extras.repeat ?? null;
    return taskSchema.parse({
        id,
        title,
        details: "",
        startDate,
        startTime: safeStartTime,
        startReminderEnabledAt: at,
        repeat,
        repeatAnchor: repeat ? dueDate || startDate : null,
        dueDate,
        dueTime,
        reminders: dueDate && dueTime ? [...new Set(extras.reminders ?? [])] : [],
        clientId: extras.clientId ?? null,
        ownerId: extras.ownerId ?? null,
        propertyId: extras.propertyId ?? null,
        priority: extras.priority ?? draft.priority,
        priorityAt: extras.priorityAt ?? null,
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
        const shift = task.startDate && date ? taskDaysBetween(task.startDate, date) : 0;
        const dueDate =
            date && task.dueDate ? shiftTaskDate(task.dueDate, shift) : date ? task.dueDate : null;
        moved = {
            ...moved,
            startDate: date,
            startTime: date ? task.startTime : null,
            dueDate,
            dueTime: dueDate ? task.dueTime : null,
            reminders: dueDate && task.dueTime ? task.reminders : [],
            repeatAnchor: task.repeat ? dueDate || date : null,
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
        "manual",
    );
    const before = destination.findIndex((item) => item.id === beforeId);
    destination.splice(before < 0 ? destination.length : before, 0, moved);
    const positions = new Map(destination.map((item, index) => [item.id, index]));
    return tasks.map((item) => {
        const next = item.id === id ? moved : item;
        return positions.has(next.id) ? { ...next, plannerOrder: positions.get(next.id)! } : next;
    });
}
