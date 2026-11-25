"use client";
import {
    cloneElement,
    type CSSProperties,
    type FormEvent,
    isValidElement,
    type ReactNode,
    useEffect,
    useId,
    useRef,
    useState,
} from "react";

import { rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { measuredCssToRem } from "@/lib/styles/rem";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { IconButton } from "@/components/shared/icon-button";
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
import {
    mobileActionClass,
    MobileActionDrawer,
    mobileActionGroupClass,
} from "@/components/shared/mobile-action-drawer";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
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
    isNewListSlot,
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
    const openNewListEditor = () => {
        setEditor({ kind: "new-list", id: "", name: "" });
        setOpen(true);
    };
    const newListLinkButton = (
        <Button
            type="button"
            variant="link"
            size="sm"
            className="
              gap-1 p-0 text-xs font-bold tracking-wide text-brand uppercase block-auto min-block-0
              hover:text-brand-text
            "
            disabled={busy}
            onClick={openNewListEditor}
        >
            <Plus aria-hidden size={14} />
            New list
        </Button>
    );
    const showListPageNav = listCount > listStride;
    const listPageChevrons = showListPageNav ? (
        <div className={styles.listTabNav} aria-label="Browse lists in this tab">
            <IconButton
                type="button"
                size="sm"
                tone="brand"
                className="text-brand hover:text-brand-text disabled:opacity-35"
                aria-label="Previous lists"
                disabled={!canPrevList}
                onClick={() => setListPage((page) => Math.max(0, page - 1))}
            >
                <ChevronLeft aria-hidden size={16} />
            </IconButton>
            <IconButton
                type="button"
                size="sm"
                tone="brand"
                className="text-brand hover:text-brand-text disabled:opacity-35"
                aria-label="Next lists"
                disabled={!canNextList}
                onClick={() => setListPage((page) => Math.min(maxPage, page + 1))}
            >
                <ChevronRight aria-hidden size={16} />
            </IconButton>
        </div>
    ) : null;
    return (
        <>
            <div className={styles.somedayBar}>
                <div className={styles.somedayBarStart}>
                    <IconButton
                        size="sm"
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
                    </IconButton>
                    <SlidingTabs
                        value={activeTab}
                        options={notebook.tabs.map((tab, tabIndex) => {
                            const count = notebook.lists.filter(
                                (list) => list.tabId === tab.id,
                            ).length;
                            return {
                                value: tab.id,
                                label: (
                                    <span className={styles.slidingTabLabel}>
                                        <span className={styles.slidingTabName}>{tab.name}</span>
                                        <NotebookTabManageMenu
                                            tab={tab}
                                            tabIndex={tabIndex}
                                            tabCount={notebook.tabs.length}
                                            busy={busy}
                                            menuAlign="start"
                                            triggerClassName={styles.notebookTabMenu}
                                            onRename={() => {
                                                if (tab.id !== activeTab) onSelectTab(tab.id);
                                                window.setTimeout(() => {
                                                    setEditor({
                                                        kind: "tab",
                                                        id: tab.id,
                                                        name: tab.name,
                                                    });
                                                }, 0);
                                            }}
                                            onMoveLeft={() =>
                                                void change((latest) =>
                                                    reorderNotebookTab(latest, tab.id, -1),
                                                )
                                            }
                                            onMoveRight={() =>
                                                void change((latest) =>
                                                    reorderNotebookTab(latest, tab.id, 1),
                                                )
                                            }
                                            onDelete={() =>
                                                void change(
                                                    (latest) => deleteNotebookTab(latest, tab.id),
                                                    tab.id === activeTab
                                                        ? `Tab deleted. Its lists are now in ${notebook.tabs.find((item) => item.id !== tab.id)?.name}.`
                                                        : "Tab deleted.",
                                                )
                                            }
                                        />
                                    </span>
                                ),
                                count,
                                ariaLabel: `${tab.name}, ${count} ${count === 1 ? "list" : "lists"}`,
                            };
                        })}
                        onValueChange={(id) => {
                            if (id !== activeTab) setEditor(null);
                            onSelectTab(id);
                            setOpen(true);
                        }}
                        label="Custom list tabs"
                        panelId="task-someday"
                        height={36}
                        className={styles.notebookTabPicker}
                    />
                </div>
                <div className={styles.somedayBarEnd}>
                    <IconButton
                        size="sm"
                        type="button"
                        className={styles.collapseLists}
                        aria-label={open ? "Collapse lists" : "Expand lists"}
                        aria-expanded={open}
                        aria-controls="task-someday"
                        onClick={() => setOpen(!open)}
                    >
                        <ChevronDown aria-hidden size={14} data-collapsed={!open || undefined} />
                    </IconButton>
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
                                        if (
                                            isNewListSlot({
                                                slot,
                                                listColumns,
                                                visibleCount: visibleLists.length,
                                                listCount,
                                            })
                                        ) {
                                            return (
                                                <div
                                                    key={`new-list-${slot}`}
                                                    className={styles.newListColumn}
                                                >
                                                    <header className={styles.dayHeading}>
                                                        {newListLinkButton}
                                                    </header>
                                                    <ul className={styles.ruledList} aria-hidden>
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
                                    const isLeadListColumn =
                                        slot === 0 && list.id === visibleLists[0]?.id;
                                    const showColumnListNav = showListPageNav && isLeadListColumn;
                                    const showNewListInHeader =
                                        listColumns === 1 && isLeadListColumn;
                                    // Only when every column on this page already has a list.
                                    const showNewListAtBottom =
                                        listColumns > 1 &&
                                        visibleLists.length >= listColumns &&
                                        isLeadListColumn;
                                    return (
                                        <SortableList
                                            key={list.id}
                                            list={list}
                                            tabs={notebook.tabs}
                                            busy={busy}
                                            onlyList={notebook.lists.length === 1}
                                            isFirst={index === 0}
                                            isLast={index === listCount - 1}
                                            headingLeading={
                                                showNewListInHeader ? (
                                                    <div className={styles.listHeadingNewList}>
                                                        {newListLinkButton}
                                                    </div>
                                                ) : undefined
                                            }
                                            headingNav={
                                                showColumnListNav ? listPageChevrons : undefined
                                            }
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
                                                listFooter={
                                                    showNewListAtBottom
                                                        ? newListLinkButton
                                                        : undefined
                                                }
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

function NotebookTabManageMenu({
    tab,
    tabIndex,
    tabCount,
    busy,
    menuAlign,
    triggerClassName,
    onRename,
    onMoveLeft,
    onMoveRight,
    onDelete,
}: {
    tab: NotebookTab;
    tabIndex: number;
    tabCount: number;
    busy: boolean;
    menuAlign: "start" | "end";
    triggerClassName?: string;
    onRename: () => void;
    onMoveLeft: () => void;
    onMoveRight: () => void;
    onDelete: () => void;
}) {
    const mobile = useMobileMenu();
    const [open, setOpen] = useState(false);
    const afterClose = useRef<(() => void) | null>(null);
    const runAfterClose = (action: () => void) => {
        afterClose.current = action;
        setOpen(false);
    };
    const trigger = (
        <IconButton
            size="xs"
            type="button"
            className={triggerClassName}
            appearance="ghost"
            disabled={busy}
            aria-label={`Manage tab ${tab.name}`}
            data-sliding-tab-action=""
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <MoreHorizontal className="rotate-90" aria-hidden size={12} />
        </IconButton>
    );

    if (mobile) {
        return (
            <MobileActionDrawer
                open={open}
                onOpenChange={setOpen}
                onOpenChangeComplete={(nextOpen) => {
                    if (nextOpen) return;
                    const action = afterClose.current;
                    afterClose.current = null;
                    action?.();
                }}
                title="Tab actions"
                description={tab.name}
                trigger={trigger}
            >
                <div className={mobileActionGroupClass}>
                    <button
                        type="button"
                        className={mobileActionClass}
                        disabled={busy}
                        onClick={() => runAfterClose(onRename)}
                    >
                        <Pencil aria-hidden />
                        Rename tab
                    </button>
                    <button
                        type="button"
                        className={mobileActionClass}
                        disabled={busy || tabIndex === 0}
                        onClick={() => runAfterClose(onMoveLeft)}
                    >
                        <ArrowLeft aria-hidden />
                        Move tab left
                    </button>
                    <button
                        type="button"
                        className={mobileActionClass}
                        disabled={busy || tabIndex === tabCount - 1}
                        onClick={() => runAfterClose(onMoveRight)}
                    >
                        <ArrowRight aria-hidden />
                        Move tab right
                    </button>
                </div>
                <div className={mobileActionGroupClass}>
                    <button
                        type="button"
                        className={mobileActionClass}
                        data-destructive="true"
                        disabled={busy || tabCount === 1}
                        onClick={() => runAfterClose(onDelete)}
                    >
                        <Trash2 aria-hidden />
                        Delete tab{tabCount === 1 ? " (last tab)" : ""}
                    </button>
                </div>
            </MobileActionDrawer>
        );
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger render={trigger} />
            <DropdownMenuContent align={menuAlign}>
                <DropdownMenuItem
                    onClick={(event) => {
                        event.preventDefault();
                        onRename();
                    }}
                >
                    <Pencil aria-hidden />
                    Rename tab
                </DropdownMenuItem>
                <DropdownMenuItem disabled={tabIndex === 0} onClick={onMoveLeft}>
                    <ArrowLeft aria-hidden />
                    Move tab left
                </DropdownMenuItem>
                <DropdownMenuItem disabled={tabIndex === tabCount - 1} onClick={onMoveRight}>
                    <ArrowRight aria-hidden />
                    Move tab right
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    disabled={tabCount === 1}
                    onClick={onDelete}
                >
                    <Trash2 aria-hidden />
                    Delete tab{tabCount === 1 ? " (last tab)" : ""}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
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
    headingLeading,
    headingNav,
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
    headingLeading?: ReactNode;
    headingNav?: ReactNode;
    onRename: () => void;
    onDelete: () => void;
    onShift: (direction: -1 | 1) => void;
    onMoveTab: (tabId: string) => void;
}) {
    const mobile = useMobileMenu();
    const [menuOpen, setMenuOpen] = useState(false);
    const afterMenuClose = useRef<(() => void) | null>(null);
    const runAfterMenuClose = (action: () => void) => {
        afterMenuClose.current = action;
        setMenuOpen(false);
    };
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `list:${list.id}`,
        data: { kind: "list", listId: list.id, tabId: list.tabId },
        disabled: busy,
    });
    const listMenuTrigger = (
        <IconButton
            size="sm"
            type="button"
            className={styles.listMenu}
            disabled={busy}
            aria-label={`Manage list ${list.name}`}
        >
            <MoreHorizontal className="rotate-90" aria-hidden size={14} />
        </IconButton>
    );
    const otherTabs = tabs.filter((tab) => tab.id !== list.tabId);
    const listMenu = mobile ? (
        <MobileActionDrawer
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onOpenChangeComplete={(nextOpen) => {
                if (nextOpen) return;
                const action = afterMenuClose.current;
                afterMenuClose.current = null;
                action?.();
            }}
            title="List actions"
            description={list.name}
            trigger={listMenuTrigger}
        >
            <div className={mobileActionGroupClass}>
                <button
                    type="button"
                    className={mobileActionClass}
                    disabled={busy}
                    onClick={() => runAfterMenuClose(onRename)}
                >
                    <Pencil aria-hidden />
                    Rename list
                </button>
                <button
                    type="button"
                    className={mobileActionClass}
                    disabled={busy || isFirst}
                    onClick={() => runAfterMenuClose(() => onShift(-1))}
                >
                    <ArrowLeft aria-hidden />
                    Move list left
                </button>
                <button
                    type="button"
                    className={mobileActionClass}
                    disabled={busy || isLast}
                    onClick={() => runAfterMenuClose(() => onShift(1))}
                >
                    <ArrowRight aria-hidden />
                    Move list right
                </button>
            </div>
            {otherTabs.length ? (
                <div className={mobileActionGroupClass}>
                    {otherTabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            className={mobileActionClass}
                            disabled={busy}
                            onClick={() => runAfterMenuClose(() => onMoveTab(tab.id))}
                        >
                            <ArrowRight aria-hidden />
                            Move to {tab.name}
                        </button>
                    ))}
                </div>
            ) : null}
            <div className={mobileActionGroupClass}>
                <button
                    type="button"
                    className={mobileActionClass}
                    data-destructive="true"
                    disabled={busy || onlyList}
                    onClick={() => runAfterMenuClose(onDelete)}
                >
                    <Trash2 aria-hidden />
                    Delete list{onlyList ? " (last list)" : ""}
                </button>
            </div>
        </MobileActionDrawer>
    ) : (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger render={listMenuTrigger} />
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
                {otherTabs.map((tab) => (
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
    const headingActions = (
        <div
            className={cn(
                styles.listHeadingTools,
                (headingLeading || headingNav) && styles.listHeadingToolsWithNav,
            )}
        >
            {headingLeading}
            {headingNav}
            {listMenu}
        </div>
    );
    const column = isValidElement(children)
        ? cloneElement(children, { headingActions } as Partial<TaskPlannerColumnProps>)
        : children;
    return (
        <div
            ref={setNodeRef}
            className={cn(styles.customList, isDragging && styles.dragging)}
            style={{ transform: measuredCssToRem(CSS.Transform.toString(transform)), transition }}
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
                <AppModalFooter
                    className={styles.nameActions}
                    secondaryLabel="Cancel"
                    secondaryVariant="outline"
                    onSecondary={onCancel}
                    secondaryDisabled={pending}
                    primaryLabel={initial ? "Save changes" : title}
                    primaryType="submit"
                    primaryFormId={formId}
                    primaryVariant="accent"
                    primaryLoading={pending}
                />
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
