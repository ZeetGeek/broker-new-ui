"use client";

import { cn } from "@/lib/utils";

import {
    Bell,
    CalendarClock,
    Check,
    Clock,
    MoreHorizontal,
    Pencil,
    Repeat,
    RotateCcw,
    Trash2,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { sortTasks, type Task, taskDueLabel, taskGroup, taskRemindersSummary } from "./model";
import { TASK_CLIENTS, TASK_OWNERS, TASK_PROPERTIES } from "./preview-store";
import { taskRepeatLabel } from "./recurrence";

import styles from "./tasks.module.css";

export type TaskSort = "due" | "newest" | "priority" | "title";
const GROUP_LABELS = {
    overdue: "Overdue",
    today: "Today",
    upcoming: "Upcoming",
    undated: "No due date",
    completed: "Recently completed",
};
const GROUP_ORDER = ["overdue", "today", "upcoming", "undated", "completed"] as const;

export function TaskList({
    tasks,
    now,
    sort,
    completed,
    busy,
    onOpen,
    onComplete,
    onIntent,
}: {
    tasks: Task[];
    now: number;
    sort: TaskSort;
    completed: boolean;
    busy: boolean;
    onOpen: (task: Task) => void;
    onComplete: (task: Task) => void;
    onIntent: (task: Task, intent: string) => void;
}) {
    const sorted = sortTasks(tasks, sort);
    const grouped = sort === "due";
    const groups = grouped
        ? GROUP_ORDER.filter((group) => sorted.some((task) => taskGroup(task, now) === group))
        : (["all"] as const);
    return (
        <div className={styles.groups}>
            {groups.map((group) => {
                const rows =
                    group === "all"
                        ? sorted
                        : sorted.filter((task) => taskGroup(task, now) === group);
                return (
                    <section
                        key={group}
                        aria-label={
                            group === "all"
                                ? completed
                                    ? "Completed tasks"
                                    : "Tasks"
                                : GROUP_LABELS[group]
                        }
                        className={styles.group}
                    >
                        <div
                            className={cn(
                                styles.groupHeading,
                                group === "overdue" && styles.overdue,
                            )}
                        >
                            <h2>
                                {group === "all"
                                    ? sort === "priority"
                                        ? "By priority"
                                        : sort === "newest"
                                          ? "Recently added"
                                          : "By task name"
                                    : GROUP_LABELS[group]}
                            </h2>
                            <span className={styles.groupCount}>{rows.length}</span>
                            {group === "today" && (
                                <span className={styles.groupHint}>Your plan for the day</span>
                            )}
                        </div>
                        <ul className={styles.taskRows}>
                            {rows.map((task) => (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    now={now}
                                    busy={busy}
                                    onOpen={() => onOpen(task)}
                                    onComplete={() => onComplete(task)}
                                    onIntent={(intent) => onIntent(task, intent)}
                                />
                            ))}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}

function TaskRow({
    task,
    now,
    busy,
    onOpen,
    onComplete,
    onIntent,
}: {
    task: Task;
    now: number;
    busy: boolean;
    onOpen: () => void;
    onComplete: () => void;
    onIntent: (intent: string) => void;
}) {
    const client = TASK_CLIENTS.find((c) => c.id === task.clientId);
    const property = TASK_PROPERTIES.find((p) => p.id === task.propertyId);
    const owner = TASK_OWNERS.find((o) => o.id === task.ownerId);
    const overdue = taskGroup(task, now) === "overdue";
    return (
        <li className={cn(styles.taskRow, !!task.completedAt && styles.completedRow)}>
            <div className={styles.checkTarget}>
                <Checkbox
                    className={styles.checkboxHitArea}
                    style={{
                        inlineSize: "3rem",
                        blockSize: "3rem",
                        border: 0,
                        background: "transparent",
                    }}
                    checked={!!task.completedAt}
                    disabled={busy}
                    aria-label={`${task.completedAt ? "Reopen" : "Complete"} ${task.title}`}
                    onCheckedChange={onComplete}
                />
            </div>
            <div className={styles.taskMain}>
                <button className={styles.taskTitle} onClick={onOpen}>
                    {task.title}
                </button>
                <div className={styles.taskMeta}>
                    {client && <span>{client.name}</span>}
                    {owner && (
                        <span>
                            {client ? "/ " : ""}
                            {owner.name} <span className="text-ink-subtle">· Owner</span>
                        </span>
                    )}
                    {client && property && (
                        <span aria-hidden className={styles.metaDivider}>
                            /
                        </span>
                    )}
                    {property && (
                        <span>
                            {property.configLabel} · {property.locality}
                        </span>
                    )}
                    {!client && !owner && !property && <span>Personal task</span>}
                    {!task.completedAt &&
                        (task.priority === "urgent" || task.priority === "high") && (
                            <span
                                className={cn(
                                    styles.priority,
                                    task.priority === "urgent" && styles.urgentPriority,
                                )}
                            >
                                <span aria-hidden />
                                {task.priority === "urgent" ? "Urgent" : "High priority"}
                            </span>
                        )}
                </div>
            </div>
            <div className={cn(styles.taskSchedule, overdue && styles.overdue)}>
                <span>
                    <Clock aria-hidden />
                    {taskDueLabel(task, now)}
                </span>
                {task.repeat && !task.completedAt && (
                    <span className={styles.repeatLabel}>
                        <Repeat aria-hidden />
                        {taskRepeatLabel(task.repeat)}
                    </span>
                )}
                {!task.completedAt && task.reminders.length > 0 && (
                    <button onClick={() => onIntent("reminder")} className={styles.reminderLabel}>
                        <Bell aria-hidden />
                        {taskRemindersSummary(task)}
                    </button>
                )}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${task.title}`}
                        />
                    }
                >
                    <MoreHorizontal aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-inline-52">
                    <DropdownMenuItem onClick={onComplete} disabled={busy}>
                        {task.completedAt ? <RotateCcw aria-hidden /> : <Check aria-hidden />}
                        {task.completedAt ? "Reopen task" : "Mark done"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onIntent("edit")}>
                        <Pencil aria-hidden />
                        Edit task
                    </DropdownMenuItem>
                    {!task.completedAt && (
                        <>
                            <DropdownMenuItem onClick={() => onIntent("reschedule")}>
                                <CalendarClock aria-hidden />
                                Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onIntent("reminder")}>
                                <Bell aria-hidden />
                                {task.reminders.length ? "Edit reminders" : "Add reminders"}
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-danger" onClick={() => onIntent("delete")}>
                        <Trash2 aria-hidden />
                        Delete task
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </li>
    );
}
