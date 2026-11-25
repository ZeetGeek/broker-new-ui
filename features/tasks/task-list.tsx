"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { CardLink } from "@/components/shared/card-link";
import { IconButton } from "@/components/shared/icon-button";
import { AlertCircle, Calendar, MoreHorizontal, RotateCcw } from "@/components/shared/icons";
import {
    mobileActionClass,
    MobileActionDrawer,
    mobileActionGroupClass,
} from "@/components/shared/mobile-action-drawer";
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
import { QuickAddComposer } from "./quick-add-composer";
import { type QuickAddCatalogs, taskRowTitle } from "./quick-add-parse";
import { TaskActionsMenu } from "./task-actions-menu";
import { TaskHistoryPlanner } from "./task-history-planner";

import styles from "./planner.module.css";

export type TaskRowActions = {
    busy: boolean;
    now: number;
    catalogs: QuickAddCatalogs;
    onOpen: (task: Task) => void;
    onComplete: (task: Task) => void;
    onIntent: (task: Task, intent: string) => void;
    onRestore: (task: Task) => void;
    /** Inline edit save; an empty title moves the task to Deleted. */
    onRename: (task: Task, change: TaskQuickChange) => Promise<boolean>;
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
    const mobile = useMobileMenu();
    const [editing, setEditing] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const afterMenuClose = useRef<(() => void) | null>(null);
    const titleRef = useRef<HTMLButtonElement>(null);
    const refocusRef = useRef(false);
    useEffect(() => {
        if (editing || !refocusRef.current) return;
        refocusRef.current = false;
        titleRef.current?.focus({ preventScroll: true });
    }, [editing]);
    const overdue = !task.deletedAt && taskGroup(task, now) === "overdue";
    const date = showDate ? task.dueDate || task.startDate : null;
    if (editing) {
        return (
            <QuickAddComposer
                key={task.id}
                task={task}
                date={task.startDate}
                busy={busy}
                now={now}
                catalogs={catalogs}
                onSave={(change) => onRename(task, change)}
                onClose={(restoreFocus) => {
                    refocusRef.current = restoreFocus;
                    setEditing(false);
                }}
            />
        );
    }
    const rowTitle = taskRowTitle(
        task.title,
        {
            propertyId: task.propertyId,
            clientId: task.clientId,
            ownerId: task.ownerId,
        },
        catalogs,
        now,
        task.startDate,
    );
    const deletedTaskMenuTrigger = (
        <IconButton
            size="xs"
            type="button"
            appearance={mobile ? "ghost" : "outline"}
            className={styles.lineAction}
            disabled={busy}
            aria-label={`Actions for ${rowTitle}`}
            title="Task actions"
        >
            <MoreHorizontal aria-hidden size={14} />
        </IconButton>
    );

    return (
        <div
            data-linked-card
            className={cn(styles.taskLine, task.completedAt && styles.completedLine)}
            data-priority={task.priority}
            onContextMenu={(event) => {
                if (busy) return;
                event.preventDefault();
                setMenuOpen(true);
            }}
        >
            {!busy ? (
                <CardLink
                    href={`/broker/tasks?view=detail&task=${encodeURIComponent(task.id)}`}
                    label={`Open ${rowTitle}`}
                    onOpen={() => onOpen(task)}
                />
            ) : null}
            {!task.deletedAt && (
                <Checkbox
                    className={styles.lineCheck}
                    checked={!!task.completedAt}
                    disabled={busy}
                    aria-label={`${task.completedAt ? "Reopen" : "Complete"} ${rowTitle}`}
                    onCheckedChange={() => onComplete(task)}
                />
            )}
            <button
                ref={titleRef}
                type="button"
                data-task-title
                className={styles.lineTitle}
                title={`${rowTitle}\n${taskDueLabel(task, now)}\nDouble-click to edit`}
                disabled={busy}
                onClick={(event) => {
                    if (archive || task.deletedAt) {
                        onOpen(task);
                        return;
                    }
                    // Touch and keyboard activate editing; mouse retains double-click editing.
                    if (event.detail === 0 || window.matchMedia("(pointer: coarse)").matches)
                        setEditing(true);
                }}
                onDoubleClick={() => {
                    if (archive || task.deletedAt || busy) return;
                    setEditing(true);
                }}
            >
                <span data-card-title>{rowTitle}</span>
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
                mobile ? (
                    <MobileActionDrawer
                        open={menuOpen}
                        onOpenChange={setMenuOpen}
                        onOpenChangeComplete={(nextOpen) => {
                            if (nextOpen) return;
                            const action = afterMenuClose.current;
                            afterMenuClose.current = null;
                            action?.();
                        }}
                        title="Task actions"
                        description={rowTitle}
                        trigger={deletedTaskMenuTrigger}
                    >
                        <div className={mobileActionGroupClass}>
                            <button
                                type="button"
                                className={mobileActionClass}
                                disabled={busy}
                                onClick={() => {
                                    afterMenuClose.current = () => onRestore(task);
                                    setMenuOpen(false);
                                }}
                            >
                                <RotateCcw aria-hidden />
                                Restore task
                            </button>
                        </div>
                    </MobileActionDrawer>
                ) : (
                    <DropdownMenu modal={false} open={menuOpen} onOpenChange={setMenuOpen}>
                        <DropdownMenuTrigger render={deletedTaskMenuTrigger} />
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled={busy} onClick={() => onRestore(task)}>
                                <RotateCcw aria-hidden />
                                Restore task
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            ) : (
                <TaskActionsMenu
                    task={task}
                    busy={busy}
                    now={now}
                    onQuickChange={onQuickChange}
                    onOpen={onOpen}
                    onIntent={onIntent}
                    onComplete={onComplete}
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
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
