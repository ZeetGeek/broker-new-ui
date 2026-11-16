"use client";

import {
    cloneElement,
    type CSSProperties,
    type FormEvent,
    isValidElement,
    useEffect,
    useId,
    useState,
} from "react";

import { rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import {
    ArrowLeft,
    ArrowRight,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Equal,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import {
    addNotebookList,
    addNotebookTab,
    deleteNotebookList,
    deleteNotebookTab,
    moveNotebookList,
    type NotebookList,
    notebookName,
    type NotebookTab,
    renameNotebookItem,
    reorderNotebookTab,
} from "./notebook-model";
import type { NotebookUpdater } from "./notebook-store";
import { plannerColumnTasks, type PlannerDragPreview } from "./planner-model";
import type { TaskPlannerColumnProps, TaskPlannerProps } from "./task-planner";
import { PlannerColumn } from "./task-planner";

import styles from "./planner.module.css";

export type TaskListsProps = Pick<
    TaskPlannerProps,
    | "notebook"
    | "notebookLoading"
    | "notebookError"
    | "notebookBusy"
    | "onNotebookChange"
    | "tasks"
    | "sort"
    | "catalogs"
    | "onAdd"
> & {
    activeTab: string;
    onSelectTab: (id: string) => void;
    today: string;
    actions: TaskPlannerColumnProps["actions"];
    dragPreview?: PlannerDragPreview | null;
    listColumns: number;
};
type Editor = { kind: "new-tab" | "new-list" | "tab" | "list"; id: string; name: string };

export function TaskLists({
    notebook,
    notebookLoading,
    notebookError,
    notebookBusy,
    onNotebookChange,
    tasks,
    sort,
    catalogs,
    onAdd,
    activeTab,
    onSelectTab,
    today,
    actions,
    dragPreview,
    listColumns,
}: TaskListsProps) {
    const [open, setOpen] = useState(true);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [notice, setNotice] = useState("");
    const lists = notebook.lists.filter((list) => list.tabId === activeTab);
    const activeNotebookTab = notebook.tabs.find((tab) => tab.id === activeTab);
    const activeTabIndex = notebook.tabs.findIndex((tab) => tab.id === activeTab);
    const [listPage, setListPage] = useState(0);
    useEffect(() => {
        setListPage(0);
    }, [activeTab]);
    useEffect(() => {
        setListPage(0);
    }, [listColumns]);
    const listCount = lists.length;
    const listStride = Math.max(1, listColumns);
    const pageCount = Math.max(1, Math.ceil(listCount / listStride));
    const maxPage = pageCount - 1;
    useEffect(() => {
        setListPage((page) => Math.min(page, maxPage));
    }, [listCount, maxPage]);
    const canPrevList = listPage > 0;
    const canNextList = listPage < maxPage;
    const visibleLists = lists.slice(listPage * listStride, listPage * listStride + listStride);
    const busy = notebookBusy || actions.busy || notebookLoading || !!notebookError;
    const change = async (updater: NotebookUpdater, message?: string) => {
        const saved = await onNotebookChange(updater);
        if (saved && message) setNotice(message);
        return saved;
    };
    const saveName = async (name: string) => {
        if (!editor || busy) return false;
        const id = crypto.randomUUID();
        const saved = await change((latest) =>
            editor.kind === "new-tab"
                ? addNotebookTab(latest, name, id)
                : editor.kind === "new-list"
                  ? addNotebookList(latest, activeTab, name, id)
                  : renameNotebookItem(latest, editor.kind, editor.id, name),
        );
        if (saved) {
            if (editor.kind === "new-tab") onSelectTab(id);
            setEditor(null);
            setOpen(true);
        }
        return saved;
    };
    const reorderList = (list: NotebookList, direction: -1 | 1) => {
        const index = lists.findIndex((item) => item.id === list.id);
        const beforeId = direction === -1 ? lists[index - 1]?.id : lists[index + 2]?.id;
        void change((latest) => moveNotebookList(latest, list.id, activeTab, beforeId));
    };
    return (
        <>
            <div className={styles.somedayBar}>
                <div className={styles.somedayBarStart}>
                    {activeNotebookTab ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <button
                                        type="button"
                                        className={styles.tabMenu}
                                        disabled={busy}
                                        aria-label={`Manage tab ${activeNotebookTab.name}`}
                                    />
                                }
                            >
                                <MoreHorizontal className="rotate-90" aria-hidden size={12} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                    onClick={() => {
                                        setEditor({
                                            kind: "new-list",
                                            id: "",
                                            name: "",
                                        });
                                        setOpen(true);
                                    }}
                                >
                                    <Plus aria-hidden />
                                    Add list
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        setEditor({
                                            kind: "tab",
                                            id: activeNotebookTab.id,
                                            name: activeNotebookTab.name,
                                        })
                                    }
                                >
                                    <Pencil aria-hidden />
                                    Rename tab
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    disabled={activeTabIndex === 0}
                                    onClick={() =>
                                        void change((latest) =>
                                            reorderNotebookTab(latest, activeNotebookTab.id, -1),
                                        )
                                    }
                                >
                                    <ArrowLeft aria-hidden />
                                    Move tab left
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    disabled={activeTabIndex === notebook.tabs.length - 1}
                                    onClick={() =>
                                        void change((latest) =>
                                            reorderNotebookTab(latest, activeNotebookTab.id, 1),
                                        )
                                    }
                                >
                                    <ArrowRight aria-hidden />
                                    Move tab right
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    disabled={notebook.tabs.length === 1}
                                    onClick={() =>
                                        void change(
                                            (latest) =>
                                                deleteNotebookTab(latest, activeNotebookTab.id),
                                            `Tab deleted. Its lists are now in ${notebook.tabs.find((item) => item.id !== activeNotebookTab.id)?.name}.`,
                                        )
                                    }
                                >
                                    <Trash2 aria-hidden />
                                    Delete tab
                                    {notebook.tabs.length === 1 ? " (last tab)" : ""}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : null}
                    <button
                        type="button"
                        className={styles.addTabButton}
                        aria-label="Create tab"
                        title="Create tab"
                        disabled={busy}
                        onClick={() => {
                            setEditor({ kind: "new-tab", id: "", name: "" });
                            setOpen(true);
                        }}
                    >
                        <Plus aria-hidden size={14} />
                    </button>
                    <SlidingTabs
                        value={activeTab}
                        options={notebook.tabs.map((tab) => {
                            const count = notebook.lists.filter(
                                (list) => list.tabId === tab.id,
                            ).length;
                            return {
                                value: tab.id,
                                label: (
                                    <span className={styles.slidingTabLabel}>
                                        <span>{tab.name}</span>
                                        <span
                                            className={styles.slidingTabCount}
                                            aria-label={`${count} ${count === 1 ? "list" : "lists"}`}
                                        >
                                            {count}
                                        </span>
                                    </span>
                                ),
                                ariaLabel: `${tab.name}, ${count} ${count === 1 ? "list" : "lists"}`,
                            };
                        })}
                        onValueChange={(id) => {
                            onSelectTab(id);
                            setOpen(true);
                            setEditor(null);
                        }}
                        label="Custom list tabs"
                        panelId="task-someday"
                        className={cn(styles.plannerUnderlineTabs, styles.notebookTabPicker)}
                    />
                </div>
                <div className={styles.somedayBarEnd}>
                    {listCount > listStride && (
                        <div className={styles.listTabNav} aria-label="Browse lists in this tab">
                            <button
                                type="button"
                                className={styles.navButton}
                                aria-label="Previous lists"
                                disabled={!canPrevList}
                                onClick={() => setListPage((page) => Math.max(0, page - 1))}
                            >
                                <ChevronLeft aria-hidden size={16} />
                            </button>
                            <button
                                type="button"
                                className={styles.navButton}
                                aria-label="Next lists"
                                disabled={!canNextList}
                                onClick={() => setListPage((page) => Math.min(maxPage, page + 1))}
                            >
                                <ChevronRight aria-hidden size={16} />
                            </button>
                        </div>
                    )}
                    <button
                        type="button"
                        className={styles.collapseLists}
                        aria-label={open ? "Collapse lists" : "Expand lists"}
                        aria-expanded={open}
                        aria-controls="task-someday"
                        onClick={() => setOpen(!open)}
                    >
                        <ChevronDown aria-hidden size={14} data-collapsed={!open || undefined} />
                    </button>
                </div>
            </div>
            {editor && (
                <NameEditor
                    key={`${editor.kind}-${editor.id}`}
                    title={
                        editor.kind === "new-tab"
                            ? "Create tab"
                            : editor.kind === "new-list"
                              ? "Create list"
                              : `Rename ${editor.kind}`
                    }
                    label={
                        editor.kind === "new-tab" || editor.kind === "tab"
                            ? "Tab name"
                            : "List name"
                    }
                    initial={editor.name}
                    busy={busy}
                    onSave={saveName}
                    onCancel={() => setEditor(null)}
                />
            )}
            {notebookError && (
                <p className={styles.notebookError} role="alert">
                    {notebookError}
                </p>
            )}
            <span className="sr-only" role="status">
                {notice}
                {open && listCount > 0
                    ? `Showing lists ${listPage * listStride + 1}–${Math.min(listCount, listPage * listStride + listStride)} of ${listCount}`
                    : ""}
            </span>
            {open && (
                <section
                    id="task-someday"
                    role="tabpanel"
                    aria-label={`${activeNotebookTab?.name ?? "My lists"} lists`}
                    className={styles.somedayGrid}
                    style={{ "--planner-list-columns": listColumns } as CSSProperties}
                >
                    {notebookLoading ? (
                        <p className={styles.notebookLoading} role="status">
                            Loading your lists…
                        </p>
                    ) : (
                        !notebookError && (
                            <SortableContext
                                items={lists.map((list) => `list:${list.id}`)}
                                strategy={rectSortingStrategy}
                            >
                                {Array.from({ length: listColumns }, (_, slot) => {
                                    const list = visibleLists[slot];
                                    const index = listPage * listStride + slot;
                                    if (!list) {
                                        return (
                                            <div
                                                key={`empty-list-${slot}`}
                                                className={styles.emptyListColumn}
                                                aria-hidden
                                            >
                                                <header className={styles.dayHeading}>
                                                    <h2 className="h5">&nbsp;</h2>
                                                </header>
                                                <ul className={styles.ruledList}>
                                                    {Array.from({ length: 9 }, (_, line) => (
                                                        <li
                                                            key={line}
                                                            className={styles.blankLine}
                                                        />
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    }
                                    return (
                                        <SortableList
                                            key={list.id}
                                            list={list}
                                            tabs={notebook.tabs}
                                            busy={busy}
                                            onlyList={notebook.lists.length === 1}
                                            isFirst={index === 0}
                                            isLast={index === listCount - 1}
                                            onRename={() =>
                                                setEditor({
                                                    kind: "list",
                                                    id: list.id,
                                                    name: list.name,
                                                })
                                            }
                                            onDelete={() =>
                                                void change(
                                                    (latest) => deleteNotebookList(latest, list.id),
                                                    "List deleted. Its tasks are safe in your default list.",
                                                )
                                            }
                                            onMoveTab={(tabId) =>
                                                void change(
                                                    (latest) =>
                                                        moveNotebookList(latest, list.id, tabId),
                                                    `List moved to ${notebook.tabs.find((tab) => tab.id === tabId)?.name}.`,
                                                )
                                            }
                                            onShift={(direction) => reorderList(list, direction)}
                                        >
                                            <PlannerColumn
                                                date={null}
                                                listId={list.id}
                                                name={list.name}
                                                today={today}
                                                tasks={plannerColumnTasks(
                                                    tasks,
                                                    null,
                                                    list.id,
                                                    notebook,
                                                    today,
                                                    sort,
                                                    dragPreview,
                                                )}
                                                catalogs={catalogs}
                                                onAdd={onAdd}
                                                actions={actions}
                                            />
                                        </SortableList>
                                    );
                                })}
                            </SortableContext>
                        )
                    )}
                </section>
            )}
        </>
    );
}

function SortableList({
    list,
    tabs,
    children,
    busy,
    onlyList,
    isFirst,
    isLast,
    onRename,
    onDelete,
    onShift,
    onMoveTab,
}: {
    list: NotebookList;
    tabs: NotebookTab[];
    children: React.ReactNode;
    busy: boolean;
    onlyList: boolean;
    isFirst: boolean;
    isLast: boolean;
    onRename: () => void;
    onDelete: () => void;
    onShift: (direction: -1 | 1) => void;
    onMoveTab: (tabId: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `list:${list.id}`,
        data: { kind: "list", listId: list.id, tabId: list.tabId },
        disabled: busy,
    });
    const headingActions = (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <button
                        type="button"
                        className={styles.listMenu}
                        disabled={busy}
                        aria-label={`Manage list ${list.name}`}
                    />
                }
            >
                <MoreHorizontal className="rotate-90" aria-hidden size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onRename}>
                    <Pencil aria-hidden />
                    Rename list
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isFirst} onClick={() => onShift(-1)}>
                    <ArrowLeft aria-hidden />
                    Move list left
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isLast} onClick={() => onShift(1)}>
                    <ArrowRight aria-hidden />
                    Move list right
                </DropdownMenuItem>
                {tabs
                    .filter((tab) => tab.id !== list.tabId)
                    .map((tab) => (
                        <DropdownMenuItem key={tab.id} onClick={() => onMoveTab(tab.id)}>
                            Move to {tab.name}
                        </DropdownMenuItem>
                    ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" disabled={onlyList} onClick={onDelete}>
                    <Trash2 aria-hidden />
                    Delete list{onlyList ? " (last list)" : ""}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
    const column = isValidElement(children)
        ? cloneElement(children, { headingActions } as Partial<TaskPlannerColumnProps>)
        : children;
    return (
        <div
            ref={setNodeRef}
            className={cn(styles.customList, isDragging && styles.dragging)}
            style={{ transform: CSS.Transform.toString(transform), transition }}
        >
            <button
                type="button"
                className={styles.listDragHandle}
                {...attributes}
                {...listeners}
                aria-label={`Reorder list ${list.name}`}
            >
                <Equal aria-hidden size={16} strokeWidth={2.5} />
            </button>
            {column}
        </div>
    );
}

function NameEditor({
    title,
    label,
    initial,
    busy,
    onSave,
    onCancel,
}: {
    title: string;
    label: string;
    initial: string;
    busy: boolean;
    onSave: (name: string) => Promise<boolean>;
    onCancel: () => void;
}) {
    const [name, setName] = useState(initial);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const formId = useId();
    const inputId = useId();
    const errorId = useId();
    const pending = busy || saving;
    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (pending) return;
        const result = notebookName.safeParse(name);
        if (!result.success) {
            setError(result.error.issues[0].message);
            return;
        }
        setError("");
        setSaving(true);
        try {
            if (!(await onSave(result.data))) {
                setError("The name couldn't be saved. Please try again.");
            }
        } catch {
            setError("The name couldn't be saved. Please try again.");
        } finally {
            setSaving(false);
        }
    };
    return (
        <AppModal
            open
            title={title}
            size="sm"
            padding="md"
            onOpenChange={(open) => {
                if (!open && !pending) onCancel();
            }}
            footer={
                <div className={styles.nameActions}>
                    <Button variant="outline" onClick={onCancel} disabled={pending}>
                        Cancel
                    </Button>
                    <Button type="submit" form={formId} variant="accent" loading={pending}>
                        {initial ? "Save changes" : title}
                    </Button>
                </div>
            }
        >
            <form id={formId} className={styles.nameForm} onSubmit={submit}>
                <label className={styles.nameLabel} htmlFor={inputId}>
                    {label}
                </label>
                <Input
                    id={inputId}
                    autoFocus
                    value={name}
                    maxLength={80}
                    placeholder={label === "Tab name" ? "e.g. Work" : "e.g. Follow-ups"}
                    onValueChange={(value) => {
                        setName(value);
                        setError("");
                    }}
                    disabled={pending}
                    aria-invalid={!!error}
                    aria-describedby={error ? errorId : undefined}
                />
                {error && (
                    <p className={styles.nameError} id={errorId} role="alert">
                        {error}
                    </p>
                )}
            </form>
        </AppModal>
    );
}
