"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import {
    Bell,
    Building2,
    CalendarClock,
    MoreHorizontal,
    Pencil,
    Repeat,
    Trash2,
    UserRound,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

import {
    sortTasks,
    type Task,
    TASK_PRIORITY_LABELS,
    taskDueLabel,
    taskGroup,
    type TaskReminder,
    taskReminderDescription,
    taskReminders,
    taskScheduleLabel,
} from "./model";
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
    const scheduleLabel = taskScheduleLabel(task, now);
    return (
        <li
            className={cn(styles.taskRow, !!task.completedAt && styles.completedRow)}
            data-priority={task.priority}
        >
            <div className={styles.taskMain}>
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
                <div className={styles.taskText}>
                    <button
                        type="button"
                        className={styles.taskTitle}
                        onClick={onOpen}
                        title={task.title}
                    >
                        {task.title}
                    </button>
                    {(property || owner || client) && (
                        <div className={styles.taskMeta}>
                            {property && (
                                <span
                                    title={`${property.title} · ${property.locality}, ${property.city}`}
                                >
                                    <Building2 aria-hidden />
                                    <span>{property.title}</span>
                                </span>
                            )}
                            {client && (
                                <span title={`Client: ${client.name}`}>
                                    <UserRound aria-hidden />
                                    <span>Client: {client.name}</span>
                                </span>
                            )}
                            {owner && (
                                <span title={`Owner: ${owner.name}`}>
                                    <UserRound aria-hidden />
                                    <span>Owner: {owner.name}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.taskSchedule}>
                <div className={styles.scheduleContent}>
                    <span
                        className={cn(styles.scheduleValue, overdue && styles.overdue)}
                        title={
                            scheduleLabel ? `${scheduleLabel.replace(/ IST$/, "")} IST` : undefined
                        }
                    >
                        <CalendarClock aria-hidden />
                        {!task.completedAt && !task.dueDate && task.startDate
                            ? `Starts ${scheduleLabel.replace(/ IST$/, "")}`
                            : taskDueLabel(task, now)}
                    </span>
                    <span
                        className={styles.priority}
                        aria-label={`Priority: ${TASK_PRIORITY_LABELS[task.priority]}`}
                    >
                        <span aria-hidden />
                        {TASK_PRIORITY_LABELS[task.priority]}
                    </span>
                    {task.repeat && !task.completedAt && (
                        <span className={styles.repeatLabel}>
                            <Repeat aria-hidden />
                            {taskRepeatLabel(task.repeat)}
                        </span>
                    )}
                    {!task.completedAt && (
                        <TaskRowReminders
                            task={task}
                            busy={busy}
                            onEdit={() => onIntent("reminder")}
                        />
                    )}
                </div>
            </div>
            <div className={styles.rowActions}>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <button
                                type="button"
                                className={styles.menuAction}
                                aria-label={`Actions for ${task.title}`}
                                disabled={busy}
                            />
                        }
                    >
                        <MoreHorizontal aria-hidden size={20} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onOpen}>
                            <CalendarClock aria-hidden />
                            Task details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onIntent("edit")}>
                            <Pencil aria-hidden />
                            Edit task
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onIntent("reschedule")}>
                            <CalendarClock aria-hidden />
                            Reschedule
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onIntent("reminder")}>
                            <Bell aria-hidden />
                            Edit reminders
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => onIntent("delete")}>
                            <Trash2 aria-hidden />
                            Delete task
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </li>
    );
}

function TaskRowReminders({
    task,
    busy,
    onEdit,
}: {
    task: Task;
    busy: boolean;
    onEdit: () => void;
}) {
    const [open, setOpen] = useState(false);
    const reminders = taskReminders(task);
    const compactLabel = (reminder: TaskReminder) =>
        taskReminderDescription(reminder).replace(/\bminutes?\b/g, "min");
    if (reminders.length === 0) return null;
    if (reminders.length === 1) {
        return (
            <button
                type="button"
                className={styles.reminderLabel}
                disabled={busy}
                onClick={onEdit}
                aria-label={`Edit reminder for ${task.title}: ${compactLabel(reminders[0])}`}
            >
                <Bell aria-hidden />
                <span>{compactLabel(reminders[0])}</span>
            </button>
        );
    }
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={
                    <button
                        type="button"
                        className={styles.reminderLabel}
                        disabled={busy}
                        aria-label={`Show all ${reminders.length} reminders for ${task.title}`}
                    />
                }
            >
                <Bell aria-hidden />
                {reminders.length} reminders
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="overflow-y-auto p-4 inline-[min(20rem,calc(100dvw-2rem))] max-block-[min(28rem,var(--available-height))]"
            >
                <PopoverTitle className="font-semibold text-ink">
                    {reminders.length} reminders
                </PopoverTitle>
                <ul className={styles.reminderPopoverList}>
                    {reminders.map((reminder) => (
                        <li key={reminder.key}>
                            <Bell aria-hidden />
                            <div>
                                <strong>{compactLabel(reminder)}</strong>
                                {reminder.at ? (
                                    <time dateTime={reminder.at}>
                                        {formatVisitDate(reminder.at)} ·{" "}
                                        {formatVisitTime(reminder.at)} IST
                                    </time>
                                ) : (
                                    <small>Set a start date and time</small>
                                )}
                                {task.deliveredReminderKeys.includes(reminder.key) && (
                                    <small>Delivered</small>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                        setOpen(false);
                        onEdit();
                    }}
                >
                    Edit reminders
                </Button>
            </PopoverContent>
        </Popover>
    );
}
