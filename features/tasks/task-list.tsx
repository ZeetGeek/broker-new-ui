"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import {
    AlertCircle,
    Calendar,
    Clock,
    Hash,
    MoreHorizontal,
    Repeat,
    RotateCcw,
    UserRound,
} from "@/components/shared/icons";
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
    taskTimeLabel,
} from "./model";
import type { TaskQuickChange } from "./quick-actions";
import { QuickAddComposer } from "./quick-add-composer";
import {
    entitiesFromTaskTitle,
    highlightsForTaskTitle,
    parseQuickAdd,
    type QuickAddCatalogs,
    type QuickAddHighlight,
} from "./quick-add-parse";
import { taskRepeatLabel } from "./recurrence";
import { TaskActionsMenu } from "./task-actions-menu";
import { TaskHistoryPlanner } from "./task-history-planner";

import styles from "./planner.module.css";
import qa from "./quick-add.module.css";

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

/** Only details that are not already chips inside the title (legacy stripped titles). */
function lineMeta(task: Task, catalogs: QuickAddCatalogs, now: number) {
    const entities = entitiesFromTaskTitle(
        task.title,
        {
            propertyId: task.propertyId,
            clientId: task.clientId,
            ownerId: task.ownerId,
        },
        catalogs,
    );
    const parse = parseQuickAdd(task.title, {
        now,
        baseDate: task.dueDate,
        entities,
    });
    const title = task.title.toLowerCase();
    const fresh = (label: string | undefined) =>
        label && !title.includes(label.toLowerCase()) ? label : null;
    return {
        time:
            task.dueDate && task.dueTime && !parse.atoms.some((atom) => atom.kind === "time")
                ? taskTimeLabel(task.dueTime)
                : null,
        repeat:
            task.repeat && !parse.atoms.some((atom) => atom.kind === "repeat")
                ? taskRepeatLabel(task.repeat)
                : null,
        property: parse.propertyId
            ? null
            : fresh(catalogs.properties.find((item) => item.id === task.propertyId)?.title),
        contacts: [
            parse.clientId
                ? null
                : fresh(catalogs.clients.find((item) => item.id === task.clientId)?.name),
            parse.ownerId
                ? null
                : fresh(catalogs.owners.find((item) => item.id === task.ownerId)?.name),
        ].filter((name): name is string => !!name),
    };
}

function titleWithChips(text: string, highlights: readonly QuickAddHighlight[]): ReactNode[] {
    const nodes: ReactNode[] = [];
    let cursor = 0;
    highlights.forEach((mark, index) => {
        if (mark.start > cursor) nodes.push(text.slice(cursor, mark.start));
        nodes.push(
            <mark key={index} className={qa.mark} data-kind={mark.kind}>
                {text.slice(mark.start, mark.end)}
            </mark>,
        );
        cursor = mark.end;
    });
    nodes.push(text.slice(cursor));
    return nodes;
}

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
                date={task.dueDate}
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
    const meta = lineMeta(task, catalogs, now);
    const highlights = highlightsForTaskTitle(
        task.title,
        {
            propertyId: task.propertyId,
            clientId: task.clientId,
            ownerId: task.ownerId,
        },
        catalogs,
        now,
        task.dueDate,
    );

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
                ref={titleRef}
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
                {highlights.length ? titleWithChips(task.title, highlights) : task.title}
                {(meta.time || meta.repeat || meta.property || meta.contacts.length > 0) && (
                    <small className={styles.lineMeta}>
                        {meta.time && (
                            <span>
                                <Clock aria-hidden />
                                <span>{meta.time}</span>
                            </span>
                        )}
                        {meta.repeat && (
                            <span title={meta.repeat}>
                                <Repeat aria-hidden />
                                <span className="sr-only">{meta.repeat}</span>
                            </span>
                        )}
                        {meta.property && (
                            <span>
                                <Hash aria-hidden />
                                <span>{meta.property}</span>
                            </span>
                        )}
                        {meta.contacts.map((name, index) => (
                            <span key={`${index}-${name}`}>
                                <UserRound aria-hidden />
                                <span>{name}</span>
                            </span>
                        ))}
                    </small>
                )}
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
