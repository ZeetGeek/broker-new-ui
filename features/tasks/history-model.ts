import { sortTasks, type Task, taskDateKey, taskMatchesTab, type TaskSort } from "./model";

export type TaskHistoryTab = "completed" | "deleted";
export type TaskHistoryDay = { date: string; tasks: Task[] };

/** History follows the event's India calendar date, independently of the task's schedule. */
export function groupTaskHistory(
    tasks: Task[],
    tab: TaskHistoryTab,
    sort: TaskSort = "due",
): TaskHistoryDay[] {
    const timestamp = (task: Task) => (tab === "completed" ? task.completedAt! : task.deletedAt!);
    const sorted =
        sort === "due"
            ? tasks
                  .filter((task) => taskMatchesTab(task, tab))
                  .sort((a, b) => timestamp(b).localeCompare(timestamp(a)))
            : sortTasks(
                  tasks.filter((task) => taskMatchesTab(task, tab)),
                  sort,
              );
    const days = new Map<string, Task[]>();
    for (const task of sorted) {
        const date = taskDateKey(Date.parse(timestamp(task)));
        const rows = days.get(date) ?? [];
        rows.push(task);
        days.set(date, rows);
    }
    return [...days.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, tasks]) => ({ date, tasks }));
}
