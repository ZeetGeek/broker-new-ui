"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    LockKeyhole,
    Plus,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { useAppSelector } from "@/store/hooks";

import { nextTaskDates, setTaskCompleted } from "./lifecycle";
import { sortTasks, type Task, TASK_TIME_ZONE, taskDateKey, taskIsOverdue } from "./model";
import { createPlannerTask, setTaskDeleted, type PlannerTaskExtras } from "./planner-model";
import { TASK_CLIENTS, TASK_OWNERS, TASK_PROPERTIES, useTasks } from "./preview-store";
import { changeTaskQuickly, type TaskQuickChange } from "./quick-actions";
import { QuickAddComposer } from "./quick-add-composer";
import { shiftTaskDate } from "./recurrence";
import { TaskLine } from "./task-list";

import planner from "./planner.module.css";
import styles from "@/features/new-dashboard/task-card.module.css";

const CATALOGS = {
    clients: TASK_CLIENTS,
    owners: TASK_OWNERS,
    properties: TASK_PROPERTIES,
};

type DashboardTab = "today" | "overdue";

const TAB_OPTIONS = [
    { value: "today" as const, label: "Today" },
    { value: "overdue" as const, label: "Overdue" },
];

/**
 * Dashboard card tabs:
 * - Today → open tasks for the selected day (overdue for calendar-today stay in Overdue)
 * - Overdue → all overdue tasks (past days + late today)
 */
function matchesDashboardTab(
    task: Task,
    tab: DashboardTab,
    completionFeedback: boolean,
    now: number,
    day: string,
) {
    if (task.deletedAt) return false;
    if (completionFeedback && tab === "today") return true;
    if (task.completedAt) return false;
    if (tab === "overdue") return taskIsOverdue(task, now);
    const date = task.dueDate || task.startDate;
    if (date !== day) return false;
    if (day === taskDateKey(now)) return !taskIsOverdue(task, now);
    return true;
}

function dayLabel(day: string, format: string) {
    return formatInTimeZone(`${day}T12:00:00+05:30`, TASK_TIME_ZONE, format);
}

export function DashboardTasksCard() {
    const router = useRouter();
    const accountId = useAppSelector((state) => state.auth.user?.id) ?? "design-preview";
    const { tasks, isLoading, error, busy, update } = useTasks(accountId);
    const [filter, setFilter] = useState<DashboardTab>("today");
    const [now, setNow] = useState(() => Date.now());
    const [selectedDay, setSelectedDay] = useState(() => taskDateKey(Date.now()));
    const [completionFeedback, setCompletionFeedback] = useState<Record<string, number>>({});
    const tabs = useRef<HTMLDivElement>(null);
    const pill = useRef<HTMLSpanElement>(null);
    const viewport = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const [hasMore, setHasMore] = useState(false);
    const [announcement, setAnnouncement] = useState("");
    const today = taskDateKey(now);

    useEffect(() => {
        const tick = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(tick);
    }, []);

    useEffect(() => {
        const nextExpiry = Math.min(...Object.values(completionFeedback));
        if (!Number.isFinite(nextExpiry)) return;
        const timer = window.setTimeout(
            () => {
                setCompletionFeedback((current) =>
                    Object.fromEntries(
                        Object.entries(current).filter(([, expiry]) => expiry > Date.now()),
                    ),
                );
            },
            Math.max(0, nextExpiry - Date.now()),
        );
        return () => window.clearTimeout(timer);
    }, [completionFeedback]);

    const clearCompletionFeedback = (id: string) => {
        setCompletionFeedback((current) => {
            const next = { ...current };
            delete next[id];
            return next;
        });
    };

    const shiftDay = (offset: number) => {
        const next = shiftTaskDate(selectedDay, offset);
        if (next) setSelectedDay(next);
    };

    const todayCount = tasks.filter((task) =>
        matchesDashboardTab(task, "today", false, now, today),
    ).length;
    const overdueCount = tasks.filter((task) =>
        matchesDashboardTab(task, "overdue", false, now, selectedDay),
    ).length;
    const visible = sortTasks(
        tasks.filter((task) =>
            matchesDashboardTab(
                task,
                filter,
                Boolean(completionFeedback[task.id]),
                now,
                selectedDay,
            ),
        ),
        filter === "today" ? "manual" : "due",
    );

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
    }, [filter, todayCount, overdueCount]);

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
    }, [isLoading, filter, visible.length]);

    const changeTasks = async (updater: (latest: Task[]) => Task[], message?: string) => {
        if (busy) return false;
        try {
            await update(updater);
            if (message) toast.success(message);
            return true;
        } catch (failure) {
            toast.error(
                failure instanceof Error
                    ? failure.message
                    : "Your change couldn’t be saved. Please try again.",
            );
            return false;
        }
    };

    const openTask = (task: Task) => {
        router.push(`/broker/tasks?view=detail&task=${encodeURIComponent(task.id)}`);
    };
    const intent = (task: Task, nextView: string) => {
        router.push(
            `/broker/tasks?view=${encodeURIComponent(nextView)}&task=${encodeURIComponent(task.id)}`,
        );
    };

    const complete = async (task: Task) => {
        if (busy) return;
        const showFeedback = !task.completedAt && filter === "today";
        if (showFeedback) {
            setCompletionFeedback((current) => ({ ...current, [task.id]: Infinity }));
        }
        try {
            const at = Date.now();
            const nextId = crypto.randomUUID();
            await update((latest) =>
                setTaskCompleted(latest, task.id, !task.completedAt, at, nextId),
            );
            if (showFeedback) {
                setCompletionFeedback((current) => ({ ...current, [task.id]: Date.now() + 2000 }));
            } else {
                clearCompletionFeedback(task.id);
            }
            const message = task.completedAt
                ? "Task reopened"
                : nextTaskDates(task, at)
                  ? "Task completed · next occurrence added"
                  : "Task completed";
            toast.success(message);
            setAnnouncement(`${task.title}. ${message}.`);
        } catch (failure) {
            clearCompletionFeedback(task.id);
            toast.error(
                failure instanceof Error
                    ? failure.message
                    : "Your change couldn’t be saved. Try again.",
            );
        }
    };

    const restore = async (task: Task) => {
        if (
            await changeTasks((latest) => setTaskDeleted(latest, task.id, false), "Task restored")
        ) {
            setAnnouncement(`${task.title}. Task restored.`);
        }
    };

    const rename = (task: Task, change: TaskQuickChange) => {
        if (change.title !== undefined && !change.title.trim()) {
            return changeTasks(
                (latest) => setTaskDeleted(latest, task.id, true),
                "Task moved to Deleted",
            );
        }
        return changeTasks((latest) => changeTaskQuickly(latest, task.id, change));
    };

    const quickChange = (task: Task, change: TaskQuickChange) =>
        changeTasks((latest) => changeTaskQuickly(latest, task.id, change));

    const quickAdd = async (
        title: string,
        date: string | null,
        listId?: string,
        extras?: PlannerTaskExtras,
    ) => {
        const task = createPlannerTask(
            title,
            date,
            Date.now(),
            crypto.randomUUID(),
            listId,
            extras,
        );
        const saved = await changeTasks((latest) => [...latest, task]);
        if (saved) setAnnouncement(`${title}. Task added.`);
        return saved;
    };

    const rowActions = {
        busy,
        now,
        catalogs: CATALOGS,
        onOpen: openTask,
        onComplete: complete,
        onIntent: intent,
        onRestore: restore,
        onRename: rename,
        onQuickChange: quickChange,
    };

    const countFor = (value: DashboardTab) => (value === "today" ? todayCount : overdueCount);

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
                {TAB_OPTIONS.map(({ value, label }, index) => {
                    const count = countFor(value);
                    return (
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
                                        ? (index + 1) % TAB_OPTIONS.length
                                        : event.key === "ArrowLeft"
                                          ? (index - 1 + TAB_OPTIONS.length) % TAB_OPTIONS.length
                                          : event.key === "Home"
                                            ? 0
                                            : event.key === "End"
                                              ? TAB_OPTIONS.length - 1
                                              : -1;
                                if (next < 0) return;
                                event.preventDefault();
                                setFilter(TAB_OPTIONS[next].value);
                                tabs.current
                                    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                                    [next]?.focus();
                            }}
                            className={cn("t-tab", styles.tab)}
                        >
                            {label}
                            {count > 0 ? <span className={styles.count}>{count}</span> : null}
                        </button>
                    );
                })}
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
                        className={cn("t-tabs-panel", planner.planner, styles.paper)}
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
                        {!isLoading && !error && (
                            <section
                                className={cn(planner.dayColumn, styles.dayColumnFlush)}
                                data-today={selectedDay === today || undefined}
                                aria-label={
                                    filter === "today"
                                        ? dayLabel(selectedDay, "EEEE, d MMMM yyyy")
                                        : `Overdue tasks · ${dayLabel(selectedDay, "EEEE, d MMMM yyyy")}`
                                }
                            >
                                <header className={cn(planner.dayHeading, styles.dayNav)}>
                                    <div className={styles.dayNavLabel}>
                                        <time dateTime={selectedDay}>
                                            {dayLabel(selectedDay, "MMM d, yyyy")}
                                        </time>
                                        <h3 className="h5">{dayLabel(selectedDay, "EEEE")}</h3>
                                    </div>
                                    <div className={styles.dayNavButtons}>
                                        <button
                                            type="button"
                                            className={planner.navButton}
                                            aria-label="Previous day"
                                            onClick={() => shiftDay(-1)}
                                        >
                                            <ChevronLeft aria-hidden size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className={planner.navButton}
                                            aria-label="Next day"
                                            onClick={() => shiftDay(1)}
                                        >
                                            <ChevronRight aria-hidden size={16} />
                                        </button>
                                    </div>
                                </header>
                                <ul
                                    className={cn(
                                        planner.ruledList,
                                        planner.rowGutters,
                                        styles.paperList,
                                    )}
                                >
                                    {visible.map((task) => (
                                        <li key={task.id} className={planner.historyLine}>
                                            <TaskLine
                                                task={task}
                                                showDate={filter === "overdue"}
                                                {...rowActions}
                                            />
                                        </li>
                                    ))}
                                    {filter === "today" ? (
                                        <li className={planner.composerLine}>
                                            <QuickAddComposer
                                                key={selectedDay}
                                                date={selectedDay}
                                                busy={busy}
                                                now={now}
                                                catalogs={CATALOGS}
                                                onAdd={quickAdd}
                                            />
                                        </li>
                                    ) : null}
                                </ul>
                                {!visible.length && filter === "overdue" ? (
                                    <p className="body-sm py-6 text-center text-ink-muted">
                                        No overdue tasks.
                                    </p>
                                ) : null}
                            </section>
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
