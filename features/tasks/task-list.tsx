"use client";

import { useState } from "react";

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
import type { PlannerTaskExtras } from "./planner-model";
import type { TaskQuickChange } from "./quick-actions";
import type { SmartAddCatalogs } from "./smart-add";
import { SmartTaskComposer } from "./smart-composer";
import { TaskActionsMenu } from "./task-actions-menu";
import { TaskHistoryPlanner } from "./task-history-planner";

import styles from "./planner.module.css";

export type TaskRowActions = {
    busy: boolean;
    now: number;
    catalogs: SmartAddCatalogs;
    onOpen: (task: Task) => void;
    onComplete: (task: Task) => void;
    onIntent: (task: Task, intent: string) => void;
    onRestore: (task: Task) => void;
    onRename: (task: Task, title: string, extras?: PlannerTaskExtras) => Promise<boolean>;
    onQuickChange: (task: Task, change: TaskQuickChange) => Promise<boolean>;
};

/** A paper-list line: edit its title or open the full CRM context through its menu. */
export function TaskLine({
    task,
    archive = false,
    showDate = false,
    busy,
    now,
    catalogs,
    onOpen,
    onComplete,
    onIntent,
    onRestore,
    onRename,
    onQuickChange,
}: TaskRowActions & { task: Task; archive?: boolean; showDate?: boolean }) {
    const [editing, setEditing] = useState(false);
    const overdue = !task.deletedAt && taskGroup(task, now) === "overdue";
    const date = showDate ? task.dueDate || task.startDate : null;
    if (editing) {
        return (
            <SmartTaskComposer
                key={task.id}
                task={task}
                date={task.dueDate}
                busy={busy}
                now={now}
                catalogs={catalogs}
                onSave={(title, extras) => onRename(task, title, extras)}
                onCancel={() => setEditing(false)}
            />
        );
    }

    return (
        <div
            className={cn(styles.taskLine, task.completedAt && styles.completedLine)}
            data-priority={task.priority}
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
}: TaskRowActions & {
    tasks: Task[];
    tab: "completed" | "deleted" | "overdue" | "results";
    sort: TaskSort;
}) {
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
