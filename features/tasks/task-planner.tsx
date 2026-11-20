"use client";
import { type CSSProperties, type ReactNode, useId, useRef, useState } from "react";
import toast from "react-hot-toast";

import {
    closestCenter,
    type CollisionDetection,
    defaultDropAnimationSideEffects,
    DndContext,
    type DragEndEvent,
    type DragMoveEvent,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    pointerWithin,
    TouchSensor,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatInTimeZone } from "date-fns-tz";
import { useReducedMotion } from "motion/react";

import { measuredCssToRem, measuredPxToRem } from "@/lib/styles/rem";
import { plannerColumnLabel } from "@/lib/tasks/planner-column-options";
import { cn } from "@/lib/utils";

import { AppDatePicker } from "@/components/shared/app-date-picker";
import { IconButton } from "@/components/shared/icon-button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "@/components/shared/icons";
import { SlidingTabs } from "@/components/shared/sliding-tabs";

import { type Task, TASK_TIME_ZONE, taskDateKey, type TaskSort } from "./model";
import { moveNotebookList, moveNotebookTab, taskListId, type TaskNotebook } from "./notebook-model";
import type { NotebookUpdater } from "./notebook-store";
import {
    countPopulatedPlannerDays,
    hiddenLandingDay,
    landingNotice,
    plannerColumnTasks,
    plannerDate,
    type PlannerDragPreview,
    type PlannerTaskExtras,
} from "./planner-model";
import { QuickAddComposer } from "./quick-add-composer";
import type { QuickAddCatalogs } from "./quick-add-parse";
import { shiftTaskDate } from "./recurrence";
import { TaskLine, type TaskRowActions } from "./task-list";
import { TaskLists } from "./task-lists";
import { usePlannerColumns } from "./use-planner-columns";

import styles from "./planner.module.css";

const dateText = (day: string, format: string) =>
    formatInTimeZone(`${day}T12:00:00+05:30`, TASK_TIME_ZONE, format);
const bucketId = (date: string | null, listId?: string) =>
    date ? `day:${date}` : `bucket:${listId}`;
// The existing position-change tokens (--duration-fast / --ease-smooth-out), for dnd-kit's JS API.
const dragTransition = { duration: 250, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
// Preview order owns the gap; sortable's layout measurements animate neighbours into place.
const previewSortingStrategy = () => null;
const dropSideEffects = defaultDropAnimationSideEffects({ styles: { active: { opacity: "0" } } });

export type TaskPlannerProps = TaskRowActions & {
    notebook: TaskNotebook;
    notebookLoading: boolean;
    notebookError?: string;
    notebookBusy: boolean;
    onNotebookChange: (updater: NotebookUpdater) => Promise<boolean>;
    tasks: Task[];
    sort: TaskSort;
    catalogs: QuickAddCatalogs;
    onAdd: (
        title: string,
        date: string | null,
        listId?: string,
        extras?: PlannerTaskExtras,
    ) => Promise<boolean>;
    onMove: (
        id: string,
        date: string | null,
        beforeId?: string,
        listId?: string,
    ) => Promise<boolean>;
};

export function TaskPlanner({
    tasks,
    sort,
    catalogs,
    onAdd,
    onMove,
    notebook,
    notebookLoading,
    notebookError,
    notebookBusy,
    onNotebookChange,
    ...actions
}: TaskPlannerProps) {
    const rowActions = { ...actions, catalogs };
    const today = taskDateKey(actions.now);
    const reduceMotion = useReducedMotion();
    const daysPanelId = useId();
    const [anchor, setAnchor] = useState(today);
    const populatedDayCount = countPopulatedPlannerDays(tasks, today);
    const { frame, columns, pickerOptions, setPreferredColumns } = usePlannerColumns(
        populatedDayCount,
        true,
    );
    const [dragged, setDragged] = useState<Task | null>(null);
    const [dragPreview, setDragPreview] = useState<PlannerDragPreview | null>(null);
    const latestDragPreview = useRef<PlannerDragPreview | null>(null);
    const initialDragPreview = useRef<PlannerDragPreview | null>(null);
    const updateDragPreview = (next: PlannerDragPreview | null) => {
        latestDragPreview.current = next;
        setDragPreview(next);
    };
    const [dragHeight, setDragHeight] = useState(40);
    const [draggedTab, setDraggedTab] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<string>();
    // Start on a populated tab, including after the saved notebook finishes loading.
    const activeTab =
        selectedTab && notebook.tabs.some((tab) => tab.id === selectedTab)
            ? selectedTab
            : notebook.lists[0].tabId;
    const days = Array.from({ length: columns }, (_, index) => shiftTaskDate(anchor, index)).filter(
        (date): date is string => !!date,
    );
    const dayLineCount = Math.max(
        10,
        ...days.map((day) => tasks.filter((task) => plannerDate(task, today) === day).length + 1),
    );
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    const shift = (offset: number) => {
        const day = shiftTaskDate(anchor, offset);
        if (day) setAnchor(day);
    };
    const add: TaskPlannerProps["onAdd"] = async (title, date, listId, extras) => {
        const added = await onAdd(title, date, listId, extras);
        const landing = added && !listId ? hiddenLandingDay(date, days) : null;
        if (landing) {
            setAnchor(landing);
            toast.success(landingNotice(landing, actions.now));
        }
        return added;
    };
    const collision: CollisionDetection = (args) => {
        const isList = args.active.data.current?.kind === "list";
        const isTab = args.active.data.current?.kind === "tab";
        const eligible = args.droppableContainers.filter((item) =>
            isTab
                ? item.data.current?.kind === "tab"
                : isList
                  ? item.data.current?.kind === "list" || item.data.current?.kind === "tab"
                  : item.data.current?.date !== undefined || item.data.current?.kind === "tab",
        );
        const tabHit = pointerWithin({ ...args, droppableContainers: eligible }).find((hit) =>
            String(hit.id).startsWith("tab:"),
        );
        if (tabHit) return [tabHit];
        if (!isList && !isTab && args.pointerCoordinates) {
            const hits = pointerWithin({ ...args, droppableContainers: eligible });
            // A row is more precise than the column containing it; empty space appends.
            const row = hits.find(
                (hit) => eligible.find((item) => item.id === hit.id)?.data.current?.kind === "task",
            );
            return row ? [row] : hits.slice(0, 1);
        }
        return closestCenter({ ...args, droppableContainers: eligible });
    };
    const previewMove = ({ active, over }: DragMoveEvent) => {
        if (active.data.current?.kind !== "task" || !over || over.id === active.id) return;
        const date = over.data.current?.date as string | null | undefined;
        const listId = over.data.current?.listId as string | undefined;
        if (date === undefined) return;
        const rows = plannerColumnTasks(
            tasks,
            date,
            listId,
            notebook,
            today,
            sort,
            latestDragPreview.current,
        ).filter((task) => task.id !== active.id);
        const index = rows.findIndex((task) => task.id === over.id);
        const translated = active.rect.current.translated;
        const after =
            translated &&
            translated.top + translated.height / 2 > over.rect.top + over.rect.height / 2;
        const beforeId = index < 0 ? undefined : rows[index + (after ? 1 : 0)]?.id;
        const next = { taskId: String(active.id), date, listId, beforeId };
        const current = latestDragPreview.current;
        if (current?.date !== date || current.listId !== listId || current.beforeId !== beforeId)
            updateDragPreview(next);
    };
    const dragEnd = async ({ active, over }: DragEndEvent) => {
        setDragged(null);
        setDraggedTab(null);
        if (!over) {
            updateDragPreview(null);
            return;
        }
        if (active.data.current?.kind !== "task" && active.id === over.id) return;
        if (active.data.current?.kind === "tab") {
            const id = active.data.current.tabId as string;
            const targetId = over.data.current?.tabId as string | undefined;
            if (targetId) void onNotebookChange((latest) => moveNotebookTab(latest, id, targetId));
            return;
        }
        if (active.data.current?.kind === "list") {
            const listId = active.data.current.listId as string;
            const targetTab = over.data.current?.tabId as string | undefined;
            if (!targetTab) return;
            let beforeId =
                over.data.current?.kind === "list"
                    ? (over.data.current.listId as string)
                    : undefined;
            const rows = notebook.lists.filter((list) => list.tabId === targetTab);
            const from = rows.findIndex((list) => list.id === listId);
            const to = rows.findIndex((list) => list.id === beforeId);
            if (from >= 0 && from < to) beforeId = rows[to + 1]?.id;
            void onNotebookChange((latest) =>
                moveNotebookList(latest, listId, targetTab, beforeId),
            ).then((saved) => {
                if (saved) setSelectedTab(targetTab);
            });
            return;
        }
        const id = String(active.id);
        if (over.data.current?.kind === "tab") {
            updateDragPreview(null);
            const firstList = notebook.lists.find(
                (list) => list.tabId === over.data.current?.tabId,
            );
            if (firstList)
                void onMove(id, null, undefined, firstList.id).then((saved) => {
                    if (saved) setSelectedTab(firstList.tabId);
                });
            return;
        }
        const landing = latestDragPreview.current;
        if (landing) {
            const initial = initialDragPreview.current;
            if (
                initial?.date === landing.date &&
                initial.listId === landing.listId &&
                initial.beforeId === landing.beforeId
            ) {
                updateDragPreview(null);
                return;
            }
            try {
                await onMove(id, landing.date, landing.beforeId, landing.listId);
            } finally {
                updateDragPreview(null);
            }
        }
    };
    return (
        <section ref={frame} className={styles.planner} aria-label="Task planner">
            <nav className={styles.plannerNav} aria-label="Planner dates">
                <p className={styles.dateRange} aria-live="polite">
                    {dateText(anchor, "MMMM yyyy")}
                </p>
                {pickerOptions.length > 0 && (
                    <SlidingTabs
                        value={columns}
                        options={pickerOptions.map((count) => ({
                            value: count,
                            ...plannerColumnLabel(count),
                        }))}
                        onValueChange={setPreferredColumns}
                        label="Visible days"
                        panelId={daysPanelId}
                        height={36}
                        className={styles.columnPicker}
                    />
                )}
                <div className={styles.dateControls}>
                    <button
                        type="button"
                        className={styles.todayButton}
                        onClick={() => setAnchor(today)}
                    >
                        Today
                    </button>
                    <IconButton
                        size="sm"
                        type="button"
                        className={styles.navButton}
                        aria-label={`Previous ${columns} days`}
                        onClick={() => shift(-columns)}
                    >
                        <ChevronsLeft aria-hidden size={16} />
                    </IconButton>
                    <IconButton
                        size="sm"
                        type="button"
                        className={styles.navButton}
                        aria-label="Previous day"
                        onClick={() => shift(-1)}
                    >
                        <ChevronLeft aria-hidden size={16} />
                    </IconButton>
                    <IconButton
                        size="sm"
                        type="button"
                        className={styles.navButton}
                        aria-label="Next day"
                        onClick={() => shift(1)}
                    >
                        <ChevronRight aria-hidden size={16} />
                    </IconButton>
                    <IconButton
                        size="sm"
                        type="button"
                        className={styles.navButton}
                        aria-label={`Next ${columns} days`}
                        onClick={() => shift(columns)}
                    >
                        <ChevronsRight aria-hidden size={16} />
                    </IconButton>
                    <div className={styles.dateJump}>
                        <label className="sr-only" htmlFor="task-planner-date">
                            Jump to a date
                        </label>
                        <AppDatePicker
                            iconOnly
                            id="task-planner-date"
                            value={anchor}
                            onChange={(day) => {
                                if (day) setAnchor(day);
                            }}
                            allowPast
                            size="sm"
                        />
                    </div>
                </div>
            </nav>
            <DndContext
                sensors={sensors}
                collisionDetection={collision}
                onDragStart={({ active }) => {
                    updateDragPreview(null);
                    initialDragPreview.current = null;
                    if (active.data.current?.kind === "tab")
                        setDraggedTab(
                            notebook.tabs.find((tab) => tab.id === active.data.current?.tabId)
                                ?.name ?? null,
                        );
                    // Lists move as the original full column, without a separate overlay.
                    else if (active.data.current?.kind === "task") {
                        const task = tasks.find((task) => task.id === active.id);
                        setDragged(task ?? null);
                        setDragHeight(active.rect.current.initial?.height ?? 40);
                        if (task) {
                            const date = plannerDate(task, today);
                            const listId = date === null ? taskListId(task, notebook) : undefined;
                            const rows = plannerColumnTasks(
                                tasks,
                                date,
                                listId,
                                notebook,
                                today,
                                sort,
                            );
                            const index = rows.findIndex((row) => row.id === task.id);
                            const initial = {
                                taskId: task.id,
                                date,
                                listId,
                                beforeId: rows[index + 1]?.id,
                            };
                            initialDragPreview.current = initial;
                            updateDragPreview(initial);
                        }
                    }
                }}
                onDragMove={previewMove}
                onDragOver={previewMove}
                onDragCancel={() => {
                    setDragged(null);
                    setDraggedTab(null);
                    updateDragPreview(null);
                }}
                onDragEnd={dragEnd}
            >
                <div
                    id={daysPanelId}
                    role="tabpanel"
                    aria-label="Planner days"
                    className={styles.dayGrid}
                    style={{ "--planner-columns": columns } as CSSProperties}
                >
                    {days.map((day) => (
                        <PlannerColumn
                            key={day}
                            date={day}
                            today={today}
                            minimumLines={dayLineCount}
                            tasks={plannerColumnTasks(
                                tasks,
                                day,
                                undefined,
                                notebook,
                                today,
                                sort,
                                dragPreview,
                            )}
                            catalogs={catalogs}
                            onAdd={add}
                            actions={rowActions}
                        />
                    ))}
                </div>
                <TaskLists
                    notebook={notebook}
                    notebookLoading={notebookLoading}
                    notebookError={notebookError}
                    notebookBusy={notebookBusy}
                    onNotebookChange={onNotebookChange}
                    tasks={tasks}
                    sort={sort}
                    catalogs={catalogs}
                    onAdd={add}
                    activeTab={activeTab}
                    onSelectTab={setSelectedTab}
                    today={today}
                    actions={rowActions}
                    dragPreview={dragPreview}
                    listColumns={columns}
                />
                <DragOverlay
                    adjustScale={false}
                    dropAnimation={
                        reduceMotion ? null : { ...dragTransition, sideEffects: dropSideEffects }
                    }
                >
                    {dragged && (
                        <div
                            className={styles.dragPreview}
                            style={{ minHeight: measuredPxToRem(dragHeight) }}
                        >
                            <span
                                className={
                                    dragged.completedAt ? styles.completedPreview : undefined
                                }
                            >
                                {dragged.title}
                            </span>
                        </div>
                    )}
                    {draggedTab && <div className={styles.dragTabPreview}>{draggedTab}</div>}
                </DragOverlay>
            </DndContext>
        </section>
    );
}

export type TaskPlannerColumnProps = {
    date: string | null;
    today: string;
    tasks: Task[];
    catalogs: QuickAddCatalogs;
    onAdd: TaskPlannerProps["onAdd"];
    actions: TaskRowActions;
    listId?: string;
    name?: string;
    minimumLines?: number;
    headingActions?: ReactNode;
    listFooter?: ReactNode;
};
export function PlannerColumn({
    date,
    today,
    tasks,
    catalogs,
    onAdd,
    actions,
    listId,
    name,
    minimumLines = date ? 10 : 9,
    headingActions,
    listFooter,
}: TaskPlannerColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: bucketId(date, listId),
        data: { date, listId },
    });
    return (
        <section
            ref={setNodeRef}
            className={cn(styles.dayColumn, isOver && styles.dropTarget)}
            data-today={date === today || undefined}
            aria-label={date ? dateText(date, "EEEE, d MMMM yyyy") : (name ?? "Someday")}
        >
            <header className={styles.dayHeading}>
                {date ? (
                    <>
                        <time dateTime={date}>{dateText(date, "MMM d, yyyy")}</time>
                        <h2 className="h5" title={name}>
                            {dateText(date, "EEEE")}
                        </h2>
                    </>
                ) : (
                    <div className={styles.listHeadingRow}>
                        <h2 className="h5" title={name}>
                            {name ?? "Someday"}
                        </h2>
                        {headingActions}
                    </div>
                )}
            </header>
            <SortableContext items={tasks.map((task) => task.id)} strategy={previewSortingStrategy}>
                <ul className={styles.ruledList}>
                    {tasks.map((task) => (
                        <SortableLine
                            key={task.id}
                            task={task}
                            date={date}
                            listId={listId}
                            actions={actions}
                        />
                    ))}
                    <li className={styles.composerLine}>
                        <QuickAddComposer
                            key={date ?? listId ?? "someday"}
                            date={date}
                            listId={listId}
                            listName={name}
                            busy={actions.busy}
                            now={actions.now}
                            catalogs={catalogs}
                            onAdd={onAdd}
                        />
                    </li>
                    {Array.from(
                        { length: Math.max(0, minimumLines - tasks.length - 1) },
                        (_, index) => (
                            <li key={`line-${index}`} className={styles.blankLine} aria-hidden />
                        ),
                    )}
                </ul>
            </SortableContext>
            {listFooter ? <div className={styles.listColumnFooter}>{listFooter}</div> : null}
        </section>
    );
}

function SortableLine({
    task,
    date,
    actions,
    listId,
}: {
    task: Task;
    date: string | null;
    actions: TaskRowActions;
    listId?: string;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { date, listId, kind: "task" },
        disabled: actions.busy,
        transition: dragTransition,
        animateLayoutChanges: ({ isDragging, isSorting, wasDragging }) =>
            !isDragging && (isSorting || wasDragging),
    });
    return (
        <li
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            role="listitem"
            aria-roledescription="sortable task"
            aria-label={`Move ${task.title}`}
            onPointerDown={(event) => {
                // Touch uses the hold delay; mouse uses the movement threshold.
                if (event.pointerType !== "touch" && canStartTaskDrag(event.target))
                    listeners?.onPointerDown?.(event);
            }}
            onTouchStart={(event) => {
                if (canStartTaskDrag(event.target)) listeners?.onTouchStart?.(event);
            }}
            onKeyDown={(event) => {
                if (event.target === event.currentTarget) listeners?.onKeyDown?.(event);
            }}
            className={cn(styles.sortableLine, isDragging && styles.taskPlaceholder)}
            style={{
                transform: isDragging
                    ? undefined
                    : measuredCssToRem(CSS.Transform.toString(transform)),
                transition,
            }}
        >
            <TaskLine task={task} showDate={date === null} {...actions} />
        </li>
    );
}

function canStartTaskDrag(target: EventTarget) {
    if (!(target instanceof Element)) return false;
    const control = target.closest(
        'button, input, textarea, select, a, [role="checkbox"], [role="menuitem"], [contenteditable="true"], [data-quick-add]',
    );
    return (
        !control ||
        control.hasAttribute("data-task-title") ||
        control.hasAttribute("data-card-link")
    );
}
