"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { cn } from "@/lib/utils";

import {
    ArrowRight,
    Bell,
    CalendarClock,
    Check,
    LockKeyhole,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAppSelector } from "@/store/hooks";

import { setTaskCompleted } from "./lifecycle";
import {
    type Task,
    TASK_PRIORITY_LABELS,
    TASK_PRIORITY_RANK,
    taskDueLabel,
    taskGroup,
} from "./model";
import { useTasks } from "./preview-store";

import styles from "@/features/new-dashboard/task-card.module.css";

const GROUPS = [
    ["overdue", "Overdue"],
    ["today", "Today"],
    ["upcoming", "Upcoming"],
    ["undated", "No due date"],
] as const;

export function DashboardTasksCard() {
    const accountId = useAppSelector((state) => state.auth.user?.id) ?? "design-preview";
    const { tasks, isLoading, error, busy, update } = useTasks(accountId);
    const [filter, setFilter] = useState<"open" | "urgent" | "completed">("open");
    const [now, setNow] = useState(() => Date.now());
    const [completing, setCompleting] = useState<string[]>([]);
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    const tabs = useRef<HTMLDivElement>(null);
    const pill = useRef<HTMLSpanElement>(null);
    const viewport = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const [hasMore, setHasMore] = useState(false);
    const [announcement, setAnnouncement] = useState("");

    useEffect(() => {
        const tick = window.setInterval(() => setNow(Date.now()), 30_000);
        const currentTimers = timers.current;
        return () => {
            window.clearInterval(tick);
            currentTimers.forEach(clearTimeout);
        };
    }, []);

    const open = tasks.filter(
        (task) => !task.deletedAt && (!task.completedAt || completing.includes(task.id)),
    );
    const done = tasks.filter(
        (task) => !task.deletedAt && task.completedAt && !completing.includes(task.id),
    );
    const urgent = open.filter((task) => task.priority === "urgent");
    const options = [
        ["open", "To do", open.length],
        ["urgent", TASK_PRIORITY_LABELS.urgent, urgent.length],
        ["completed", "Done", done.length],
    ] as const;
    const visible = (filter === "completed" ? done : filter === "urgent" ? urgent : open)
        .slice()
        .sort((a, b) => TASK_PRIORITY_RANK[b.priority] - TASK_PRIORITY_RANK[a.priority]);

    useLayoutEffect(() => {
        const bar = tabs.current;
        const indicator = pill.current;
        if (!bar || !indicator) return;
        const position = () => {
            const active = bar.querySelector<HTMLElement>('[aria-selected="true"]');
            if (!active) return;
            indicator.style.transform = `translateX(${active.offsetLeft}px)`;
            indicator.style.width = `${active.offsetWidth}px`;
        };
        position();
        const observer = new ResizeObserver(() => {
            indicator.style.transition = "none";
            position();
            void indicator.offsetWidth;
            indicator.style.transition = "";
        });
        observer.observe(bar);
        return () => observer.disconnect();
    }, [filter, open.length, urgent.length, done.length]);

    useEffect(() => {
        const el = viewport.current;
        if (!el || !content.current) return;
        const measure = () => setHasMore(el.scrollHeight - el.clientHeight - el.scrollTop > 1);
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        observer.observe(content.current);
        el.addEventListener("scroll", measure, { passive: true });
        measure();
        return () => {
            observer.disconnect();
            el.removeEventListener("scroll", measure);
        };
    }, [isLoading]);

    const toggle = async (task: Task) => {
        if (busy) return;
        const completedAt = task.completedAt ? null : new Date().toISOString();
        if (completedAt) setCompleting((ids) => [...ids, task.id]);
        try {
            const nextId = crypto.randomUUID();
            await update((latest) =>
                setTaskCompleted(latest, task.id, !!completedAt, Date.now(), nextId),
            );
            const message = completedAt ? "Task completed" : "Task reopened";
            toast.success(message);
            setAnnouncement(`${task.title}. ${message}.`);
            if (completedAt) {
                timers.current.set(
                    task.id,
                    setTimeout(() => {
                        setCompleting((ids) => ids.filter((id) => id !== task.id));
                        timers.current.delete(task.id);
                    }, 1200),
                );
            }
        } catch (failure) {
            setCompleting((ids) => ids.filter((id) => id !== task.id));
            toast.error(
                failure instanceof Error
                    ? failure.message
                    : "Couldn’t save this task. Please try again.",
            );
        }
    };

    return (
        <section
            className={cn(
                "flex flex-col rounded-card bg-surface p-4 shadow-sm ring-1 ring-border-warm/50 min-inline-0 sm:p-5",
                styles.card,
                styles.fixedCard,
            )}
            aria-labelledby="preview-tasks-title"
        >
            <p className="sr-only" aria-live="polite">
                {announcement}
            </p>
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="preview-tasks-title" className="h5 text-ink">
                    My tasks
                </h2>
                <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/broker/tasks?view=create" />}
                >
                    <Plus aria-hidden /> Add task
                </Button>
            </header>
            <div
                ref={tabs}
                className={cn("t-tabs t-tabs-surface t-tabs-compact", styles.tabs)}
                role="tablist"
                aria-label="Filter tasks"
            >
                <span ref={pill} className="t-tabs-pill" aria-hidden />
                {options.map(([value, label, count], index) => (
                    <button
                        key={value}
                        id={`dashboard-tasks-tab-${value}`}
                        type="button"
                        role="tab"
                        aria-selected={filter === value}
                        aria-controls="dashboard-tasks-panel"
                        tabIndex={filter === value ? 0 : -1}
                        onClick={() => setFilter(value)}
                        onKeyDown={(event) => {
                            const next =
                                event.key === "ArrowRight"
                                    ? (index + 1) % options.length
                                    : event.key === "ArrowLeft"
                                      ? (index - 1 + options.length) % options.length
                                      : event.key === "Home"
                                        ? 0
                                        : event.key === "End"
                                          ? options.length - 1
                                          : -1;
                            if (next < 0) return;
                            event.preventDefault();
                            setFilter(options[next][0]);
                            tabs.current
                                ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                                [next]?.focus();
                        }}
                        className={cn("t-tab", styles.tab)}
                    >
                        {label}
                        {count > 0 && <span className={styles.count}>{count}</span>}
                    </button>
                ))}
            </div>
            <div
                ref={viewport}
                className={styles.scrollViewport}
                tabIndex={0}
                role="region"
                aria-label="Task list"
            >
                <div ref={content} className={styles.list}>
                    <div
                        id="dashboard-tasks-panel"
                        role="tabpanel"
                        aria-labelledby={`dashboard-tasks-tab-${filter}`}
                        className="t-tabs-panel"
                    >
                        {isLoading && (
                            <p className="body-sm py-8 text-center text-ink-muted" role="status">
                                Loading your tasks…
                            </p>
                        )}
                        {error && (
                            <p className="body-sm py-8 text-danger" role="alert">
                                Couldn’t load your tasks. Open Tasks to try again.
                            </p>
                        )}
                        {(filter === "completed" ? [["completed", "Completed"]] : GROUPS).map(
                            ([group, label]) => {
                                const items = visible.filter(
                                    (task) =>
                                        group === "completed" ||
                                        taskGroup(task, now) === group ||
                                        (completing.includes(task.id) &&
                                            taskGroup({ ...task, completedAt: null }, now) ===
                                                group),
                                );
                                if (!items.length) return null;
                                return (
                                    <div key={group}>
                                        <h3
                                            className={cn(
                                                styles.group,
                                                group === "overdue" && "text-urgent",
                                            )}
                                        >
                                            {label}
                                            <span
                                                className={
                                                    group === "overdue"
                                                        ? "text-urgent"
                                                        : "text-ink-subtle"
                                                }
                                            >
                                                {items.length}
                                            </span>
                                        </h3>
                                        <ul className="divide-y divide-border-warm/60">
                                            {items.map((task) => (
                                                <li key={task.id} className={styles.row}>
                                                    <Checkbox
                                                        checked={Boolean(task.completedAt)}
                                                        disabled={
                                                            busy || completing.includes(task.id)
                                                        }
                                                        onCheckedChange={() => void toggle(task)}
                                                        className="mbs-1 cursor-pointer rounded-full hover:border-brand"
                                                        aria-label={`Mark ${task.title} ${task.completedAt ? "incomplete" : "complete"}`}
                                                    />
                                                    <div className="min-inline-0">
                                                        <Link
                                                            href={`/broker/tasks?view=detail&task=${encodeURIComponent(task.id)}`}
                                                            className={cn(
                                                                "body-sm rounded-sm font-semibold wrap-anywhere text-ink outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-ring",
                                                                task.completedAt &&
                                                                    "text-ink-subtle line-through",
                                                            )}
                                                        >
                                                            {task.title}
                                                        </Link>
                                                        <div className={styles.metadata}>
                                                            <span
                                                                className={cn(
                                                                    "inline-flex items-center gap-1 text-xs font-semibold",
                                                                    taskGroup(task, now) ===
                                                                        "overdue"
                                                                        ? "text-urgent"
                                                                        : "text-ink-subtle",
                                                                )}
                                                            >
                                                                <CalendarClock
                                                                    aria-hidden
                                                                    className="block-3.5 inline-3.5"
                                                                />
                                                                {taskDueLabel(task, now)}
                                                            </span>
                                                            {task.priority === "urgent" && (
                                                                <span className="caption rounded-full bg-danger-soft px-2 py-0.5 font-semibold text-danger">
                                                                    {
                                                                        TASK_PRIORITY_LABELS[
                                                                            task.priority
                                                                        ]
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            render={
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-ink-subtle"
                                                                    aria-label={`Actions for ${task.title}`}
                                                                />
                                                            }
                                                        >
                                                            <MoreHorizontal aria-hidden />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => void toggle(task)}
                                                                disabled={busy}
                                                            >
                                                                <Check aria-hidden />
                                                                {task.completedAt
                                                                    ? "Reopen task"
                                                                    : "Mark done"}
                                                            </DropdownMenuItem>
                                                            {[
                                                                ["edit", "Edit task", Pencil],
                                                                [
                                                                    "reschedule",
                                                                    "Reschedule",
                                                                    CalendarClock,
                                                                ],
                                                                [
                                                                    "reminder",
                                                                    "Edit reminders",
                                                                    Bell,
                                                                ],
                                                                ["delete", "Delete task", Trash2],
                                                            ].map(([view, label, Icon]) => {
                                                                const ActionIcon =
                                                                    Icon as typeof Pencil;
                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={view as string}
                                                                        render={
                                                                            <Link
                                                                                href={`/broker/tasks?view=${view as string}&task=${encodeURIComponent(task.id)}`}
                                                                            />
                                                                        }
                                                                        variant={
                                                                            view === "delete"
                                                                                ? "destructive"
                                                                                : "default"
                                                                        }
                                                                    >
                                                                        <ActionIcon aria-hidden />
                                                                        {label as string}
                                                                    </DropdownMenuItem>
                                                                );
                                                            })}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            },
                        )}
                        {!isLoading && !error && !visible.length && (
                            <p className="body-sm py-8 text-center text-ink-muted">
                                {filter === "urgent"
                                    ? "No urgent tasks right now."
                                    : filter === "completed"
                                      ? "No completed tasks yet."
                                      : "You’re all caught up."}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <footer
                data-scroll-shadow={hasMore}
                className={cn(
                    styles.fixedFooter,
                    "flex flex-wrap items-center justify-between gap-2 border-bs border-border-warm",
                )}
            >
                <Button
                    variant="link"
                    size="sm"
                    className="px-0 text-brand"
                    nativeButton={false}
                    render={<Link href="/broker/tasks" />}
                >
                    View all tasks
                    <ArrowRight aria-hidden className="block-4 inline-4" />
                </Button>
                <span className={styles.privacyStatus}>
                    <LockKeyhole aria-hidden className="block-3 inline-3" />
                    Only you can see this
                </span>
            </footer>
        </section>
    );
}
