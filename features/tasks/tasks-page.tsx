"use client";

import { useDeferredValue, useEffect, useState } from "react";

import { useSearchParams } from "@/lib/navigation";
import { matchesCrmSearch } from "@/lib/search/crm-search";
import { CRM_SEARCH_HELP } from "@/lib/search/search-help";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import toast from "@/components/shared/app-toast";
import { DrawerSection } from "@/components/shared/drawer-section";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterChip } from "@/components/shared/filter-chip";
import {
    AlertCircle,
    CheckCircle2,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from "@/components/shared/icons";
import {
    ListAddButton,
    ListSearchField,
    ListToolbarSelect,
} from "@/components/shared/list-toolbar";
import { ResponsiveListStatus } from "@/components/shared/responsive-list-toolbar";
import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";
import { StatusTabs } from "@/components/shared/status-tabs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import { useShortcut } from "@/features/shortcuts/use-shortcut";
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
    type TaskSort,
} from "./model";
import { taskListId } from "./notebook-model";
import { useTaskNotebook } from "./notebook-store";
import { createPlannerTask, movePlannerTask, setTaskDeleted } from "./planner-model";
import { changeTaskQuickly, type TaskQuickChange } from "./quick-actions";
import { useTaskCatalogs } from "./task-catalogs";
import { TaskDeleteDialog, TaskDetail, TaskReminders } from "./task-detail";
import { TaskForm } from "./task-form";
import { type TaskDraftMode, taskFromDraft } from "./task-from-draft";
import { TaskArchive } from "./task-list";
import { TaskPanel } from "./task-panel";
import { TaskPlanner } from "./task-planner";
import { TaskResultsSkeleton } from "./task-results-skeleton";
import { useTasks } from "./task-store";

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
    const initialQuery = useSearchParams().toString();
    return (
        <TasksWorkspace
            key={`${accountId}:${initialQuery}`}
            accountId={accountId}
            initialQuery={initialQuery}
        />
    );
}

function TasksWorkspace({ accountId, initialQuery }: { accountId: string; initialQuery: string }) {
    const {
        tasks,
        isLoading,
        error: loadError,
        save,
        update,
        reset,
        busy,
        isLive,
    } = useTasks(accountId);
    const lists = useTaskNotebook(accountId);
    const catalogs = useTaskCatalogs();
    // Read incoming links once; workspace interactions never navigate or write browser history.
    const [params, setParams] = useState(() => new URLSearchParams(initialQuery));
    const [now, setNow] = useState(() => Date.now());
    const [error, setError] = useState("");
    const [completionFeedback, setCompletionFeedback] = useState<Record<string, number>>({});
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
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 15_000);
        return () => window.clearInterval(timer);
    }, []);
    const updateWorkspace = (patch: Record<string, string | undefined>) => {
        setParams((current) => {
            const next = new URLSearchParams(current);
            Object.entries(patch).forEach(([key, value]) =>
                value ? next.set(key, value) : next.delete(key),
            );
            return next;
        });
    };
    const rawTab = params.get("tab");
    const tab =
        rawTab === "completed" || rawTab === "deleted" || rawTab === "overdue" ? rawTab : "all";
    const view = params.get("view");
    const selected = tasks.find((task) => task.id === params.get("task"));
    const search = params.get("q") ?? "";
    const deferredSearch = useDeferredValue(search);
    const searchPending = search !== deferredSearch;
    const due = DUE_FILTERS.some((f) => f.value === params.get("due"))
        ? (params.get("due") ?? "")
        : "";
    const linked = LINK_FILTERS.some((f) => f.value === params.get("linked"))
        ? (params.get("linked") ?? "")
        : "";
    const rawSort = params.get("sort");
    const defaultSort = tab === "all" ? "manual" : "due";
    const sort: TaskSort =
        rawSort === "due" || rawSort === "newest" || rawSort === "priority" || rawSort === "title"
            ? rawSort
            : defaultSort;
    const open = tasks.filter((task) => !task.completedAt && !task.deletedAt);
    const overdue = open.filter((task) => taskGroup(task, now) === "overdue").length;
    const today = open.filter((task) => taskGroup(task, now) === "today").length;
    const summaryLines = [
        overdue > 0
            ? `${overdue} overdue ${overdue === 1 ? "task needs" : "tasks need"} attention`
            : "",
        today > 0 ? `${today} ${today === 1 ? "task" : "tasks"} due today` : "",
        open.length > 0
            ? `${open.length} open ${open.length === 1 ? "task" : "tasks"}`
            : "Add your next follow-up",
    ].filter(Boolean);
    const overdueCount = open.filter((task) => taskGroup(task, now) === "overdue").length;
    const tabs = [
        {
            value: "all",
            label: "To do",
            count: open.length,
            dotClassName: "bg-sky-400",
        },
        {
            value: "overdue",
            label: "Overdue",
            count: overdueCount,
            dotClassName: "bg-urgent",
        },
        {
            value: "completed",
            label: "Completed",
            count: tasks.filter((task) => task.completedAt && !task.deletedAt).length,
            dotClassName: "bg-emerald-400",
        },
        {
            value: "deleted",
            label: "Deleted",
            count: tasks.filter((task) => task.deletedAt).length,
            dotClassName: "bg-red-400",
        },
    ];
    const visible = tasks.filter((task) => {
        if (!taskMatchesTab(task, tab, !!completionFeedback[task.id], now)) return false;
        if (!taskMatchesDueFilter(task, due as TaskDueFilter, now)) return false;
        if (!taskMatchesLinkFilter(task, linked as TaskLinkFilter)) return false;
        const client = catalogs.clients.find((c) => c.id === task.clientId);
        const property = catalogs.properties.find((p) => p.id === task.propertyId);
        const owner = catalogs.owners.find((o) => o.id === task.ownerId);
        return matchesCrmSearch(deferredSearch, [
            task.title,
            task.details,
            client?.name ?? task.client?.name,
            owner?.name ?? task.owner?.name,
            property?.title ?? task.property?.title,
            property?.locality,
            property?.city,
        ]);
    });
    const close = () => {
        setError("");
        updateWorkspace({
            view: undefined,
            task: undefined,
            visitClient: undefined,
            visitProperty: undefined,
            visitTitle: undefined,
        });
    };
    const intent = (task: Task, nextView: string) => {
        setError("");
        updateWorkspace({ task: task.id, view: nextView });
    };
    const create = () => {
        setError("");
        updateWorkspace({
            task: undefined,
            view: "create",
            visitClient: undefined,
            visitProperty: undefined,
            visitTitle: undefined,
        });
    };
    useShortcut("add_task", create);
    const clear = () => updateWorkspace({ q: undefined, due: undefined, linked: undefined });
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
        const showFeedback = !task.completedAt && tab === "all";
        if (showFeedback) {
            setCompletionFeedback((current) => ({ ...current, [task.id]: Infinity }));
        }
        try {
            const now = Date.now();
            const nextId = crypto.randomUUID();
            await update((latest) =>
                setTaskCompleted(latest, task.id, !task.completedAt, now, nextId),
            );
            if (showFeedback) {
                setCompletionFeedback((current) => ({ ...current, [task.id]: Date.now() + 2000 }));
            } else {
                clearCompletionFeedback(task.id);
            }
            toast.success(
                task.completedAt
                    ? "Task reopened"
                    : nextTaskDates(task, now)
                      ? "Task completed · next occurrence added"
                      : "Task completed",
            );
        } catch (failure) {
            clearCompletionFeedback(task.id);
            setError(
                failure instanceof Error
                    ? failure.message
                    : "Your change couldn’t be saved. Try again.",
            );
        }
    };
    const changeTasks = async (updater: (latest: Task[]) => Task[], message?: string) => {
        if (busy) return false;
        setError("");
        try {
            await update(updater);
            if (message) toast.success(message);
            return true;
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : "Your change couldn't be saved. Please try again.",
            );
            return false;
        }
    };
    const restore = async (task: Task) => {
        if (
            await changeTasks((latest) => setTaskDeleted(latest, task.id, false), "Task restored")
        ) {
            if (view) close();
        }
    };
    const rename = (task: Task, change: TaskQuickChange) => {
        // Only an explicit empty-title submission reaches here; blur cancels an empty edit.
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
        extras?: Parameters<typeof createPlannerTask>[5],
    ) => {
        const task = createPlannerTask(
            title,
            date,
            Date.now(),
            crypto.randomUUID(),
            listId,
            extras,
        );
        return changeTasks((latest) => [...latest, task]);
    };
    const move = async (id: string, date: string | null, beforeId?: string, listId?: string) => {
        const saved = await changeTasks((latest) => {
            const original = new Map(latest.map((task) => [task.id, task.listId]));
            return movePlannerTask(
                latest.map((task) =>
                    task.listId || !task.startDate
                        ? { ...task, listId: taskListId(task, lists.notebook) }
                        : task,
                ),
                id,
                date,
                beforeId,
                Date.now(),
                listId,
            ).map((task) => (task.id === id ? task : { ...task, listId: original.get(task.id) }));
        }, "Task moved");
        if (saved && sort !== "manual") updateWorkspace({ sort: undefined });
        return saved;
    };
    const saveDraft = async (draft: TaskDraft) => {
        const editing = view !== "create" ? selected : undefined;
        const next = taskFromDraft(draft, {
            editing,
            mode: view as TaskDraftMode,
            catalogs,
            now: Date.now(),
            id: editing?.id ?? crypto.randomUUID(),
        });
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
                updateWorkspace({
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
            <PortalSectionNav>
                <header className={styles.header}>
                    <h1 className="h3 text-start min-inline-0">
                        <span className="text-ink">Tasks.</span>{" "}
                        <RotatingHeaderSummary
                            key={summaryLines.join("|")}
                            lines={summaryLines}
                            isLoading={isLoading}
                            loadingPlaceholder="Your tasks at a glance"
                        />
                    </h1>
                </header>
            </PortalSectionNav>
            <Tabs
                value={tab}
                onValueChange={(value) =>
                    updateWorkspace({
                        tab: value === "all" ? undefined : String(value),
                        due: undefined,
                    })
                }
                className={styles.workspace}
            >
                <div className={styles.toolbar}>
                    <div className={styles.filterTabs}>
                        <FilterChip
                            className={styles.filterButton}
                            label="Filters"
                            icon={SlidersHorizontal}
                            count={Number(!!due) + Number(!!linked)}
                            isActive={!!(due || linked)}
                            clearable={!!(due || linked)}
                            onClick={() => updateWorkspace({ view: "filters", task: undefined })}
                            onClear={() => updateWorkspace({ due: undefined, linked: undefined })}
                        />

                        <ResponsiveListStatus
                            value={tab}
                            options={tabs}
                            label="Status"
                            isLoading={isLoading}
                            onChange={(value) =>
                                updateWorkspace({
                                    tab: value === "all" ? undefined : value,
                                    due: undefined,
                                })
                            }
                        >
                            <StatusTabs
                                tabs={tabs}
                                value={tab}
                                label="Task views"
                                isLoading={isLoading}
                            />
                        </ResponsiveListStatus>
                    </div>
                    <div className={styles.searchField}>
                        <ListSearchField
                            searchHelp={CRM_SEARCH_HELP.tasks}
                            aria-label="Search tasks"
                            placeholder="Search"
                            value={search}
                            onChange={(q) => updateWorkspace({ q: q || undefined })}
                            debounceMs={0}
                            fullWidth
                        />
                    </div>
                    <div className={styles.tools}>
                        <ListToolbarSelect
                            active
                            label="Sort tasks"
                            mobileLabel="Sort"
                            className={styles.sortButton}
                            value={sort}
                            options={[
                                ...(tab === "all"
                                    ? [{ value: "manual", label: "Default order" }]
                                    : []),
                                {
                                    value: "due",
                                    label:
                                        tab === "completed"
                                            ? "Completion date"
                                            : tab === "deleted"
                                              ? "Deletion date"
                                              : "Due date",
                                },
                                { value: "priority", label: "Priority" },
                                { value: "newest", label: "Newest first" },
                                { value: "title", label: "Task name" },
                            ]}
                            onChange={(value) =>
                                updateWorkspace({
                                    sort: value === defaultSort ? undefined : value,
                                })
                            }
                        />
                        <ListAddButton
                            className={styles.addButton}
                            label="Add task"
                            shortcutId="add_task"
                            onClick={create}
                        />
                    </div>
                </div>
                <div className={styles.board}>
                    {(due || linked) && (
                        <div className={styles.activeFilters}>
                            {due && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => updateWorkspace({ due: undefined })}
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
                                    onClick={() => updateWorkspace({ linked: undefined })}
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
                    {loadError && (
                        <EmptyState
                            size="page"
                            variant="error"
                            icon={AlertCircle}
                            heading="Your tasks couldn’t be loaded"
                            description={
                                isLive
                                    ? "Check your connection and try again to see your follow-ups."
                                    : "Allow storage in this browser, or reset the task list to start empty."
                            }
                        >
                            <Button
                                size="sm"
                                variant="accent"
                                disabled={busy}
                                onClick={() =>
                                    void reset().catch(() =>
                                        setError(
                                            isLive
                                                ? "Your tasks still couldn’t be loaded. Check your connection and try again."
                                                : "Allow storage in this browser, then try loading tasks again.",
                                        ),
                                    )
                                }
                            >
                                {isLive ? "Try again" : "Reset task list"}
                            </Button>
                        </EmptyState>
                    )}
                    {error && !view && (
                        <p className={styles.error} role="alert">
                            {error}
                        </p>
                    )}
                    <TabsContent
                        value={tab}
                        className={styles.content}
                        aria-busy={isLoading || searchPending}
                    >
                        {isLoading || searchPending ? (
                            <TaskResultsSkeleton />
                        ) : loadError ? null : tab === "all" &&
                          !filtered &&
                          tasks.length === 0 &&
                          !lists.isLoading &&
                          lists.notebook.tabs.length === 1 &&
                          lists.notebook.lists.length === 1 ? (
                            <EmptyState
                                size="page"
                                icon={CheckCircle2}
                                heading="Make room for your next follow-up"
                                description="Add a call, a reminder or something to do. Link it to a client, owner or property when needed."
                            >
                                <Button variant="accent" onClick={create}>
                                    Add your first task
                                </Button>
                            </EmptyState>
                        ) : tab === "all" && !filtered ? (
                            <TaskPlanner
                                notebook={lists.notebook}
                                notebookLoading={lists.isLoading}
                                notebookError={lists.error?.message}
                                notebookBusy={lists.busy}
                                onNotebookChange={async (updater) => {
                                    try {
                                        await lists.update(updater);
                                        return true;
                                    } catch (failure) {
                                        setError(
                                            failure instanceof Error
                                                ? failure.message
                                                : "Your lists couldn't be saved. Try again.",
                                        );
                                        return false;
                                    }
                                }}
                                tasks={visible}
                                now={now}
                                sort={sort}
                                catalogs={catalogs}
                                busy={busy}
                                onOpen={(task) => intent(task, "detail")}
                                onComplete={complete}
                                onIntent={intent}
                                onRestore={restore}
                                onRename={rename}
                                onQuickChange={quickChange}
                                onAdd={quickAdd}
                                onMove={move}
                            />
                        ) : visible.length ? (
                            <TaskArchive
                                tasks={visible}
                                tab={tab === "all" ? "results" : tab}
                                now={now}
                                sort={sort}
                                catalogs={catalogs}
                                busy={busy}
                                onOpen={(task) => intent(task, "detail")}
                                onComplete={complete}
                                onIntent={intent}
                                onRestore={restore}
                                onRename={rename}
                                onQuickChange={quickChange}
                            />
                        ) : (
                            <EmptyState
                                size="page"
                                variant={filtered ? "filtered" : "default"}
                                icon={filtered ? Search : tab === "deleted" ? Trash2 : CheckCircle2}
                                heading={
                                    filtered
                                        ? "No tasks match these filters"
                                        : tab === "deleted"
                                          ? "No deleted tasks"
                                          : tab === "overdue"
                                            ? "No overdue tasks"
                                            : "Your finished tasks will live here"
                                }
                                description={
                                    filtered
                                        ? "Try another search or clear your filters to see more tasks."
                                        : tab === "deleted"
                                          ? "Tasks you delete will appear here. You can restore them whenever you need."
                                          : tab === "overdue"
                                            ? "You're caught up. Overdue follow-ups will show up here when a due date has passed."
                                            : "Check off a task when it's done. You can reopen it whenever plans change."
                                }
                            >
                                <Button
                                    variant="accent"
                                    onClick={
                                        filtered ? clear : () => updateWorkspace({ tab: undefined })
                                    }
                                >
                                    {filtered ? "Clear search & filters" : "Back to To do"}
                                </Button>
                            </EmptyState>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
            {view === "filters" && (
                <TaskFilters
                    due={due}
                    linked={linked}
                    onClose={close}
                    onApply={(values) => updateWorkspace({ ...values, view: undefined })}
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
                    key={`create-${params.get("visitClient") ?? ""}-${params.get("visitProperty") ?? ""}-${params.get("visitTitle") ?? ""}-${catalogs.ready}`}
                    mode="create"
                    prefill={{
                        title: (params.get("visitTitle") ?? "").slice(0, 160),
                        clientId: catalogs.clients.some(
                            (item) => item.id === params.get("visitClient"),
                        )
                            ? params.get("visitClient")!
                            : "",
                        propertyId: catalogs.properties.some(
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
            {selected &&
                !selected.deletedAt &&
                (view === "edit" || view === "reschedule" || view === "reminder") && (
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
            {selected &&
                (view === "detail" ||
                    (!!selected.deletedAt &&
                        ["edit", "reschedule", "reminder", "delete"].includes(view ?? ""))) && (
                    <TaskDetail
                        task={selected}
                        now={now}
                        busy={busy}
                        error={error}
                        onClose={close}
                        onComplete={() => complete(selected)}
                        onRestore={() => restore(selected)}
                        onIntent={(next) => intent(selected, next)}
                    />
                )}
            {selected && !selected.deletedAt && view === "delete" && (
                <TaskDeleteDialog
                    task={selected}
                    busy={busy}
                    error={error}
                    onClose={close}
                    onConfirm={async () => {
                        if (
                            await changeTasks(
                                (latest) => setTaskDeleted(latest, selected.id, true),
                                "Task moved to Deleted",
                            )
                        )
                            close();
                    }}
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
            compact
            title="Filter tasks"
            description="Find the follow-ups that need your attention."
            onClose={onClose}
            footer={
                <AppModalFooter
                    secondaryLabel="Reset"
                    onSecondary={() => {
                        setDate("");
                        setLink("");
                    }}
                    primaryLabel="Apply filters"
                    primaryVariant="accent"
                    onPrimary={() => onApply({ due: date || undefined, linked: link || undefined })}
                />
            }
        >
            <DrawerSection title="Due date" description="Choose when the tasks are due.">
                <fieldset className={styles.filterGroup}>
                    <legend className="sr-only">Due date</legend>
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
            </DrawerSection>
            <DrawerSection
                title="Linked records"
                description="Show tasks linked to clients, owners or properties."
            >
                <fieldset className={styles.filterGroup}>
                    <legend className="sr-only">Linked records</legend>
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
            </DrawerSection>
            <p className="body-sm mbs-4 text-ink-muted">
                Filters apply to the selected tab. Tasks can link to Clients, owners and properties.
            </p>
        </TaskPanel>
    );
}
