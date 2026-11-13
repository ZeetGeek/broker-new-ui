"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import { Bell, CalendarClock, MapPin, Pencil, Repeat, Trash2 } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
    sortTasks,
    type Task,
    TASK_PRIORITY_LABELS,
    taskGroup,
    taskReminderLabel,
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
        <li className={cn(styles.taskRow, !!task.completedAt && styles.completedRow)}>
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
                    <button className={styles.taskTitle} onClick={onOpen}>
                        {task.title}
                    </button>
                    {property && (
                        <div className={styles.taskMeta}>
                            <span>
                                <MapPin aria-hidden />
                                {property.locality}, {property.city} · {property.title}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.taskSchedule}>
                {!task.completedAt && task.reminders.length > 0 && (
                    <TaskRowReminders task={task} busy={busy} onEdit={() => onIntent("reminder")} />
                )}
                {scheduleLabel && (
                    <div className={styles.scheduleDates}>
                        <span className={styles.scheduleIcon} aria-hidden>
                            <CalendarClock />
                        </span>
                        <div className={styles.scheduleContent}>
                            <span className={overdue ? styles.overdue : undefined}>
                                {overdue && <span className="sr-only">Overdue: </span>}
                                {scheduleLabel}
                            </span>
                        </div>
                    </div>
                )}
                {task.repeat && !task.completedAt && (
                    <span className={styles.repeatLabel}>
                        <Repeat aria-hidden />
                        {taskRepeatLabel(task.repeat)}
                    </span>
                )}
            </div>
            <div className={cn(styles.taskPerson, styles.taskOwner)}>
                <UserAvatar
                    name={owner?.name ?? "Owner"}
                    size="sm"
                    className="shadow-sm ring-2 ring-surface"
                />
                <div>
                    <small>Owner</small>
                    <strong className={!owner ? styles.missingPerson : undefined}>
                        {owner?.name ?? "Not linked"}
                    </strong>
                </div>
            </div>
            <div className={cn(styles.taskPerson, styles.taskClient)}>
                <UserAvatar
                    name={client?.name ?? "Client"}
                    size="sm"
                    className="shadow-sm ring-2 ring-surface"
                />
                <div>
                    <small>Client</small>
                    <strong className={!client ? styles.missingPerson : undefined}>
                        {client?.name ?? "Not linked"}
                    </strong>
                </div>
            </div>
            <div className={styles.taskPriority}>
                <Badge
                    color={
                        task.priority === "urgent"
                            ? "orange"
                            : task.priority === "high"
                              ? "amber"
                              : "stone"
                    }
                >
                    {TASK_PRIORITY_LABELS[task.priority]}
                </Badge>
            </div>
            <div className={styles.rowActions}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <button
                                    type="button"
                                    className={styles.circleAction}
                                    aria-label={`Edit ${task.title}`}
                                    onClick={() => onIntent("edit")}
                                    disabled={busy}
                                />
                            }
                        >
                            <Pencil aria-hidden size={20} strokeWidth={1.8} />
                        </TooltipTrigger>
                        <TooltipContent>Edit task</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <button
                                    type="button"
                                    className={cn(styles.circleAction, styles.dangerAction)}
                                    aria-label={`Delete ${task.title}`}
                                    onClick={() => onIntent("delete")}
                                    disabled={busy}
                                />
                            }
                        >
                            <Trash2 aria-hidden size={20} strokeWidth={1.8} />
                        </TooltipTrigger>
                        <TooltipContent>Delete task</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
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
    const compactLabel = (minutes: number) =>
        taskReminderLabel(minutes).replace(/\bminutes?\b/g, "min");
    if (reminders.length === 0) return null;
    if (reminders.length === 1) {
        return (
            <button
                type="button"
                className={styles.reminderLabel}
                disabled={busy}
                onClick={onEdit}
                aria-label={`Edit reminder for ${task.title}: ${compactLabel(reminders[0].minutes)}`}
            >
                <Bell aria-hidden /> {compactLabel(reminders[0].minutes)}
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
                <Bell aria-hidden /> {reminders.length} reminders
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
                                <strong>{compactLabel(reminder.minutes)}</strong>
                                <time dateTime={reminder.at}>
                                    {formatVisitDate(reminder.at)} · {formatVisitTime(reminder.at)}{" "}
                                    IST
                                </time>
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
