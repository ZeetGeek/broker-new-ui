"use client";

import { useRef, useState } from "react";

import { formatInTimeZone } from "date-fns-tz";

import { cn } from "@/lib/utils";

import {
    Bell,
    CalendarClock,
    FileText,
    MoreHorizontal,
    Pencil,
    RotateCcw,
    Trash2,
} from "@/components/shared/icons";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    sortTasks,
    type Task,
    TASK_TIME_ZONE,
    taskDateKey,
    taskDateLabel,
    taskDueLabel,
    type TaskSort,
} from "./model";

import styles from "./planner.module.css";

export type TaskRowActions = {
    busy: boolean;
    now: number;
    onOpen: (task: Task) => void;
    onComplete: (task: Task) => void;
    onIntent: (task: Task, intent: string) => void;
    onRestore: (task: Task) => void;
    onRename: (task: Task, title: string) => Promise<boolean>;
};

/** A paper-list line: edit its title or open the full CRM context through its note. */
export function TaskLine({
    task,
    archive = false,
    busy,
    now,
    onOpen,
    onComplete,
    onIntent,
    onRestore,
    onRename,
}: TaskRowActions & { task: Task; archive?: boolean }) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const saving = useRef(false);
    const cancelled = useRef(false);
    const hasContext = !!(
        task.details ||
        task.clientId ||
        task.ownerId ||
        task.propertyId ||
        task.repeat ||
        task.reminders.length
    );
    const overdue =
        !task.completedAt && !task.deletedAt && !!task.dueDate && task.dueDate < taskDateKey(now);
    const save = async () => {
        if (cancelled.current || saving.current) return;
        if (!title.trim() || title.trim() === task.title) {
            setEditing(false);
            return;
        }
        saving.current = true;
        const saved = await onRename(task, title.trim());
        saving.current = false;
        if (saved) setEditing(false);
    };
    return (
        <div
            className={cn(styles.taskLine, task.completedAt && styles.completedLine)}
            data-priority={task.priority}
            data-editing={editing || undefined}
        >
            {!task.deletedAt && (
                <Checkbox
                    className={styles.lineCheck}
                    checked={!!task.completedAt}
                    disabled={busy}
                    aria-label={`${task.completedAt ? "Reopen" : "Complete"} ${task.title}`}
                    onCheckedChange={() => onComplete(task)}
                />
            )}
            {editing ? (
                <form
                    className={styles.inlineEdit}
                    onSubmit={(event) => {
                        event.preventDefault();
                        void save();
                    }}
                >
                    <input
                        autoFocus
                        aria-label="Edit task title"
                        value={title}
                        maxLength={160}
                        disabled={busy}
                        onChange={(event) => setTitle(event.target.value)}
                        onBlur={() => void save()}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                cancelled.current = true;
                                setTitle(task.title);
                                setEditing(false);
                            }
                        }}
                    />
                </form>
            ) : (
                <button
                    type="button"
                    className={styles.lineTitle}
                    title={`${task.title}\n${taskDueLabel(task, now)}`}
                    disabled={busy}
                    onClick={() => {
                        if (archive || task.deletedAt) {
                            onOpen(task);
                            return;
                        }
                        cancelled.current = false;
                        setTitle(task.title);
                        setEditing(true);
                    }}
                >
                    {task.title}
                </button>
            )}
            {overdue && (
                <span
                    className={styles.overdueMark}
                    title={`Overdue · ${taskDateLabel(task.dueDate!, now)}`}
                >
                    <span className="sr-only">Overdue · </span>
                    {formatInTimeZone(`${task.dueDate}T12:00:00+05:30`, TASK_TIME_ZONE, "d MMM")}
                </span>
            )}
            {task.deletedAt ? (
                <button
                    type="button"
                    className={styles.restoreAction}
                    disabled={busy}
                    onClick={() => onRestore(task)}
                    aria-label={`Restore ${task.title}`}
                    title="Restore task"
                >
                    <RotateCcw aria-hidden size={16} />
                </button>
            ) : (
                <>
                    <button
                        type="button"
                        className={styles.noteAction}
                        data-has-context={hasContext || undefined}
                        onClick={() => onOpen(task)}
                        aria-label={`Details for ${task.title}`}
                        title="Task details"
                    >
                        <FileText aria-hidden size={14} />
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <button
                                    type="button"
                                    className={styles.lineAction}
                                    disabled={busy}
                                    aria-label={`Actions for ${task.title}`}
                                />
                            }
                        >
                            <MoreHorizontal aria-hidden size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onOpen(task)}>
                                <FileText aria-hidden />
                                Task details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onIntent(task, "edit")}>
                                <Pencil aria-hidden />
                                Edit task
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onIntent(task, "reschedule")}>
                                <CalendarClock aria-hidden />
                                Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onIntent(task, "reminder")}>
                                <Bell aria-hidden />
                                Edit reminders
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => onIntent(task, "delete")}
                            >
                                <Trash2 aria-hidden />
                                Delete task
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}
        </div>
    );
}

export function TaskArchive({
    tasks,
    tab,
    sort,
    ...actions
}: TaskRowActions & { tasks: Task[]; tab: "completed" | "deleted" | "results"; sort: TaskSort }) {
    const sorted =
        tab === "results" || sort !== "due"
            ? sortTasks(tasks, sort)
            : [...tasks].sort((a, b) =>
                  (b.deletedAt || b.completedAt || b.createdAt).localeCompare(
                      a.deletedAt || a.completedAt || a.createdAt,
                  ),
              );
    return (
        <section
            className={styles.archive}
            aria-label={tab === "results" ? "Matching tasks" : `${tab} tasks`}
        >
            <header className={styles.archiveHeading}>
                <h2>
                    {tab === "deleted"
                        ? "Deleted"
                        : tab === "completed"
                          ? "Completed"
                          : "Matching tasks"}
                </h2>
                <p>
                    {tab === "deleted"
                        ? "Your deleted tasks stay here. Restore one whenever you need it."
                        : tab === "completed"
                          ? "Everything you’ve checked off. You can reopen a task at any time."
                          : `${tasks.length} ${tasks.length === 1 ? "task matches" : "tasks match"} your search and filters, across all dates.`}
                </p>
            </header>
            <ul className={styles.archiveList}>
                {sorted.map((task) => (
                    <li key={task.id}>
                        <TaskLine task={task} archive {...actions} />
                        <small className={styles.archiveDate}>
                            {tab === "deleted"
                                ? `Deleted ${formatInTimeZone(task.deletedAt!, TASK_TIME_ZONE, "d MMM yyyy, h:mm a")}`
                                : tab === "completed"
                                  ? `Completed ${formatInTimeZone(task.completedAt!, TASK_TIME_ZONE, "d MMM yyyy, h:mm a")}`
                                  : taskDueLabel(task, actions.now)}
                        </small>
                    </li>
                ))}
            </ul>
        </section>
    );
}
