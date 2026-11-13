"use client";

import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import { EmptyState } from "@/components/shared/empty-state";
import {
    Bell,
    Building,
    CalendarClock,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    LockKeyhole,
    Pencil,
    Repeat,
    RotateCcw,
    Trash2,
    User,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogPopup, DialogTitle } from "@/components/ui/dialog";

import { nextTaskDates } from "./lifecycle";
import {
    type Task,
    TASK_PRIORITY_LABELS,
    taskDateLabel,
    taskDueLabel,
    taskGroup,
    taskReminderDescription,
    taskReminders,
    taskTimeLabel,
} from "./model";
import { TASK_CLIENTS, TASK_OWNERS, TASK_PROPERTIES } from "./preview-store";
import { taskRepeatLabel } from "./recurrence";
import { TaskPanel } from "./task-panel";

import styles from "./tasks.module.css";

export function TaskDetail({
    task,
    now,
    busy,
    error,
    onClose,
    onComplete,
    onRestore,
    onIntent,
}: {
    task: Task;
    now: number;
    busy: boolean;
    error: string;
    onClose: () => void;
    onComplete: () => void;
    onRestore: () => void;
    onIntent: (view: string) => void;
}) {
    const client = TASK_CLIENTS.find((c) => c.id === task.clientId);
    const property = TASK_PROPERTIES.find((p) => p.id === task.propertyId);
    const owner = TASK_OWNERS.find((o) => o.id === task.ownerId);
    const nextDates = nextTaskDates(task, now);
    const nextDate = nextDates?.dueDate || nextDates?.startDate;
    const overdue = taskGroup(task, now) === "overdue";
    const reminders = taskReminders(task);
    return (
        <TaskPanel
            title="Task details"
            description="Your next step, with everything in context."
            onClose={onClose}
            busy={busy}
            footer={
                <div className={styles.detailFooter}>
                    {task.deletedAt ? (
                        <Button variant="accent" disabled={busy} onClick={onRestore}>
                            <RotateCcw aria-hidden />
                            Restore task
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                className={styles.deleteAction}
                                onClick={() => onIntent("delete")}
                                disabled={busy}
                            >
                                <Trash2 aria-hidden />
                                Delete task
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => onIntent("edit")}
                                disabled={busy}
                            >
                                <Pencil aria-hidden />
                                Edit task
                            </Button>
                            <Button variant="accent" disabled={busy} onClick={onComplete}>
                                {task.completedAt ? (
                                    <RotateCcw aria-hidden />
                                ) : (
                                    <Check aria-hidden />
                                )}
                                {task.completedAt ? "Reopen task" : "Mark done"}
                            </Button>
                        </>
                    )}
                </div>
            }
        >
            <span className={`${styles.statusBadge} ${overdue ? styles.overdueBadge : ""}`}>
                {task.deletedAt ? (
                    <Trash2 aria-hidden />
                ) : task.completedAt ? (
                    <CheckCircle2 aria-hidden />
                ) : (
                    <Clock aria-hidden />
                )}
                {task.deletedAt
                    ? "Deleted"
                    : task.completedAt
                      ? "Completed"
                      : overdue
                        ? "Overdue"
                        : "To do"}
            </span>
            <h2 className={styles.detailTitle}>{task.title}</h2>
            {task.details && <p className={styles.detailDescription}>{task.details}</p>}
            <dl className={styles.detailSection}>
                <div className={styles.detailLine}>
                    <CalendarClock aria-hidden />
                    <div>
                        <dt>Start date</dt>
                        <dd>
                            {task.startDate ? taskDateLabel(task.startDate, now) : "No start date"}
                            {task.startTime ? ` · ${taskTimeLabel(task.startTime)} IST` : ""}
                        </dd>
                    </div>
                </div>
                <div className={styles.detailLine}>
                    <CalendarClock aria-hidden />
                    <div>
                        <dt>Due date</dt>
                        <dd className={overdue ? styles.overdue : undefined}>
                            {task.dueDate
                                ? `${taskDueLabel({ ...task, completedAt: null }, now)} · IST`
                                : "No due date"}
                        </dd>
                    </div>
                    {!task.completedAt && !task.deletedAt && (
                        <Button variant="outline" size="sm" onClick={() => onIntent("reschedule")}>
                            Reschedule
                        </Button>
                    )}
                </div>
                {task.repeat && (
                    <div className={styles.detailLine}>
                        <Repeat aria-hidden />
                        <div>
                            <dt>Repeat</dt>
                            <dd>{taskRepeatLabel(task.repeat)}</dd>
                            {task.repeat.until && (
                                <p className="body-xs mbs-1 text-ink-subtle">
                                    Ends {taskDateLabel(task.repeat.until, now)}
                                </p>
                            )}
                            {!task.completedAt && (
                                <p className="body-xs mbs-1 text-ink-subtle">
                                    {nextDate
                                        ? `Complete this task to create the next occurrence for ${taskDateLabel(nextDate, now)}.`
                                        : "This is the last occurrence in this schedule."}
                                </p>
                            )}
                        </div>
                    </div>
                )}
                <div className={styles.detailLine}>
                    <Bell aria-hidden />
                    <div>
                        <dt>Reminders</dt>
                        <dd>
                            {task.completedAt || task.deletedAt ? (
                                task.deletedAt ? (
                                    "Off · task deleted"
                                ) : (
                                    "Off · task completed"
                                )
                            ) : reminders.length === 0 ? (
                                "No reminders"
                            ) : (
                                <ul className={styles.detailReminders}>
                                    {reminders.map((reminder) => (
                                        <li key={reminder.key}>
                                            <span>
                                                {taskReminderDescription(reminder)}
                                                {task.deliveredReminderKeys.includes(
                                                    reminder.key,
                                                ) ? (
                                                    <span className="text-ink-subtle">
                                                        {" "}
                                                        · delivered
                                                    </span>
                                                ) : null}
                                            </span>
                                            <span className="body-xs text-ink-subtle">
                                                {reminder.at
                                                    ? `${formatVisitDate(reminder.at)}, ${formatVisitTime(reminder.at)} IST`
                                                    : "Set a start date and time"}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </dd>
                    </div>
                    {!task.completedAt && !task.deletedAt && (
                        <Button variant="ghost" size="sm" onClick={() => onIntent("reminder")}>
                            {reminders.length ? "Manage" : "Add"}
                        </Button>
                    )}
                </div>
                <div className={styles.detailLine}>
                    <Clock aria-hidden />
                    <div>
                        <dt>Priority</dt>
                        <dd>{TASK_PRIORITY_LABELS[task.priority]}</dd>
                    </div>
                </div>
            </dl>
            {(client || owner || property) && (
                <section className={styles.detailSection}>
                    <h3>Linked records</h3>
                    {client && (
                        <details className={styles.record}>
                            <summary>
                                <User aria-hidden />
                                <span>
                                    {client.name}
                                    <small>Client · {client.type}</small>
                                </span>
                                <ChevronDown aria-hidden />
                            </summary>
                            <p>{client.requirement}</p>
                            {client.phoneDigits && <p>+{client.phoneDigits}</p>}
                        </details>
                    )}
                    {owner && (
                        <details className={styles.record}>
                            <summary>
                                <User aria-hidden />
                                <span>
                                    {owner.name}
                                    <small>Owner · Sample CRM record</small>
                                </span>
                                <ChevronDown aria-hidden />
                            </summary>
                            <p>
                                Attached to this private task. The owner’s record stays unchanged.
                            </p>
                        </details>
                    )}
                    {property && (
                        <details className={styles.record}>
                            <summary>
                                <Building aria-hidden />
                                <span>
                                    {property.title}
                                    <small>
                                        Property · {property.locality}, {property.city}
                                    </small>
                                </span>
                                <ChevronDown aria-hidden />
                            </summary>
                            <p>
                                {property.configLabel} · {property.address}
                            </p>
                        </details>
                    )}
                    <p className="body-xs mbs-3 text-ink-subtle">
                        Linked records are sample data. Changes to this task don’t change these
                        records.
                    </p>
                </section>
            )}
            <div className={styles.detailFootnote}>
                <p className="flex items-center gap-1.5">
                    <LockKeyhole className="block-3.5 inline-3.5" aria-hidden />
                    Only you can see this task
                </p>
                <p>
                    Created {formatVisitDate(task.createdAt)}, {formatVisitTime(task.createdAt)} IST
                </p>
                {task.completedAt && (
                    <p>
                        Completed {formatVisitDate(task.completedAt)},{" "}
                        {formatVisitTime(task.completedAt)} IST
                    </p>
                )}
            </div>
            {error && (
                <p className={`${styles.error} mbs-4`} role="alert">
                    {error}
                </p>
            )}
        </TaskPanel>
    );
}

export function TaskDeleteDialog({
    task,
    busy,
    error,
    onClose,
    onConfirm,
}: {
    task: Task;
    busy: boolean;
    error: string;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
            <DialogPopup showCloseButton={false} className={styles.deleteDialog}>
                <DialogTitle>Delete task?</DialogTitle>
                <p className={styles.deleteTaskName}>{task.title}</p>
                <DialogDescription>
                    Reminders will stop. You can restore it from Deleted.
                </DialogDescription>
                {error && (
                    <p role="alert" className={styles.error}>
                        {error}
                    </p>
                )}
                <div className={styles.deleteActions}>
                    <Button variant="outline" disabled={busy} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={busy}
                        loading={busy}
                        onClick={onConfirm}
                    >
                        Delete task
                    </Button>
                </div>
            </DialogPopup>
        </Dialog>
    );
}

export function TaskReminders({
    tasks,
    now,
    onClose,
    onOpen,
    onEdit,
}: {
    tasks: Task[];
    now: number;
    onClose: () => void;
    onOpen: (task: Task) => void;
    onEdit: (task: Task) => void;
}) {
    const reminders = tasks
        .filter((task) => !task.completedAt && !task.deletedAt)
        .flatMap((task) => taskReminders(task).map((reminder) => ({ task, ...reminder })))
        .sort((a, b) => (a.at ?? "9999").localeCompare(b.at ?? "9999"));
    const pending = reminders.filter(
        (reminder) => !reminder.task.deliveredReminderKeys.includes(reminder.key),
    );
    const delivered = reminders
        .filter((reminder) => reminder.task.deliveredReminderKeys.includes(reminder.key))
        .reverse();
    return (
        <TaskPanel
            title="Your reminders"
            description="A nudge at the right time, just for you."
            onClose={onClose}
            footer={
                <Button variant="outline" className="inline-full" onClick={onClose}>
                    Back to tasks
                </Button>
            }
        >
            <p className={styles.reminderIntro}>
                Reminders appear here and as an in-app notification while the app is open.
                Completing or deleting a task stops its reminders.
            </p>
            {reminders.length === 0 && (
                <EmptyState
                    className="py-10"
                    icon={Bell}
                    heading="Nothing to remind you about"
                    description="Add a date and time to a task, then choose when you’d like a reminder."
                />
            )}
            {[
                { label: "Scheduled", tasks: pending },
                { label: "Delivered", tasks: delivered },
            ]
                .filter((group) => group.tasks.length)
                .map((group) => (
                    <section key={group.label}>
                        <h2 className={styles.reminderHeading}>
                            {group.label}{" "}
                            <span className="text-ink-subtle">({group.tasks.length})</span>
                        </h2>
                        {group.tasks.map(({ task, at, minutes, key, kind }) => {
                            return (
                                <article key={`${task.id}-${key}`} className={styles.reminderItem}>
                                    <Bell aria-hidden />
                                    <div>
                                        <button
                                            className={styles.taskTitle}
                                            onClick={() => onOpen(task)}
                                        >
                                            {task.title}
                                        </button>
                                        <p>
                                            {at
                                                ? `${formatVisitDate(at)}, ${formatVisitTime(at)} IST`
                                                : "Set a start date and time"}
                                            {at &&
                                            Date.parse(at) <= now &&
                                            group.label === "Scheduled"
                                                ? " · Due now"
                                                : ""}
                                        </p>
                                        <p>{taskReminderDescription({ kind, minutes })}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
                                        Change
                                    </Button>
                                </article>
                            );
                        })}
                    </section>
                ))}
        </TaskPanel>
    );
}
