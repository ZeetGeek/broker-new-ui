"use client";

import { type FormEvent, useState } from "react";

import {
    horizontalListSortingStrategy,
    rectSortingStrategy,
    SortableContext,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

import {
    ArrowLeft,
    ArrowRight,
    ChevronDown,
    Equal,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    X,
} from "@/components/shared/icons";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    | "onAdd"
> & {
    activeTab: string;
    onSelectTab: (id: string) => void;
    today: string;
    actions: TaskPlannerColumnProps["actions"];
    dragPreview?: PlannerDragPreview | null;
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
    onAdd,
    activeTab,
    onSelectTab,
    today,
    actions,
    dragPreview,
}: TaskListsProps) {
    const [open, setOpen] = useState(true);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [notice, setNotice] = useState("");
    const lists = notebook.lists.filter((list) => list.tabId === activeTab);
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
                <div className={styles.listTabs} role="tablist" aria-label="Custom list tabs">
                    <SortableContext
                        items={notebook.tabs.map((tab) => `tab:${tab.id}`)}
                        strategy={horizontalListSortingStrategy}
                    >
                        {notebook.tabs.map((tab, index) => (
                            <ListTab
                                key={tab.id}
                                tab={tab}
                                selected={activeTab === tab.id}
                                count={
                                    notebook.lists.filter((list) => list.tabId === tab.id).length
                                }
                                busy={busy}
                                onSelect={() => {
                                    onSelectTab(tab.id);
                                    setOpen(true);
                                    setEditor(null);
                                }}
                                onRename={() =>
                                    setEditor({ kind: "tab", id: tab.id, name: tab.name })
                                }
                                onAddList={() => {
                                    onSelectTab(tab.id);
                                    setOpen(true);
                                    setEditor({ kind: "new-list", id: "", name: "" });
                                }}
                                onDelete={() =>
                                    void change(
                                        (latest) => deleteNotebookTab(latest, tab.id),
                                        `Tab deleted. Its lists are now in ${notebook.tabs.find((item) => item.id !== tab.id)?.name}.`,
                                    )
                                }
                                onShift={(direction) =>
                                    void change((latest) =>
                                        reorderNotebookTab(latest, tab.id, direction),
                                    )
                                }
                                isFirst={index === 0}
                                isLast={index === notebook.tabs.length - 1}
                                onlyTab={notebook.tabs.length === 1}
                            />
                        ))}
                    </SortableContext>
                </div>
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
            {editor && (
                <div className={styles.notebookEditor}>
                    <NameEditor
                        key={`${editor.kind}-${editor.id}`}
                        label={
                            editor.kind === "new-tab"
                                ? "New tab name"
                                : editor.kind === "new-list"
                                  ? "New list name"
                                  : `Rename ${editor.kind}`
                        }
                        initial={editor.name}
                        busy={busy}
                        onSave={saveName}
                        onCancel={() => setEditor(null)}
                    />
                </div>
            )}
            {notebookError && (
                <p className={styles.notebookError} role="alert">
                    {notebookError}
                </p>
            )}
            <span className="sr-only" role="status">
                {notice}
            </span>
            {open && (
                <section
                    id="task-someday"
                    role="tabpanel"
                    aria-labelledby={`notebook-tab-${activeTab}`}
                    className={styles.somedayGrid}
                >
                    {notebookLoading ? (
                        <p className={styles.notebookLoading} role="status">
                            Loading your listsâ€¦
                        </p>
                    ) : (
                        !notebookError && (
                            <SortableContext
                                items={lists.map((list) => `list:${list.id}`)}
                                strategy={rectSortingStrategy}
                            >
                                {lists.map((list, index) => (
                                    <SortableList
                                        key={list.id}
                                        list={list}
                                        tabs={notebook.tabs}
                                        busy={busy}
                                        onlyList={notebook.lists.length === 1}
                                        isFirst={index === 0}
                                        isLast={index === lists.length - 1}
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
                                            onAdd={onAdd}
                                            actions={actions}
                                        />
                                    </SortableList>
                                ))}
                            </SortableContext>
                        )
                    )}
                </section>
            )}
        </>
    );
}

function ListTab({
    tab,
    count,
    selected,
    busy,
    onSelect,
    onRename,
    onAddList,
    onDelete,
    onShift,
    isFirst,
    isLast,
    onlyTab,
}: {
    tab: NotebookTab;
    count: number;
    selected: boolean;
    busy: boolean;
    onSelect: () => void;
    onRename: () => void;
    onAddList: () => void;
    onDelete: () => void;
    onShift: (direction: -1 | 1) => void;
    isFirst: boolean;
    isLast: boolean;
    onlyTab: boolean;
}) {
    const {
        setNodeRef,
        setActivatorNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({
        id: `tab:${tab.id}`,
        data: { kind: "tab", tabId: tab.id },
        disabled: { draggable: busy || onlyTab, droppable: busy },
    });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(
                styles.listTab,
                selected && styles.selectedListTab,
                isOver && styles.tabDropTarget,
                isDragging && styles.dragging,
            )}
        >
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <button
                            type="button"
                            className={styles.tabMenu}
                            disabled={busy}
                            aria-label={`Manage tab ${tab.name}`}
                        />
                    }
                >
                    <MoreHorizontal className="rotate-90" aria-hidden size={12} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={onAddList}>
                        <Plus aria-hidden />
                        Add list
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onRename}>
                        <Pencil aria-hidden />
                        Rename tab
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={isFirst} onClick={() => onShift(-1)}>
                        <ArrowLeft aria-hidden />
                        Move tab left
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={isLast} onClick={() => onShift(1)}>
                        <ArrowRight aria-hidden />
                        Move tab right
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" disabled={onlyTab} onClick={onDelete}>
                        <Trash2 aria-hidden />
                        Delete tab{onlyTab ? " (last tab)" : ""}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <button
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                type="button"
                role="tab"
                aria-pressed={undefined}
                id={`notebook-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls="task-someday"
                className={styles.listTabButton}
                disabled={busy}
                title={onlyTab ? tab.name : `Drag ${tab.name} left or right to reorder`}
                onClick={onSelect}
                onKeyDown={(event) => {
                    listeners?.onKeyDown?.(event);
                    if (isDragging) return;
                    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                    event.preventDefault();
                    const items = Array.from(
                        event.currentTarget
                            .closest('[role="tablist"]')!
                            .querySelectorAll<HTMLButtonElement>('[role="tab"]'),
                    );
                    const index = items.indexOf(event.currentTarget);
                    const next =
                        event.key === "Home"
                            ? 0
                            : event.key === "End"
                              ? items.length - 1
                              : (index + (event.key === "ArrowRight" ? 1 : -1) + items.length) %
                                items.length;
                    items[next].focus();
                    items[next].click();
                }}
            >
                <span title={tab.name}>{tab.name}</span>
                <small aria-label={`${count} ${count === 1 ? "list" : "lists"}`}>{count}</small>
            </button>
        </div>
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
            <div className={styles.customListControls}>
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
                    <DropdownMenuContent align="start">
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
                        <DropdownMenuItem
                            variant="destructive"
                            disabled={onlyList}
                            onClick={onDelete}
                        >
                            <Trash2 aria-hidden />
                            Delete list{onlyList ? " (last list)" : ""}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {children}
        </div>
    );
}

function NameEditor({
    label,
    initial,
    busy,
    onSave,
    onCancel,
}: {
    label: string;
    initial: string;
    busy: boolean;
    onSave: (name: string) => Promise<boolean>;
    onCancel: () => void;
}) {
    const [name, setName] = useState(initial);
    const [error, setError] = useState("");
    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (busy) return;
        const result = notebookName.safeParse(name);
        if (!result.success) {
            setError(result.error.issues[0].message);
            return;
        }
        void onSave(result.data);
    };
    return (
        <form className={styles.nameForm} onSubmit={submit}>
            <label htmlFor="notebook-item-name">{label}</label>
            <input
                id="notebook-item-name"
                autoFocus
                value={name}
                maxLength={80}
                onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                }}
                onKeyDown={(event) => {
                    if (event.key === "Escape") onCancel();
                }}
                disabled={busy}
                aria-invalid={!!error}
                aria-describedby={error ? "notebook-name-error" : undefined}
            />
            <button type="submit" disabled={busy}>
                {initial ? "Save" : "Create"}
            </button>
            <button type="button" onClick={onCancel} disabled={busy} aria-label="Cancel name entry">
                <X aria-hidden size={16} />
            </button>
            {error && (
                <p id="notebook-name-error" role="alert">
                    {error}
                </p>
            )}
        </form>
    );
}
