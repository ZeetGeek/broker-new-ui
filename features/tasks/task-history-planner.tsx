"use client";

import { type CSSProperties, type ReactNode, useId, useState } from "react";

import { formatInTimeZone } from "date-fns-tz";

import { AppDatePicker } from "@/components/shared/app-date-picker";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "@/components/shared/icons";
import { SlidingTabs } from "@/components/shared/sliding-tabs";

import { groupTaskHistory, type TaskHistoryTab } from "./history-model";
import { type Task, TASK_TIME_ZONE, taskDateKey, type TaskSort } from "./model";
import { usePlannerColumns } from "./use-planner-columns";

import styles from "./planner.module.css";

const dateText = (date: string, pattern: string) =>
    formatInTimeZone(`${date}T12:00:00+05:30`, TASK_TIME_ZONE, pattern);

export function TaskHistoryPlanner({
    tasks,
    tab,
    sort,
    now,
    renderTask,
}: {
    tasks: Task[];
    tab: TaskHistoryTab;
    sort: TaskSort;
    now: number;
    renderTask: (task: Task) => ReactNode;
}) {
    const { frame, columns, availableColumns, setPreferredColumns } = usePlannerColumns();
    const panelId = useId();
    const pickerId = useId();
    const [anchor, setAnchor] = useState<string>();
    const days = groupTaskHistory(tasks, tab, sort);
    const index = anchor ? days.findIndex((day) => day.date >= anchor) : 0;
    const start = index < 0 ? Math.max(0, days.length - columns) : index;
    const visible = days.slice(start, start + columns);
    const first = visible[0]?.date;
    const last = visible.at(-1)?.date;
    const label = tab === "completed" ? "Completed" : "Deleted";
    const lineCount = Math.max(10, ...visible.map((day) => day.tasks.length + 1));
    const previous = start > 0;
    const next = start + columns < days.length;
    const shift = (offset: number) => {
        const target = Math.max(0, Math.min(days.length - 1, start + offset));
        if (days[target]) setAnchor(days[target].date);
    };
    const jump = (date: string) => {
        const target = days.find((day) => day.date >= date) ?? days.at(-1);
        if (target) setAnchor(target.date);
    };

    return (
        <section
            ref={frame}
            className={styles.planner}
            aria-label={`${label} tasks by ${tab === "completed" ? "completion" : "deletion"} date`}
            style={{ "--planner-columns": columns } as CSSProperties}
        >
            <nav className={styles.plannerNav} aria-label={`${label} task dates`}>
                <p className={styles.dateRange} aria-live="polite">
                    {first && last
                        ? first.slice(0, 7) === last.slice(0, 7)
                            ? dateText(first, "MMMM yyyy")
                            : `${dateText(first, "MMM yyyy")} – ${dateText(last, "MMM yyyy")}`
                        : label}
                </p>
                <SlidingTabs
                    value={columns}
                    options={[1, 3, 5, 7]
                        .filter((count) => count <= availableColumns)
                        .map((count) => ({
                            value: count,
                            label: count === 1 ? "1 day" : `${count} days`,
                            ariaLabel: count === 1 ? "Show one day" : `Show ${count} days`,
                        }))}
                    onValueChange={setPreferredColumns}
                    label="Visible days"
                    panelId={panelId}
                    className={styles.columnPicker}
                />
                <div className={styles.dateControls}>
                    <button
                        type="button"
                        className={styles.todayButton}
                        onClick={() => jump(taskDateKey(now))}
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        className={styles.navButton}
                        disabled={!previous}
                        aria-label={`Previous ${columns} dates with tasks`}
                        onClick={() => shift(-columns)}
                    >
                        <ChevronsLeft aria-hidden size={16} />
                    </button>
                    <button
                        type="button"
                        className={styles.navButton}
                        disabled={!previous}
                        aria-label="Previous date with tasks"
                        onClick={() => shift(-1)}
                    >
                        <ChevronLeft aria-hidden size={16} />
                    </button>
                    <button
                        type="button"
                        className={styles.navButton}
                        disabled={!next}
                        aria-label="Next date with tasks"
                        onClick={() => shift(1)}
                    >
                        <ChevronRight aria-hidden size={16} />
                    </button>
                    <button
                        type="button"
                        className={styles.navButton}
                        disabled={!next}
                        aria-label={`Next ${columns} dates with tasks`}
                        onClick={() => shift(columns)}
                    >
                        <ChevronsRight aria-hidden size={16} />
                    </button>
                    <div className={styles.dateJump}>
                        <label className="sr-only" htmlFor={pickerId}>
                            Jump to a date
                        </label>
                        <AppDatePicker
                            id={pickerId}
                            value={first ?? ""}
                            onChange={(date) => {
                                if (date) jump(date);
                            }}
                            allowPast
                            size="sm"
                        />
                    </div>
                </div>
            </nav>
            <div
                id={panelId}
                role="tabpanel"
                aria-label={`${label} task days`}
                className={styles.dayGrid}
            >
                {visible.map((day) => (
                    <section
                        key={day.date}
                        className={styles.dayColumn}
                        aria-label={`${label} on ${dateText(day.date, "EEEE, d MMMM yyyy")}`}
                        data-today={day.date === taskDateKey(now) || undefined}
                    >
                        <header className={styles.dayHeading}>
                            <time dateTime={day.date}>{dateText(day.date, "MMM d, yyyy")}</time>
                            <h2 className="h5">{dateText(day.date, "EEEE")}</h2>
                        </header>
                        <ul className={styles.ruledList}>
                            {day.tasks.map((task) => (
                                <li key={task.id} className={styles.historyLine}>
                                    {renderTask(task)}
                                </li>
                            ))}
                            {Array.from(
                                { length: Math.max(0, lineCount - day.tasks.length) },
                                (_, index) => (
                                    <li
                                        key={`line-${index}`}
                                        className={styles.blankLine}
                                        aria-hidden
                                    />
                                ),
                            )}
                        </ul>
                    </section>
                ))}
            </div>
        </section>
    );
}
