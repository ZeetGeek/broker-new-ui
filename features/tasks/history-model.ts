import { sortTasks, type Task, taskDateKey, taskMatchesTab, type TaskSort } from "./model";

export type TaskHistoryTab = "completed" | "deleted" | "overdue";
export type TaskHistoryDay = { date: string; tasks: Task[] };

function historyDayKey(task: Task, tab: TaskHistoryTab): string {
    if (tab === "overdue") return task.dueDate || task.startDate || "";
    const stamp = tab === "completed" ? task.completedAt! : task.deletedAt!;
    return taskDateKey(Date.parse(stamp));
}

/** History follows the event's India calendar date, independently of the task's schedule. */
export function groupTaskHistory(
    tasks: Task[],
    tab: TaskHistoryTab,
    sort: TaskSort = "due",
    now = Date.now(),
): TaskHistoryDay[] {
    const timestamp = (task: Task) => (tab === "completed" ? task.completedAt! : task.deletedAt!);
    const inTab = tasks.filter((task) => taskMatchesTab(task, tab, false, now));
    const sorted =
        sort === "due"
            ? inTab.sort((a, b) => {
                  if (tab === "overdue") {
                      const left = historyDayKey(a, tab);
                      const right = historyDayKey(b, tab);
                      return (
                          left.localeCompare(right) ||
                          (a.dueTime || "").localeCompare(b.dueTime || "") ||
                          a.title.localeCompare(b.title)
                      );
                  }
                  return timestamp(b).localeCompare(timestamp(a));
              })
            : sortTasks(inTab, sort);
    const days = new Map<string, Task[]>();
    for (const task of sorted) {
        const date = historyDayKey(task, tab);
        if (!date) continue;
        const rows = days.get(date) ?? [];
        rows.push(task);
        days.set(date, rows);
    }
    return [...days.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, tasks]) => ({ date, tasks }));
}
