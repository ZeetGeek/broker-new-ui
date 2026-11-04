"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { AvatarStack } from "@/components/shared/avatar-stack";
import {
    ArrowRight,
    CalendarClock,
    CallIcon,
    Clock,
    LockKeyhole,
    MapPin,
    Plus,
    Trash2,
} from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

import {
    MOCK_PIPELINE,
    MOCK_TASKS,
    MOCK_VISITS,
    type PreviewTask,
    type PreviewVisit,
    type TaskAttachment,
} from "./mock-work-overview";

import taskStyles from "./task-card.module.css";

const CARD =
    "flex min-inline-0 flex-col rounded-card bg-surface p-4 shadow-sm ring-1 ring-border-warm/50 sm:p-5";
const LINK =
    "body-sm inline-flex min-block-11 items-center gap-2 rounded-control font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring";
const TAG = "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 caption font-medium";

function TaskAttachments({ attachments }: { attachments: TaskAttachment[] }) {
    const people = attachments.filter((item) => item.kind !== "property");
    const properties = attachments.filter((item) => item.kind === "property");
    if (!attachments.length) return null;
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {people.map((person) => (
                <span
                    key={person.id}
                    title={`${person.kind === "client" ? "Client" : "Owner"}: ${person.name}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-subtle min-inline-0"
                >
                    <UserAvatar
                        name={person.name}
                        imageUrl={person.imageUrl}
                        size="xxs"
                        className="shadow-sm ring-2 ring-white"
                    />
                    <span className="truncate max-inline-[18ch]">
                        <span className="sr-only">{person.kind}: </span>
                        {person.name}
                    </span>
                </span>
            ))}
            {properties.length ? (
                <span className="inline-flex items-center gap-2">
                    <AvatarStack
                        people={properties.slice(0, 3).map((item) => ({
                            id: item.id,
                            name: item.name,
                            avatarUrl: item.imageUrl,
                        }))}
                        size="xxs"
                        avatarClassName="shadow-sm ring-2 ring-white"
                    />
                    <Popover>
                        <PopoverTrigger
                            className="rounded-control text-xs font-semibold whitespace-nowrap text-ink-subtle hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                            aria-label={`View ${properties.length} linked ${properties.length === 1 ? "property" : "properties"}`}
                        >
                            {properties.length} linked
                        </PopoverTrigger>
                        <PopoverContent
                            align="start"
                            className="inline-60 max-inline-[calc(100vw-2rem)]"
                        >
                            <PopoverTitle className="body-sm font-semibold">
                                Linked properties
                            </PopoverTitle>
                            <ul className="flex flex-col gap-3 overflow-y-auto max-block-56">
                                {properties.map((property) => (
                                    <li
                                        key={property.id}
                                        className="body-sm flex items-center gap-2 text-ink"
                                    >
                                        <UserAvatar
                                            name={property.name}
                                            imageUrl={property.imageUrl}
                                            size="xxs"
                                        />
                                        <span className="wrap-anywhere min-inline-0">
                                            {property.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </PopoverContent>
                    </Popover>
                </span>
            ) : null}
        </div>
    );
}

/** Track remaining content so fixed footers only cast a shadow over a scrollable list. */
function useScrollFooter() {
    const viewportRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [hasMore, setHasMore] = useState(false);
    const measure = useCallback(() => {
        const viewport = viewportRef.current;
        if (viewport) {
            setHasMore(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 1);
        }
    }, []);
    useEffect(() => {
        const observer = new ResizeObserver(measure);
        if (viewportRef.current) observer.observe(viewportRef.current);
        if (contentRef.current) observer.observe(contentRef.current);
        return () => observer.disconnect();
    }, [measure]);
    return { viewportRef, contentRef, hasMore, measure };
}

function TasksCard() {
    const {
        viewportRef: taskViewportRef,
        contentRef: taskContentRef,
        hasMore: tasksHaveMore,
        measure: measureTasks,
    } = useScrollFooter();
    const [tasks, setTasks] = useState(MOCK_TASKS);
    const [filter, setFilter] = useState<"focus" | "important" | "completed">("focus");
    const [showAll, setShowAll] = useState(false);
    const [draft, setDraft] = useState("");
    const [adding, setAdding] = useState(false);
    const update = (id: string, changes: Partial<PreviewTask>) =>
        setTasks((current) =>
            current.map((task) => (task.id === id ? { ...task, ...changes } : task)),
        );
    const open = tasks.filter((task) => !task.completed);
    const important = open.filter((task) => task.important).length;
    const completed = tasks.length - open.length;
    const visible = tasks
        .filter((task) => {
            if (filter === "completed") return task.completed;
            if (task.completed) return false;
            if (filter === "important") return task.important;
            return showAll || task.group !== "later";
        })
        .sort((a, b) => Number(b.important) - Number(a.important));
    const groups = filter === "completed" ? ["completed"] : ["overdue", "today", "later"];

    return (
        <section
            className={cn(CARD, taskStyles.card, taskStyles.fixedCard)}
            aria-labelledby="preview-tasks-title"
        >
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h2 id="preview-tasks-title" className="h5 text-ink">
                        My tasks
                    </h2>
                    <span aria-hidden className="shrink-0 bg-border-warm block-5 inline-px" />
                    <p className="body-sm text-ink-muted">
                        {open.length} tasks to do &middot; {important} important
                    </p>
                </div>
                <div className="ms-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdding(!adding)}
                        aria-expanded={adding}
                    >
                        <Plus aria-hidden /> Add task
                    </Button>
                </div>
            </header>
            <div className={taskStyles.tabs} aria-label="Filter tasks">
                {(
                    [
                        ["focus", "To do", open.length],
                        ["important", "Important", important],
                        ["completed", "Done", completed],
                    ] as const
                ).map(([value, label, count]) => (
                    <button
                        key={value}
                        type="button"
                        aria-pressed={filter === value}
                        onClick={() => setFilter(value)}
                        className={taskStyles.tab}
                    >
                        {label}
                        <span className={taskStyles.count}>{count}</span>
                    </button>
                ))}
            </div>
            {adding && (
                <form
                    className={taskStyles.composer}
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!draft.trim()) return;
                        setTasks((current) => [
                            ...current,
                            {
                                id: crypto.randomUUID(),
                                title: draft.trim(),
                                attachments: [],
                                due: "Today",
                                dueTime: "Any time",
                                reminders: [],
                                group: "today",
                                completed: false,
                                important: false,
                            },
                        ]);
                        setDraft("");
                        setAdding(false);
                        setFilter("focus");
                    }}
                >
                    <input
                        autoFocus
                        aria-label="Task title"
                        placeholder="What needs to get done?"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={200}
                        className={taskStyles.input}
                    />
                    <Button type="submit" size="sm" disabled={!draft.trim()}>
                        Add
                    </Button>
                </form>
            )}
            <div
                ref={taskViewportRef}
                onScroll={measureTasks}
                className={taskStyles.scrollViewport}
                tabIndex={0}
                role="region"
                aria-label="Task list"
            >
                <div ref={taskContentRef} className={taskStyles.list}>
                    {groups.map((group) => {
                        const items = visible.filter(
                            (task) => group === "completed" || task.group === group,
                        );
                        if (!items.length) return null;
                        return (
                            <div key={group}>
                                <h3
                                    className={cn(
                                        taskStyles.group,
                                        group === "overdue" && "text-urgent",
                                    )}
                                >
                                    {group === "overdue"
                                        ? "Overdue"
                                        : group === "today"
                                          ? "Today"
                                          : group === "later"
                                            ? "Upcoming"
                                            : "Completed"}
                                    <span
                                        className={cn(
                                            group === "overdue" ? "text-urgent" : "text-ink-subtle",
                                        )}
                                    >
                                        {items.length}
                                    </span>
                                </h3>
                                <ul className="divide-y divide-border-warm/60">
                                    {items.map((task) => (
                                        <li
                                            key={task.id}
                                            className={cn(
                                                taskStyles.row,
                                                task.completed && taskStyles.completed,
                                            )}
                                        >
                                            <Checkbox
                                                checked={task.completed}
                                                className="mbs-1 cursor-pointer rounded-full hover:border-brand"
                                                onCheckedChange={(checked) =>
                                                    update(task.id, { completed: Boolean(checked) })
                                                }
                                                aria-label={`Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`}
                                            />
                                            <div className="min-inline-0">
                                                <p
                                                    className={cn(
                                                        "body-sm font-semibold wrap-anywhere text-ink",
                                                        task.completed &&
                                                            "text-ink-subtle line-through",
                                                    )}
                                                >
                                                    {task.title}
                                                </p>
                                                <div className={taskStyles.metadata}>
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap",
                                                            task.group === "overdue" &&
                                                                !task.completed
                                                                ? "text-urgent"
                                                                : "text-ink-subtle",
                                                        )}
                                                    >
                                                        <CalendarClock
                                                            aria-hidden
                                                            className="block-3.5 inline-3.5"
                                                        />
                                                        {task.due}
                                                        {task.dueTime !== "Any time" &&
                                                            ` \u00b7 ${task.dueTime}`}
                                                    </span>
                                                    <TaskAttachments
                                                        attachments={task.attachments}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        render={
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label={`Reschedule ${task.title}`}
                                                                title="Reschedule task"
                                                            />
                                                        }
                                                    >
                                                        <CalendarClock aria-hidden />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                update(task.id, {
                                                                    due: "Today",
                                                                    dueTime: "4:00 PM",
                                                                    group: "today",
                                                                })
                                                            }
                                                        >
                                                            Later today
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                update(task.id, {
                                                                    due: "Tomorrow",
                                                                    group: "later",
                                                                })
                                                            }
                                                        >
                                                            Tomorrow
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-danger hover:bg-danger/5 hover:text-danger"
                                                    aria-label={`Delete ${task.title}`}
                                                    title="Delete task"
                                                    onClick={() =>
                                                        setTasks((current) =>
                                                            current.filter(
                                                                (item) => item.id !== task.id,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <Trash2 aria-hidden />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                    {!visible.length && (
                        <p className="body-sm py-8 text-center text-ink-muted">
                            {filter === "important"
                                ? "Mark a task as important to keep it in focus."
                                : filter === "completed"
                                  ? "Completed tasks will appear here."
                                  : "All caught up. Your next task can wait."}
                        </p>
                    )}
                </div>
            </div>
            <footer
                data-scroll-shadow={tasksHaveMore}
                className={cn(
                    taskStyles.fixedFooter,
                    "flex flex-wrap items-center justify-between gap-2 border-bs border-border-warm",
                )}
            >
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="px-0 text-brand"
                    onClick={() => {
                        setShowAll(!showAll);
                        setFilter("focus");
                    }}
                >
                    {showAll ? "Show today & overdue" : "View all tasks"}
                    <ArrowRight aria-hidden className="block-4 inline-4" />
                </Button>
                <span className={taskStyles.privacyStatus}>
                    <LockKeyhole aria-hidden className="block-3 inline-3" />
                    Private to you
                </span>
            </footer>
        </section>
    );
}

function PipelineOverview() {
    const total = MOCK_PIPELINE.reduce((sum, stage) => sum + stage.count, 0);
    return (
        <section className={cn(CARD, "block-full")} aria-labelledby="preview-pipeline-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 id="preview-pipeline-title" className="h5 text-ink">
                        Pipeline overview
                    </h2>
                    <p className="body-sm mbs-1 text-ink-muted">{total} active clients</p>
                </div>
                <Link href="/broker/pipeline" className={LINK}>
                    Open pipeline
                    <ArrowRight aria-hidden className="block-4 inline-4" />
                </Link>
            </div>
            <div aria-hidden className="mbs-4 flex gap-1 overflow-hidden rounded-full block-2.5">
                {MOCK_PIPELINE.map((stage) => (
                    <div
                        key={stage.id}
                        className={cn("rounded-sm", stage.color)}
                        style={{ flex: stage.count }}
                    />
                ))}
            </div>
            <ul className="mbs-3 grid grid-cols-1 gap-3">
                {MOCK_PIPELINE.map((stage) => (
                    <li key={stage.id}>
                        <Link
                            href={`/broker/pipeline?stage=${stage.id}`}
                            className="body-sm flex items-center gap-2 rounded-control outline-none min-block-8 hover:text-brand focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    "shrink-0 rounded-full block-1.5 inline-1.5",
                                    stage.color,
                                )}
                            />
                            <span className="text-ink-muted">{stage.label}</span>
                            <span className="ms-auto font-semibold text-ink tabular-nums">
                                {stage.count}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
            <Link
                href="/broker/pipeline"
                className="body-sm mbs-auto flex flex-wrap items-center gap-2 border-bs border-border-warm pbs-3 text-ink outline-none min-block-11 hover:text-brand focus-visible:ring-2 focus-visible:ring-ring"
            >
                <span className={cn(TAG, "bg-urgent-soft text-urgent")}>Needs attention</span>
                <span>4 clients have had no activity for 7+ days</span>
                <ArrowRight aria-hidden className="ms-auto shrink-0 block-4 inline-4" />
            </Link>
        </section>
    );
}

function VisitDetails({ visit, children }: { visit: PreviewVisit; children: React.ReactElement }) {
    return (
        <Popover>
            <PopoverTrigger render={children} />
            <PopoverContent align="end" className="max-inline-[calc(100vw-2rem)]">
                <PopoverTitle>{visit.client}</PopoverTitle>
                <p className="body-sm font-medium text-ink">
                    {visit.time}–{visit.end}
                </p>
                <p className="body-sm text-ink-muted">{visit.property}</p>
                <p className="body-sm flex items-center gap-1.5 text-ink-muted">
                    <MapPin aria-hidden className="shrink-0 block-4 inline-4" />
                    {visit.location}
                </p>
                <span
                    className={cn(
                        TAG,
                        "self-start",
                        visit.needsUpdate
                            ? "bg-urgent-soft text-urgent"
                            : "bg-brand-soft text-brand-text",
                    )}
                >
                    {visit.needsUpdate ? "Needs update" : "Confirmed"}
                </span>
            </PopoverContent>
        </Popover>
    );
}

function NextVisit() {
    const visit = MOCK_VISITS[1];
    return (
        <section
            className="flex flex-col gap-4 rounded-card bg-brand-deep p-4 text-surface shadow-sm sm:p-5"
            aria-labelledby="preview-next-visit-title"
        >
            <div className="flex items-center justify-between gap-3">
                <h2 id="preview-next-visit-title" className="body-sm font-semibold">
                    Your next visit
                </h2>
                <span className={cn(TAG, "bg-highlight text-highlight-ink")}>Confirmed</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="h3 tabular-nums">11:00–11:45 AM</p>
                <span className="caption text-brand-soft">Starts in 1 hour</span>
            </div>
            <dl className="grid grid-cols-2 gap-4">
                <div>
                    <dt className="caption text-brand-soft">Client</dt>
                    <dd className="body-sm mbs-1 font-semibold">{visit.client}</dd>
                </div>
                <div>
                    <dt className="caption text-brand-soft">Property</dt>
                    <dd className="body-sm mbs-1 font-semibold">{visit.property}</dd>
                    <dd className="caption mbs-2 flex items-start gap-1.5 text-brand-soft">
                        <MapPin aria-hidden className="shrink-0 block-3.5 inline-3.5" />
                        {visit.location}
                    </dd>
                </div>
            </dl>
            <div className="flex flex-wrap gap-2">
                <VisitDetails visit={visit}>
                    <Button variant="highlight" size="sm">
                        <ArrowRight aria-hidden />
                        View visit
                    </Button>
                </VisitDetails>
                <Popover>
                    <PopoverTrigger render={<Button variant="outline" size="sm" />}>
                        <CallIcon aria-hidden />
                        Call client
                    </PopoverTrigger>
                    <PopoverContent className="max-inline-[calc(100vw-2rem)]">
                        <PopoverTitle>{visit.client}</PopoverTitle>
                        <p className="body-sm text-ink-muted">Phone number not shared.</p>
                    </PopoverContent>
                </Popover>
            </div>
        </section>
    );
}

function TodayVisits() {
    const {
        viewportRef: visitViewportRef,
        contentRef: visitContentRef,
        hasMore: visitsHaveMore,
        measure: measureVisits,
    } = useScrollFooter();
    const [expanded, setExpanded] = useState(false);
    return (
        <section
            className={cn(CARD, taskStyles.fixedCard)}
            aria-labelledby="preview-today-visits-title"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 id="preview-today-visits-title" className="h5 text-ink">
                        Today&apos;s visits
                    </h2>
                    <p className="caption mbs-1 text-ink-subtle">
                        3 scheduled · Tuesday, 3 November
                    </p>
                </div>
                <button
                    type="button"
                    className={LINK}
                    onClick={() => setExpanded(!expanded)}
                    aria-expanded={expanded}
                >
                    {expanded ? "Show less" : "View all"}
                </button>
            </div>
            <div
                ref={visitViewportRef}
                onScroll={measureVisits}
                className={taskStyles.scrollViewport}
                tabIndex={0}
                role="region"
                aria-label="Today's visit list"
            >
                <div ref={visitContentRef}>
                    <ul className="mbs-2 divide-y divide-border-warm/70">
                        {MOCK_VISITS.map((visit) => (
                            <li key={visit.id} className="py-4">
                                <VisitDetails visit={visit}>
                                    <button
                                        type="button"
                                        className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-control text-start outline-none inline-full hover:bg-surface-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <span
                                            className={cn(
                                                "body-sm flex items-center gap-1.5 self-start whitespace-nowrap",
                                                visit.needsUpdate ? "text-urgent" : "text-brand",
                                            )}
                                        >
                                            <Clock
                                                aria-hidden
                                                className="shrink-0 block-3.5 inline-3.5"
                                            />
                                            {visit.time}
                                        </span>
                                        <span className="flex flex-col gap-1 min-inline-0">
                                            <span className="body-sm font-medium text-ink">
                                                {visit.client}
                                            </span>
                                            <span className="caption wrap-anywhere text-ink-muted">
                                                {visit.property}
                                            </span>
                                            <span className="caption text-ink-subtle">
                                                {visit.location}
                                            </span>
                                        </span>
                                        <span
                                            className={cn(
                                                TAG,
                                                "col-start-2 place-self-start",
                                                visit.needsUpdate
                                                    ? "bg-urgent-soft text-urgent"
                                                    : "bg-brand-soft text-brand-text",
                                            )}
                                        >
                                            {visit.needsUpdate ? "Needs update" : "Confirmed"}
                                        </span>
                                    </button>
                                </VisitDetails>
                                {expanded ? (
                                    <p className="caption mbs-3 ps-2 text-ink-muted">
                                        {visit.time}–{visit.end} ·{" "}
                                        {visit.needsUpdate
                                            ? "Record the outcome of this visit."
                                            : "Meet the client at the property entrance."}
                                    </p>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <p
                data-scroll-shadow={visitsHaveMore}
                className={cn(
                    taskStyles.fixedFooter,
                    "caption border-bs border-border-warm text-urgent",
                )}
            >
                1 earlier visit needs its outcome recorded
            </p>
        </section>
    );
}

/** Local preview only: this section does not read or write API data. */
export function WorkOverview() {
    return (
        <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)_minmax(0,1.15fr)]">
            <div className="flex flex-col gap-5 min-inline-0">
                <NextVisit />
                <div className="flex-1 min-inline-0">
                    <PipelineOverview />
                </div>
            </div>
            <div className="flex flex-col min-inline-0">
                <TodayVisits />
            </div>
            <div className="min-inline-0">
                <TasksCard />
            </div>
        </div>
    );
}
