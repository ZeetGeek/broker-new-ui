import toast from "@/components/shared/app-toast";

import { nextTaskDates, setTaskCompleted } from "./lifecycle";
import type { Task } from "./model";

export function showTaskCompletedToast(
    task: Task,
    now: number,
    update: (change: (latest: Task[]) => Task[]) => Promise<unknown>,
) {
    if (task.completedAt) {
        toast.success("Task reopened", { id: `task-completed-${task.id}` });
        return;
    }
    toast.message("task-completed", {
        id: `task-completed-${task.id}`,
        description: nextTaskDates(task, now)
            ? "The next occurrence has been added."
            : "One less thing on your list.",
        detail: task.title,
        action: {
            label: "Undo",
            onClick: () => {
                // The lifecycle operation also removes an untouched repeat successor.
                // It rejects reopening if that successor has already been worked on.
                void update((latest) => {
                    const current = latest.find((item) => item.id === task.id);
                    if (!current || current.deletedAt)
                        throw new Error("This task is no longer available to reopen.");
                    return setTaskCompleted(latest, task.id, false);
                }).then(
                    () => toast.success("Task reopened"),
                    (error: unknown) =>
                        toast.error("Could not undo task completion", {
                            description:
                                error instanceof Error
                                    ? error.message
                                    : "Open the task and try again.",
                        }),
                );
            },
        },
    });
}
