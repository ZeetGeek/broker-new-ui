"use client";

import { useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { notifyWorkflowSaved } from "@/lib/workflows/refresh";
import type { WorkflowTarget } from "@/lib/workflows/target";

import { EmptyState } from "@/components/empty-state";
import toast from "@/components/shared/app-toast";
import { List, RefreshCw } from "@/components/shared/icons";
import { useWorkflowWorking } from "@/components/shared/workflow-context";
import { Button } from "@/components/ui/button";

import { nextTaskDates, setTaskCompleted } from "@/features/tasks/lifecycle";
import type { TaskDraft } from "@/features/tasks/model";
import { setTaskDeleted } from "@/features/tasks/planner-model";
import { TASK_CATALOGS_QUERY_KEY, useTaskCatalogs } from "@/features/tasks/task-catalogs";
import { TaskDeleteDialog, TaskDetail } from "@/features/tasks/task-detail";
import { TaskForm } from "@/features/tasks/task-form";
import { type TaskDraftMode, taskFromDraft } from "@/features/tasks/task-from-draft";
import { TaskPanel } from "@/features/tasks/task-panel";
import { type TaskUpdater, useTasks } from "@/features/tasks/task-store";
import { useAppSelector } from "@/store/hooks";

type Target = Extract<WorkflowTarget, { kind: "task" }>;

export function TaskWorkflow({ target, onClose }: { target: Target; onClose: () => void }) {
    const accountId = useAppSelector((state) => state.auth.user?.id) ?? "design-preview";
    const { tasks, isLoading, error: loadError, busy, update, reset } = useTasks(accountId);
    const catalogs = useTaskCatalogs();
    const client = useQueryClient();
    const [view, setView] = useState<{ mode: Target["mode"]; id?: string }>({
        mode: target.mode,
        id: target.id,
    });
    useWorkflowWorking(view.mode !== "detail" || busy);
    const [error, setError] = useState("");
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 15_000);
        return () => window.clearInterval(timer);
    }, []);
    const task = tasks.find((item) => item.id === view.id);
    const showDetail = (id: string) => {
        setError("");
        setView({ mode: "detail", id });
    };
    const change = async (updater: TaskUpdater, message?: string) => {
        if (busy) return false;
        setError("");
        try {
            await update(updater);
            notifyWorkflowSaved("task");
            if (message) toast.success(message);
            return true;
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : "Your change couldn’t be saved. Try again.",
            );
            return false;
        }
    };
    const retry = () => {
        void reset().catch((failure) =>
            setError(failure instanceof Error ? failure.message : "Could not reload tasks."),
        );
        void client.invalidateQueries({ queryKey: TASK_CATALOGS_QUERY_KEY });
    };
    const saveDraft = async (draft: TaskDraft) => {
        if (busy) return;
        const id = view.mode === "create" ? crypto.randomUUID() : view.id!;
        const at = Date.now();
        const saved = await change(
            (latest) => {
                const editing =
                    view.mode === "create" ? undefined : latest.find((item) => item.id === id);
                if (view.mode !== "create" && (!editing || editing.deletedAt))
                    throw new Error("This task is no longer available to edit.");
                const next = taskFromDraft(draft, {
                    editing,
                    mode: view.mode as TaskDraftMode,
                    catalogs,
                    now: at,
                    id,
                });
                return editing
                    ? latest.map((item) => (item.id === id ? next : item))
                    : [next, ...latest];
            },
            view.mode === "create"
                ? "Task created"
                : view.mode === "reschedule"
                  ? "Task rescheduled"
                  : view.mode === "reminder"
                    ? "Reminder updated"
                    : "Task updated",
        );
        if (saved) showDetail(id);
    };

    if ((loadError && !tasks.length) || (view.mode === "create" && catalogs.loadError))
        return (
            <TaskPanel title="Could not load task data" onClose={onClose}>
                <EmptyState
                    size="card"
                    variant="error"
                    icon={List}
                    heading="Could not load tasks"
                    description="Check your connection and try again."
                    action={{ label: "Try again", icon: RefreshCw, onClick: retry }}
                />
            </TaskPanel>
        );
    if (isLoading || (view.mode === "create" && !catalogs.ready))
        return (
            <TaskPanel title="Loading task…" onClose={onClose}>
                <p role="status" className="body-sm text-ink-muted">
                    Loading task and linked records…
                </p>
                <Button variant="outline" onClick={retry}>
                    Retry
                </Button>
            </TaskPanel>
        );
    if (view.mode === "create")
        return (
            <TaskForm
                mode="create"
                busy={busy}
                error={error}
                onSave={saveDraft}
                onClose={onClose}
                prefill={{
                    title: (target.prefill.title ?? "").slice(0, 160),
                    clientId: catalogs.clients.some((item) => item.id === target.prefill.clientId)
                        ? target.prefill.clientId
                        : "",
                    ownerId: catalogs.owners.some((item) => item.id === target.prefill.ownerId)
                        ? target.prefill.ownerId
                        : "",
                    propertyId: catalogs.properties.some(
                        (item) => item.id === target.prefill.propertyId,
                    )
                        ? target.prefill.propertyId
                        : "",
                }}
            />
        );
    if (!task)
        return (
            <TaskPanel title="Task not found" onClose={onClose}>
                <EmptyState
                    size="card"
                    icon={List}
                    heading="Task no longer available"
                    description="It may have been deleted. Open Tasks to choose another task."
                    action={{ label: "Open tasks", icon: List, href: "/broker/tasks" }}
                />
            </TaskPanel>
        );
    if (
        !task.deletedAt &&
        (view.mode === "edit" || view.mode === "reschedule" || view.mode === "reminder")
    )
        return (
            <TaskForm
                key={`${view.mode}-${task.id}`}
                task={task}
                mode={view.mode}
                busy={busy}
                error={error}
                onSave={saveDraft}
                onClose={() => showDetail(task.id)}
            />
        );
    if (!task.deletedAt && view.mode === "delete")
        return (
            <TaskDeleteDialog
                task={task}
                busy={busy}
                error={error}
                onClose={() => showDetail(task.id)}
                onConfirm={() =>
                    void (async () => {
                        if (
                            await change(
                                (latest) => setTaskDeleted(latest, task.id, true),
                                "Task moved to Deleted",
                            )
                        )
                            showDetail(task.id);
                    })()
                }
            />
        );
    return (
        <TaskDetail
            task={task}
            now={now}
            busy={busy}
            error={error}
            onClose={onClose}
            onComplete={() =>
                void change(
                    (latest) =>
                        setTaskCompleted(
                            latest,
                            task.id,
                            !task.completedAt,
                            Date.now(),
                            crypto.randomUUID(),
                        ),
                    task.completedAt
                        ? "Task reopened"
                        : nextTaskDates(task)
                          ? "Task completed · next occurrence added"
                          : "Task completed",
                )
            }
            onRestore={() =>
                void change((latest) => setTaskDeleted(latest, task.id, false), "Task restored")
            }
            onIntent={(mode) => {
                if (["edit", "reschedule", "reminder", "delete"].includes(mode)) {
                    setError("");
                    setView({ mode: mode as Target["mode"], id: task.id });
                }
            }}
        />
    );
}
