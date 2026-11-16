"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { AlertCircle, Calendar, MoreHorizontal, RotateCcw } from "@/components/shared/icons";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
    sortTasks,
    type Task,
    taskDateLabel,
    taskDueLabel,
    taskGroup,
    type TaskSort,
} from "./model";
import type { TaskQuickChange } from "./quick-actions";
import { TaskActionsMenu } from "./task-actions-menu";
import { TaskHistoryPlanner } from "./task-history-planner";
import { TaskTitleInput } from "./task-title-input";

import styles from "./planner.module.css";

export type TaskRowActions = {
    busy: boolean;
    now: number;
    onOpen: (task: Task) => void;
    onComplete: (task: Task) => void;
    onIntent: (task: Task, intent: string) => void;
    onRestore: (task: Task) => void;
    onRename: (task: Task, title: string) => Promise<boolean>;
    onQuickChange: (task: Task, change: TaskQuickChange) => Promise<boolean>;
};

/** A paper-list line: edit its title or open the full CRM context through its menu. */
export function TaskLine({
    task,
    archive = false,
    showDate = false,
    busy,
    now,
    onOpen,
    onComplete,
    onIntent,
    onRestore,
    onRename,
    onQuickChange,
}: TaskRowActions & { task: Task; archive?: boolean; showDate?: boolean }) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const saving = useRef(false);
    const cancelled = useRef(false);
    const overdue = !task.deletedAt && taskGroup(task, now) === "overdue";
    const date = showDate ? task.dueDate || task.startDate : null;
    const save = async (submit = false) => {
        if (cancelled.current || saving.current) return;
        if ((!title.trim() && !submit) || title.trim() === task.title) {
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
                        void save(true);
                    }}
                >
                    <TaskTitleInput
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
                    data-task-title
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
                    {date && (
                        <small className={styles.listTaskDate}>
                            <Calendar aria-hidden size={12} />
                            <span>
                                {task.dueDate ? "Due" : "Starts"}{" "}
                                <time dateTime={date}>{taskDateLabel(date, now)}</time>
                            </span>
                        </small>
                    )}
                </button>
            )}
            {overdue && (
                <Tooltip>
                    <TooltipTrigger render={<span className={styles.overdueMark} tabIndex={0} />}>
                        <AlertCircle aria-hidden size={16} />
                        <span className="sr-only">Overdue</span>
                    </TooltipTrigger>
                    <TooltipContent>Overdue — complete or reschedule this task</TooltipContent>
                </Tooltip>
            )}
            {task.deletedAt ? (
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger
                        render={
                            <button
                                type="button"
                                className={styles.lineAction}
                                disabled={busy}
                                aria-label={`Actions for ${task.title}`}
                                title="Task actions"
                            />
                        }
                    >
                        <MoreHorizontal aria-hidden size={14} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled={busy} onClick={() => onRestore(task)}>
                            <RotateCcw aria-hidden />
                            Restore task
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <TaskActionsMenu
                    task={task}
                    busy={busy}
                    now={now}
                    onQuickChange={onQuickChange}
                    onOpen={onOpen}
                    onIntent={onIntent}
                    onComplete={onComplete}
                />
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
    if (tab !== "results") {
        return (
            <TaskHistoryPlanner
                key={tab}
                tasks={tasks}
                tab={tab}
                sort={sort}
                now={actions.now}
                renderTask={(task) => <TaskLine task={task} archive {...actions} />}
            />
        );
    }
    const sorted = sortTasks(tasks, sort);
    return (
        <section className={styles.archive} aria-label="Matching tasks">
            <header className={styles.archiveHeading}>
                <h2 className="h5">Matching tasks</h2>
                <p>
                    {`${tasks.length} ${tasks.length === 1 ? "task matches" : "tasks match"} your search and filters, across all dates.`}
                </p>
            </header>
            <ul className={styles.archiveList}>
                {sorted.map((task) => (
                    <li key={task.id}>
                        <TaskLine task={task} archive {...actions} />
                        <small className={styles.archiveDate}>
                            {taskDueLabel(task, actions.now)}
                        </small>
                    </li>
                ))}
            </ul>
        </section>
    );
}
