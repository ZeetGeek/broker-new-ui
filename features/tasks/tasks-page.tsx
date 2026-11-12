"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { usePathname, useRouter, useSearchParams } from "@/lib/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { FilterChip } from "@/components/shared/filter-chip";
import {
    Bell,
    Check,
    CheckCircle2,
    List,
    LockKeyhole,
    Plus,
    Search,
    SlidersHorizontal,
    X,
} from "@/components/shared/icons";
import { Skeleton } from "@/components/shared/skeleton";
import { StatusTabs } from "@/components/shared/status-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import { useAppSelector } from "@/store/hooks";

import { nextTaskDates, setTaskCompleted } from "./lifecycle";
import {
    type Task,
    type TaskDraft,
    type TaskDueFilter,
    taskGroup,
    type TaskLinkFilter,
    taskMatchesDueFilter,
    taskMatchesLinkFilter,
    taskMatchesTab,
} from "./model";
import { TASK_CLIENTS, TASK_OWNERS, TASK_PROPERTIES, useTasks } from "./preview-store";
import { TaskDeleteDialog, TaskDetail, TaskReminders } from "./task-detail";
import { TaskForm, TaskSelect } from "./task-form";
import { TaskList, type TaskSort } from "./task-list";
import { TaskPanel } from "./task-panel";

import styles from "./tasks.module.css";

const DUE_FILTERS = [
    { value: "", label: "Any date" },
    { value: "overdue", label: "Overdue" },
    { value: "today", label: "Today" },
    { value: "week", label: "Next 7 days" },
    { value: "undated", label: "No due date" },
];
const LINK_FILTERS = [
    { value: "", label: "Any task" },
    { value: "client", label: "Linked to a Client" },
    { value: "owner", label: "Linked to an owner" },
    { value: "property", label: "Linked to a property" },
    { value: "personal", label: "Personal tasks only" },
];

export function TasksPage() {
    const accountId = useAppSelector((state) => state.auth.user?.id) ?? "design-preview";
    return <TasksWorkspace key={accountId} accountId={accountId} />;
}

function TasksWorkspace({ accountId }: { accountId: string }) {
    const { tasks, isLoading, error: loadError, save, update, reset, busy } = useTasks(accountId);
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const [now, setNow] = useState(() => Date.now());
    const [error, setError] = useState("");
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 15_000);
        return () => window.clearInterval(timer);
    }, []);
    const navigate = (patch: Record<string, string | undefined>, replace = false) => {
        const next = new URLSearchParams(params.toString());
        Object.entries(patch).forEach(([key, value]) =>
            value ? next.set(key, value) : next.delete(key),
        );
        const href = `${pathname}${next.size ? `?${next}` : ""}`;
        if (replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
    };
    const rawTab = params.get("tab");
    const tab =
        rawTab === "today" || rawTab === "upcoming" || rawTab === "completed" ? rawTab : "all";
    const view = params.get("view");
    const selected = tasks.find((task) => task.id === params.get("task"));
    const search = params.get("q") ?? "";
    const due = DUE_FILTERS.some((f) => f.value === params.get("due"))
        ? (params.get("due") ?? "")
        : "";
    const linked = LINK_FILTERS.some((f) => f.value === params.get("linked"))
        ? (params.get("linked") ?? "")
        : "";
    const rawSort = params.get("sort");
    const sort: TaskSort =
        rawSort === "newest" || rawSort === "priority" || rawSort === "title" ? rawSort : "due";
    const open = tasks.filter((task) => !task.completedAt);
    const overdue = open.filter((task) => taskGroup(task, now) === "overdue").length;
    const today = open.filter((task) => taskGroup(task, now) === "today").length;
    const reminders = open.reduce((count, task) => count + task.reminders.length, 0);
    const tabs = [
        { value: "all", label: "All tasks", count: open.length, dotClassName: "bg-brand" },
        { value: "today", label: "Today", count: today, dotClassName: "bg-pending" },
        {
            value: "upcoming",
            label: "Upcoming",
            count: open.filter((t) => taskGroup(t, now) === "upcoming").length,
            dotClassName: "bg-ink-subtle",
        },
        {
            value: "completed",
            label: "Completed",
            compactLabel: "Done",
            count: tasks.filter((t) => t.completedAt).length,
            dotClassName: "bg-brand",
        },
    ];
    const visible = tasks.filter((task) => {
        if (!taskMatchesTab(task, tab, now)) return false;
        if (!taskMatchesDueFilter(task, due as TaskDueFilter, now)) return false;
        if (!taskMatchesLinkFilter(task, linked as TaskLinkFilter)) return false;
        const client = TASK_CLIENTS.find((c) => c.id === task.clientId);
        const property = TASK_PROPERTIES.find((p) => p.id === task.propertyId);
        const owner = TASK_OWNERS.find((o) => o.id === task.ownerId);
        const haystack =
            `${task.title} ${task.details} ${client?.name ?? ""} ${owner?.name ?? ""} ${property?.title ?? ""} ${property?.locality ?? ""}`.toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
    });
    const close = () => {
        setError("");
        navigate({
            view: undefined,
            task: undefined,
            visitClient: undefined,
            visitProperty: undefined,
            visitTitle: undefined,
        });
    };
    const intent = (task: Task, nextView: string) => {
        setError("");
        navigate({ task: task.id, view: nextView });
    };
    const create = () => {
        setError("");
        navigate({
            task: undefined,
            view: "create",
            visitClient: undefined,
            visitProperty: undefined,
            visitTitle: undefined,
        });
    };
    const clear = () => navigate({ q: undefined, due: undefined, linked: undefined }, true);
    const commit = async (next: Task[], message: string, after?: () => void) => {
        setError("");
        try {
            await save(next);
            toast.success(message);
            after?.();
        } catch {
            setError(
                "Your change couldn’t be saved in this tab. Try again; your task is still here.",
            );
        }
    };
    const complete = async (task: Task) => {
        if (busy) return;
        setError("");
        try {
            const now = Date.now();
            const nextId = crypto.randomUUID();
            await update((latest) =>
                setTaskCompleted(latest, task.id, !task.completedAt, now, nextId),
            );
            toast.success(
                task.completedAt
                    ? "Task reopened"
                    : nextTaskDates(task, now)
                      ? "Task completed · next occurrence added"
                      : "Task completed",
            );
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : "Your change couldn’t be saved. Try again.",
            );
        }
    };
    const saveDraft = async (draft: TaskDraft) => {
        const at = new Date().toISOString();
        const editing = view !== "create" ? selected : undefined;
        const sameSchedule =
            editing &&
            editing.startDate === (draft.startDate || null) &&
            editing.dueDate === (draft.dueDate || null) &&
            JSON.stringify(editing.repeat) === JSON.stringify(draft.repeat);
        const next: Task = {
            id: editing?.id ?? crypto.randomUUID(),
            title: draft.title.trim(),
            details: draft.details.trim(),
            startDate: draft.startDate || null,
            repeat: draft.repeat,
            repeatAnchor: draft.repeat
                ? sameSchedule
                    ? editing.repeatAnchor
                    : draft.dueDate || draft.startDate || null
                : null,
            repeatFromId: editing?.repeatFromId ?? null,
            dueDate: draft.dueDate || null,
            dueTime: draft.dueDate && draft.dueTime ? draft.dueTime : null,
            reminders: draft.dueDate && draft.dueTime ? [...draft.reminders] : [],
            clientId: draft.clientId || null,
            ownerId: draft.ownerId || null,
            propertyId: draft.propertyId || null,
            priority: draft.priority,
            completedAt: editing?.completedAt ?? null,
            createdAt: editing?.createdAt ?? at,
            updatedAt: at,
            deliveredReminderKeys: editing?.deliveredReminderKeys ?? [],
        };
        await commit(
            editing ? tasks.map((t) => (t.id === editing.id ? next : t)) : [next, ...tasks],
            editing
                ? view === "reschedule"
                    ? "Task rescheduled"
                    : view === "reminder"
                      ? "Reminder updated"
                      : "Task updated"
                : "Task created",
            () =>
                navigate({
                    view: "detail",
                    task: next.id,
                    visitClient: undefined,
                    visitProperty: undefined,
                    visitTitle: undefined,
                }),
        );
    };
    const filtered = !!(due || linked || search.trim());
    const panelMissing =
        !isLoading &&
        !loadError &&
        view &&
        !["create", "filters", "reminders"].includes(view) &&
        !selected;
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className="h3 text-ink">
                        Tasks.{" "}
                        <span className="font-normal text-ink-muted">
                            Keep the next step moving.
                        </span>
                    </h1>
                    <p className={styles.privateLine}>
                        <LockKeyhole aria-hidden /> Private to you <span aria-hidden>·</span> India
                        time (IST)
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <Button
                        variant="outline"
                        onClick={() => navigate({ view: "reminders", task: undefined })}
                    >
                        <Bell aria-hidden />
                        Reminders
                        {reminders > 0 && <span className={styles.smallCount}>{reminders}</span>}
                    </Button>
                    <Button onClick={create}>
                        <Plus aria-hidden />
                        Add task
                    </Button>
                </div>
            </header>
            <Tabs
                value={tab}
                onValueChange={(value) =>
                    navigate({ tab: value === "all" ? undefined : String(value), due: undefined })
                }
                className={styles.workspace}
            >
                <StatusTabs tabs={tabs} value={tab} label="Task views" isLoading={isLoading} />
                <div className={styles.toolbar}>
                    <Input
                        aria-label="Search tasks"
                        placeholder="Search tasks or linked records"
                        value={search}
                        onValueChange={(q) => navigate({ q: q || undefined }, true)}
                        startIcon={Search}
                        clearable
                    />
                    <div className={styles.tools}>
                        <Button
                            variant="outline"
                            onClick={() => navigate({ view: "filters", task: undefined })}
                        >
                            <SlidersHorizontal aria-hidden />
                            Filters
                            {(due || linked) && (
                                <span className={styles.smallCount}>
                                    {Number(!!due) + Number(!!linked)}
                                </span>
                            )}
                        </Button>
                        <TaskSelect
                            label="Sort tasks"
                            value={sort}
                            options={[
                                {
                                    value: "due",
                                    label: tab === "completed" ? "Completion date" : "Due date",
                                },
                                { value: "priority", label: "Priority" },
                                { value: "newest", label: "Newest first" },
                                { value: "title", label: "Task name" },
                            ]}
                            onChange={(value) =>
                                navigate({ sort: value === "due" ? undefined : value }, true)
                            }
                        />
                    </div>
                </div>
                {(due || linked) && (
                    <div className={styles.activeFilters}>
                        {due && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate({ due: undefined }, true)}
                            >
                                {DUE_FILTERS.find((f) => f.value === due)?.label}
                                <X aria-hidden />
                                <span className="sr-only">Remove due date filter</span>
                            </Button>
                        )}
                        {linked && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate({ linked: undefined }, true)}
                            >
                                {LINK_FILTERS.find((f) => f.value === linked)?.label}
                                <X aria-hidden />
                                <span className="sr-only">Remove linked record filter</span>
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={clear}>
                            Clear filters
                        </Button>
                    </div>
                )}
                {tab === "today" && overdue > 0 && (
                    <button
                        className={styles.overdueNotice}
                        onClick={() => navigate({ tab: undefined, due: "overdue" })}
                    >
                        <span>
                            <ClockNotice />
                            {overdue} overdue {overdue === 1 ? "task needs" : "tasks need"}{" "}
                            attention
                        </span>
                        <span>View tasks →</span>
                    </button>
                )}
                {loadError && (
                    <div className={styles.error} role="alert">
                        <p>
                            Sample tasks couldn’t load. Check that storage is available in this tab,
                            or start again with the sample tasks.
                        </p>
                        <Button
                            className="mbs-3"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                                void reset().catch(() =>
                                    setError(
                                        "Allow storage in this browser, then try loading tasks again.",
                                    ),
                                )
                            }
                        >
                            Reset sample tasks
                        </Button>
                    </div>
                )}
                {error && !view && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}
                <TabsContent value={tab} className={styles.content}>
                    {isLoading ? (
                        <div className={styles.loading} aria-label="Loading tasks" role="status">
                            {Array.from({ length: 5 }, (_, i) => (
                                <Skeleton
                                    key={i}
                                    className="rounded-control block-18 inline-full"
                                />
                            ))}
                        </div>
                    ) : visible.length ? (
                        <TaskList
                            tasks={visible}
                            now={now}
                            sort={sort}
                            completed={tab === "completed"}
                            busy={busy}
                            onOpen={(task) => intent(task, "detail")}
                            onComplete={complete}
                            onIntent={intent}
                        />
                    ) : (
                        <EmptyState
                            className={styles.empty}
                            icon={tab === "completed" ? CheckCircle2 : List}
                            heading={
                                filtered
                                    ? "No tasks match these filters"
                                    : tab === "today"
                                      ? "A clear day ahead"
                                      : tab === "upcoming"
                                        ? "Nothing lined up yet"
                                        : tab === "completed"
                                          ? "Your finished tasks will live here"
                                          : "Make room for your next step"
                            }
                            description={
                                filtered
                                    ? "Try another search or clear your filters to see more tasks."
                                    : tab === "completed"
                                      ? "Check off a task when it’s done. You can reopen it whenever plans change."
                                      : "Add a follow-up, a document to collect, or anything you want to remember."
                            }
                        >
                            <Button
                                variant={filtered ? "outline" : "default"}
                                onClick={filtered ? clear : create}
                            >
                                {filtered ? "Clear search & filters" : "Add a task"}
                            </Button>
                        </EmptyState>
                    )}
                </TabsContent>
                {!isLoading && visible.length > 0 && (
                    <footer className={styles.listFooter}>
                        <span>
                            {visible.length} {tab === "completed" ? "completed" : "open"}{" "}
                            {visible.length === 1 ? "task" : "tasks"}
                            {filtered ? " match" : ""}
                        </span>
                        <span>
                            <Check aria-hidden /> Small steps. Steady progress.
                        </span>
                    </footer>
                )}
            </Tabs>
            <p className={styles.previewNote}>
                Sample workspace · Changes are saved in this tab. Reminders appear while the app is
                open.
            </p>
            {view === "filters" && (
                <TaskFilters
                    due={due}
                    linked={linked}
                    onClose={close}
                    onApply={(values) => navigate({ ...values, view: undefined }, true)}
                />
            )}
            {view === "reminders" && (
                <TaskReminders
                    tasks={tasks}
                    now={now}
                    onClose={close}
                    onOpen={(task) => intent(task, "detail")}
                    onEdit={(task) => intent(task, "reminder")}
                />
            )}
            {view === "create" && (
                <TaskForm
                    key={`create-${params.get("visitClient") ?? ""}-${params.get("visitProperty") ?? ""}-${params.get("visitTitle") ?? ""}`}
                    mode="create"
                    prefill={{
                        title: (params.get("visitTitle") ?? "").slice(0, 160),
                        clientId: TASK_CLIENTS.some((item) => item.id === params.get("visitClient"))
                            ? params.get("visitClient")!
                            : "",
                        propertyId: TASK_PROPERTIES.some(
                            (item) => item.id === params.get("visitProperty"),
                        )
                            ? params.get("visitProperty")!
                            : "",
                    }}
                    busy={busy}
                    onSave={saveDraft}
                    onClose={close}
                    error={error}
                />
            )}
            {selected && (view === "edit" || view === "reschedule" || view === "reminder") && (
                <TaskForm
                    key={`${view}-${selected.id}`}
                    task={selected}
                    mode={view}
                    busy={busy}
                    onSave={saveDraft}
                    onClose={close}
                    error={error}
                />
            )}
            {selected && view === "detail" && (
                <TaskDetail
                    task={selected}
                    now={now}
                    busy={busy}
                    error={error}
                    onClose={close}
                    onComplete={() => complete(selected)}
                    onIntent={(next) => intent(selected, next)}
                />
            )}
            {selected && view === "delete" && (
                <TaskDeleteDialog
                    task={selected}
                    busy={busy}
                    error={error}
                    onClose={close}
                    onConfirm={() =>
                        void commit(
                            tasks.filter((task) => task.id !== selected.id),
                            "Task deleted",
                            close,
                        )
                    }
                />
            )}
            {panelMissing && (
                <TaskPanel
                    title="Task not found"
                    description="This task may have been deleted in this tab."
                    onClose={close}
                >
                    <Button variant="outline" onClick={close}>
                        Back to tasks
                    </Button>
                </TaskPanel>
            )}
        </div>
    );
}

function ClockNotice() {
    return <Bell aria-hidden />;
}

function TaskFilters({
    due,
    linked,
    onApply,
    onClose,
}: {
    due: string;
    linked: string;
    onApply: (value: { due: string | undefined; linked: string | undefined }) => void;
    onClose: () => void;
}) {
    const [date, setDate] = useState(due);
    const [link, setLink] = useState(linked);
    return (
        <TaskPanel
            title="Filter tasks"
            description="Find the follow-ups that need your attention."
            onClose={onClose}
            footer={
                <div className="flex justify-between gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setDate("");
                            setLink("");
                        }}
                    >
                        Reset
                    </Button>
                    <Button
                        onClick={() =>
                            onApply({ due: date || undefined, linked: link || undefined })
                        }
                    >
                        Apply filters
                    </Button>
                </div>
            }
        >
            <fieldset className={styles.filterGroup}>
                <legend>Due date</legend>
                <div className={styles.filterOptions}>
                    {DUE_FILTERS.map((option) => (
                        <FilterChip
                            key={option.value}
                            label={option.label}
                            isActive={date === option.value}
                            onClick={() => setDate(option.value)}
                        />
                    ))}
                </div>
            </fieldset>
            <fieldset className={styles.filterGroup}>
                <legend>Linked records</legend>
                <div className={styles.filterOptions}>
                    {LINK_FILTERS.map((option) => (
                        <FilterChip
                            key={option.value}
                            label={option.label}
                            isActive={link === option.value}
                            onClick={() => setLink(option.value)}
                        />
                    ))}
                </div>
            </fieldset>
            <p className="body-sm text-ink-muted">
                Filters apply to the selected tab. Tasks can link to Clients, owners and properties.
            </p>
        </TaskPanel>
    );
}
