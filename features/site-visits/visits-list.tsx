"use client";

import { type ReactNode, useMemo, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "motion/react";

import {
    formatDateIso,
    formatDateShort,
    formatTime24,
    formatTimeIn,
    isSameCalendarDay,
} from "@/lib/format/date";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

import { AnimatedBackground } from "@/components/motion-primitives/animated-background";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { VisitItem, VisitViewer } from "@/features/site-visits/types";
import { VisitRow, type VisitRowHandlers } from "@/features/site-visits/visit-row";
import { VisitsDayEmpty } from "@/features/site-visits/visits-empty";

/** Local calendar-day key, for bucketing visits into day sections. */
function dayKey(date: Date): string {
    return formatDateIso(date);
}

function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    next.setHours(0, 0, 0, 0);
    return next;
}

/**
 * `Sep 8 · Today · Tuesday`.
 *
 * The relative word carries the meaning and the date anchors it — a broker
 * scanning for "tomorrow" should not have to do the arithmetic, and one
 * scanning for the 12th should not have to count forward from today.
 */
function dayHeading(day: Date, now: Date): string {
    const date = formatDateShort(day);
    const weekday = day.toLocaleDateString("en-IN", { weekday: "long" });

    if (isSameCalendarDay(day, now)) return `${date} · Today · ${weekday}`;
    if (isSameCalendarDay(day, addDays(now, 1))) return `${date} · Tomorrow · ${weekday}`;
    if (isSameCalendarDay(day, addDays(now, -1))) return `${date} · Yesterday · ${weekday}`;

    return `${date} · ${weekday}`;
}

/**
 * The hour a visit sits in, `0`-`23`, on the user's wall clock.
 *
 * Read off the formatted time rather than `getHours()` so the bucket agrees
 * with the time printed on the row. A broker in a different timezone from
 * their browser would otherwise see a 10:00 AM visit filed under 4 AM.
 */
function hourOf(date: Date): number {
    return Number(formatTime24(date).slice(0, 2));
}

/** `10:00 AM – 11:00 AM`, the span a bucket covers. */
function hourRangeLabel(day: Date, hour: number): string {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(hour + 1);

    return `${formatTimeIn(start)} – ${formatTimeIn(end)}`;
}

type HourGroup = {
    key: string;
    hour: number;
    label: string;
    visits: VisitItem[];
};

type DayGroup = {
    key: string;
    day: Date;
    /** Flat count for the day heading — the hour buckets below split it up. */
    total: number;
    hours: HourGroup[];
};

/**
 * Groups visits into calendar days, then into one-hour bands inside each day.
 *
 * A day with six visits is a wall of rows; the same day split into "10–11,
 * two" and "4–5, one" is a shape the broker can hold in their head and plan
 * travel around. Only hours that actually hold something get a band — an
 * empty 3 PM is not worth a line, and printing all twenty-four would bury
 * the three that matter.
 */
function groupByDay(visits: VisitItem[]): DayGroup[] {
    const buckets = new Map<string, { day: Date; visits: VisitItem[] }>();

    for (const visit of visits) {
        const scheduled = new Date(visit.scheduledAt);
        const key = dayKey(scheduled);
        const existing = buckets.get(key);

        if (existing) {
            existing.visits.push(visit);
        } else {
            const day = new Date(scheduled);
            day.setHours(0, 0, 0, 0);
            buckets.set(key, { day, visits: [visit] });
        }
    }

    // The API already sorted the flat list, but grouping loses that guarantee
    // across days, so every level is sorted explicitly here.
    return [...buckets.entries()]
        .sort((a, b) => a[1].day.getTime() - b[1].day.getTime())
        .map(([key, { day, visits: dayVisits }]) => {
            const hourBuckets = new Map<number, VisitItem[]>();

            for (const visit of dayVisits) {
                const hour = hourOf(new Date(visit.scheduledAt));
                const bucket = hourBuckets.get(hour);
                if (bucket) bucket.push(visit);
                else hourBuckets.set(hour, [visit]);
            }

            const hours = [...hourBuckets.entries()]
                .sort((a, b) => a[0] - b[0])
                .map(([hour, hourVisits]) => ({
                    key: `${key}-${String(hour).padStart(2, "0")}`,
                    hour,
                    label: hourRangeLabel(day, hour),
                    visits: hourVisits.sort(
                        (a, b) =>
                            new Date(a.scheduledAt).getTime() -
                            new Date(b.scheduledAt).getTime(),
                    ),
                }));

            return { key, day, total: dayVisits.length, hours };
        });
}

type VisitsListProps = {
    visits: VisitItem[];
    viewer: VisitViewer;
    handlers: VisitRowHandlers;
    busyId: string | null;
    now: Date;
    /** The selected day as `YYYY-MM-DD`, or "" when no single day is picked. */
    selectedDay?: string;
    /**
     * Whether any date window is active. Distinct from `selectedDay`, which is
     * empty for a multi-day range — the empty state must still show for one.
     */
    hasDateWindow?: boolean;
    /** Selects a day, or clears it when the same day is tapped again. */
    onSelectDay?: (dayKey: string) => void;
    /**
     * Per-day counts for the whole book, unnarrowed by the day filter. The
     * strip must keep showing what Thursday holds while Wednesday is
     * selected, so it cannot count the rows it is currently displaying.
     */
    dayCounts?: Map<string, number>;
    /**
     * The date-window control, rendered beside the week nav.
     *
     * Passed in rather than built here: it writes the page's filters, which
     * the list knows nothing about. A slot keeps the two date controls on one
     * row without the list having to grow a filter API.
     */
    dateControl?: ReactNode;
    /**
     * Shown in place of the day sections when nothing matched. Rendered here
     * rather than by the page so the strip and date control survive an empty
     * result — they are how the user gets back out of one.
     */
    emptyState?: ReactNode;
    /** The active window as `YYYY-MM-DD`, for labelling a multi-day range. */
    dateFrom?: string;
    dateTo?: string;
};

/**
 * The visits list, grouped into day sections.
 *
 * A flat list of visits answers "what is booked"; a day-grouped one answers
 * "what does Thursday look like", which is the question a broker planning
 * their week actually asks. The day header doubles as the empty-day marker,
 * so a quiet Thursday is visible rather than silently absent.
 */
export function VisitsList({
    visits,
    viewer,
    handlers,
    busyId,
    now,
    selectedDay = "",
    hasDateWindow = false,
    onSelectDay,
    dayCounts,
    dateControl,
    emptyState,
    dateFrom = "",
    dateTo = "",
}: VisitsListProps) {
    const groups = useMemo(() => groupByDay(visits), [visits]);

    /**
     * A date window that is not a single day — a range picked from the
     * calendar.
     *
     * The strip hides for one. A range spans weeks the strip cannot show at
     * once, so whichever week it landed on would be an arbitrary slice of the
     * answer, and none of its days would be the selection. The range chip
     * says what is on screen instead.
     */
    const isRangeWindow = hasDateWindow && !selectedDay;
    const showStrip = Boolean(onSelectDay) && !isRangeWindow;

    return (
        <div className="flex flex-col gap-6">
            {showStrip && onSelectDay ? (
                <WeekStrip
                    now={now}
                    selectedDay={selectedDay}
                    onSelectDay={onSelectDay}
                    dayCounts={dayCounts ?? new Map()}
                    dateControl={dateControl}
                />
            ) : dateControl ? (
                // Historical views and ranges drop the week strip — it reads
                // one week forward and would point at the wrong thing. The
                // date control still has to show somewhere, so it keeps its
                // row, with the window spelled out where the month label sat.
                <div className="flex items-center justify-between gap-2">
                    <p className="body-sm font-semibold text-ink">
                        {isRangeWindow ? rangeLabel(dateFrom, dateTo) : null}
                    </p>
                    {dateControl}
                </div>
            ) : null}

            {/* An empty day keeps the strip above it, so the tap that got
                the user here is also the way back out. Replacing the whole
                list with a page-level empty state would take the strip away
                and leave them stranded. */}
            {groups.length === 0 && hasDateWindow ? (
                <div className="rounded-card border border-border-warm">
                    {/* No action offered: /broker/visits/new takes no date
                        yet, so a "Propose a time" button would silently lose
                        the day the user picked. */}
                    <VisitsDayEmpty isRange={!selectedDay} />
                </div>
            ) : (
                emptyState
            )}

            {groups.map((group) => (
                <section key={group.key} id={`visits-day-${group.key}`} className="flex flex-col">
                    <h2
                        className="
                          body-sm sticky inset-bs-0 z-10 border-be border-border-warm bg-canvas
                          pbe-2 font-semibold text-ink
                        "
                    >
                        {dayHeading(group.day, now)}
                        {/* "2 visits" rather than a bare "2" — a lone number
                            beside a date reads as part of the date. */}
                        <span className="ms-2 font-normal text-ink-subtle">
                            <span className="tabular">{group.total}</span>{" "}
                            {group.total === 1 ? "visit" : "visits"}
                        </span>
                    </h2>

                    {/* One card per hour band rather than one card per day:
                        the gap between bands is what makes a free afternoon
                        visible at a glance. */}
                    <div className="flex flex-col gap-3 pbs-3">
                        {group.hours.map((band) => (
                            <section key={band.key} className="flex flex-col gap-1.5">
                                <h3 className="body-xs flex items-center gap-2 text-ink-subtle">
                                    <span className="tabular font-semibold text-ink">
                                        {band.label}
                                    </span>
                                    <span aria-hidden className="flex-1 bg-border-warm block-px" />
                                    <span className="tabular">
                                        {band.visits.length}{" "}
                                        {band.visits.length === 1 ? "visit" : "visits"}
                                    </span>
                                </h3>

                                <div
                                    className="
                                      overflow-hidden rounded-card border border-border-warm
                                    "
                                >
                                    {band.visits.map((visit) => (
                                        <VisitRow
                                            key={visit.id}
                                            visit={visit}
                                            viewer={viewer}
                                            handlers={handlers}
                                            isBusy={busyId === visit.id}
                                            now={now}
                                            className="last:border-be-0"
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

/** Days visible at once. One week reads as a week; more becomes a calendar. */
const STRIP_DAYS = 7;

/**
 * Monday of the week containing `date`.
 *
 * Monday-start rather than Sunday: it is the en-IN convention, and it keeps
 * Saturday and Sunday together at the end of the row instead of splitting
 * the weekend across both edges.
 */
function startOfWeek(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    // getDay() is 0 for Sunday, which is 6 days into a Monday-start week.
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return start;
}

/** Whole days between two instants, by calendar day rather than elapsed time. */
function daysBetween(from: Date, to: Date): number {
    const a = new Date(from);
    a.setHours(0, 0, 0, 0);
    const b = new Date(to);
    b.setHours(0, 0, 0, 0);
    return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * `September 2026`, or `Sep – Oct 2026` for a week that straddles two months.
 *
 * The strip shows bare date numbers, so a week running 28, 29, 30, 1, 2 is
 * ambiguous without the months named above it.
 */
function weekLabel(weekStart: Date): string {
    const weekEnd = addDays(weekStart, STRIP_DAYS - 1);
    const year = weekEnd.toLocaleDateString("en-IN", { year: "numeric" });

    if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.toLocaleDateString("en-IN", { month: "long" })} ${year}`;
    }

    const from = weekStart.toLocaleDateString("en-IN", { month: "short" });
    const to = weekEnd.toLocaleDateString("en-IN", { month: "short" });

    // A week spanning New Year needs both years, not just the later one.
    if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
        return `${from} ${weekStart.getFullYear()} – ${to} ${weekEnd.getFullYear()}`;
    }

    return `${from} – ${to} ${year}`;
}

/**
 * `9 September 2026 – 30 September 2026`, trimmed where the ends agree.
 *
 * Written out in full rather than as `9 Sep – 30 Sep`: the chip above is
 * already the short form, and this line is the one a broker reads to be sure
 * which month and year they are looking at. The repeated half is dropped —
 * "9 – 30 September 2026" says the same thing without the echo.
 */
function rangeLabel(dateFrom: string, dateTo: string): string {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T00:00:00`) : null;
    if (!from || !to) return "";

    const full = (date: Date) =>
        date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    if (from.getFullYear() !== to.getFullYear()) return `${full(from)} – ${full(to)}`;

    const year = from.getFullYear();

    if (from.getMonth() !== to.getMonth()) {
        const monthDay = (date: Date) =>
            date.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
        return `${monthDay(from)} – ${monthDay(to)} ${year}`;
    }

    const month = from.toLocaleDateString("en-IN", { month: "long" });
    return `${from.getDate()} – ${to.getDate()} ${month} ${year}`;
}

/**
 * The day filter: one calendar week at a time.
 *
 * Tapping a day narrows the list to that day; tapping it again clears it.
 * Filtering rather than scrolling means the answer to "what does Thursday
 * look like" is the only thing on screen, which is what a broker on a small
 * Android phone can actually act on.
 *
 * The window is a whole Mon–Sun week and the arrows step a week at a time,
 * so a given weekday stays in the same column as the user pages through.
 * Anchoring on the calendar rather than on today is what makes that true —
 * a today-anchored window would put Thursday in a different place in every
 * step, and "which column is Saturday" would have to be re-read each time.
 *
 * Past days stay visible and selectable: "what happened on Monday" is a real
 * question, and dropping those days would shift the row's alignment anyway.
 *
 * Every day is selectable, including the empty ones. "Is Friday free?" is a
 * real question a broker asks before promising a buyer a time, and a dead
 * button answers it only by implication. Tapping an empty day says so in
 * words instead.
 *
 * The selected pill slides between days rather than cutting, which shows
 * *which way* the selection moved — a jump cut leaves the eye to re-find it.
 */
function WeekStrip({
    now,
    selectedDay,
    onSelectDay,
    dayCounts,
    dateControl,
}: {
    now: Date;
    selectedDay: string;
    onSelectDay: (dayKey: string) => void;
    dayCounts: Map<string, number>;
    dateControl?: ReactNode;
}) {
    const reduceMotion = useReducedMotion();

    const thisWeek = useMemo(() => startOfWeek(now), [now]);

    /** Weeks from the current one to the one on screen. Negative goes back. */
    const [weekOffset, setWeekOffset] = useState(0);

    /**
     * Jumps the window to a day selected from outside the strip.
     *
     * Keyed on the selection *changing*, not on what it currently is. The
     * arrows and the selection both drive the same offset, so a rule that
     * re-derived the week from `selectedDay` on every render would pin the
     * strip to the selected day's week and silently undo every arrow press.
     *
     * Paging away from the selected day is therefore allowed to stick — the
     * pill just scrolls out of view, which is what the arrows are for.
     */
    const [lastSelectedDay, setLastSelectedDay] = useState(selectedDay);

    if (selectedDay !== lastSelectedDay) {
        setLastSelectedDay(selectedDay);

        if (selectedDay) {
            const selectedWeek = startOfWeek(new Date(`${selectedDay}T00:00:00`));
            setWeekOffset(Math.round(daysBetween(thisWeek, selectedWeek) / STRIP_DAYS));
        }
    }

    const weekStart = useMemo(
        () => addDays(thisWeek, weekOffset * STRIP_DAYS),
        [thisWeek, weekOffset],
    );

    const days = useMemo(
        () => Array.from({ length: STRIP_DAYS }, (_, i) => addDays(weekStart, i)),
        [weekStart],
    );

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
                <p className="body-sm font-semibold text-ink">{weekLabel(weekStart)}</p>

                {/* Both date controls on one row: the calendar jumps to any
                    date, the arrows walk week by week. Split across two rows
                    they read as unrelated. */}
                <div className="flex items-center gap-2">
                    {dateControl}

                    <div className="flex items-center gap-1">
                        <StripArrow
                            direction="prev"
                            onClick={() => setWeekOffset(weekOffset - 1)}
                        />

                        {/* Clears the day filter as well as returning to this
                            week: a "Today" that lands the user on the current
                            week while the list still shows some other day
                            would be answering a different question than it
                            asked. */}
                        <button
                            type="button"
                            onClick={() => {
                                setWeekOffset(0);
                                onSelectDay(dayKey(now));
                            }}
                            className="
                              body-sm rounded-full border border-border-warm bg-surface px-3 py-1
                              font-medium text-ink transition-colors duration-160
                              hover:bg-surface-muted
                            "
                        >
                            Today
                        </button>

                        <StripArrow
                            direction="next"
                            onClick={() => setWeekOffset(weekOffset + 1)}
                        />
                    </div>
                </div>
            </div>

            {/* The seven days share the full width rather than sitting in a
                short fixed-width row — a strip that stops a third of the way
                across reads as a rendering fault, not as a control. */}
            <div
                role="group"
                aria-label="Filter visits by day"
                className="
                  grid grid-cols-7 gap-1 rounded-card border border-border-warm bg-surface p-1
                "
            >
                <AnimatedBackground
                    // Passing "" when nothing is selected retracts the pill, so
                    // clearing the filter is visible rather than silent.
                    defaultValue={selectedDay}
                    // AnimatedBackground overwrites each child's onClick with its
                    // own, so selection is routed through here — an onClick on the
                    // button below would be discarded by cloneElement.
                    // Re-tapping the selected day is a no-op, not a toggle:
                    // the strip always shows exactly one day, so clearing it
                    // here would silently widen the list to every date.
                    onValueChange={(id) => id && onSelectDay(id)}
                    className="rounded-inner bg-brand-ink/10 ring-1 ring-brand-ink"
                    transition={reduceMotion ? { duration: 0 } : spring.snappy}
                >
                    {days.map((day) => {
                        const key = dayKey(day);
                        const count = dayCounts.get(key) ?? 0;
                        const isToday = isSameCalendarDay(day, now);
                        const isSelected = selectedDay === key;
                        const isPast = daysBetween(now, day) < 0;

                        const dateLabel = day.toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                        });
                        const load =
                            count === 0
                                ? "nothing booked"
                                : `${count} ${count === 1 ? "visit" : "visits"}`;
                        const hint = isSelected
                            ? `${dateLabel} — ${load}. Showing this day.`
                            : `${dateLabel} — ${load}. Tap to show this day.`;

                        // `data-id` must sit on AnimatedBackground's *direct*
                        // child: it clones this element to inject the pill and
                        // reads the id off these props. A Tooltip wrapper here
                        // would hide the id and have its own children replaced,
                        // so the tooltip lives inside the button instead.
                        return (
                            <button
                                key={key}
                                type="button"
                                data-id={key}
                                aria-pressed={isSelected}
                                aria-label={hint}
                                className={cn(
                                    `
                                      justify-center rounded-inner px-1 py-2 transition-colors
                                      duration-160 inline-full
                                      [&>div]:inline-full
                                    `,
                                    // Today keeps its own resting tint; the
                                    // sliding pill carries selection.
                                    !isSelected && isToday && "bg-surface-muted",
                                    !isSelected && "hover:bg-surface-muted",
                                )}
                            >
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <span className="flex flex-col items-center gap-0.5" />
                                        }
                                    >
                                        {/* Past days recede rather than
                                            disappear: the column alignment is
                                            what makes a week scannable, and
                                            they are still worth tapping. */}
                                        <span
                                            className={cn(
                                                "body-xs",
                                                isPast ? "text-ink-muted" : "text-ink-subtle",
                                            )}
                                        >
                                            {day.toLocaleDateString("en-IN", {
                                                weekday: "short",
                                            })}
                                        </span>
                                        <span
                                            className={cn(
                                                `
                                                  body-sm tabular flex items-center justify-center
                                                  rounded-full font-semibold block-7 inline-7
                                                `,
                                                isToday
                                                    ? "bg-brand-ink text-white"
                                                    : isPast
                                                      ? "text-ink-muted"
                                                      : "text-ink",
                                            )}
                                        >
                                            {day.getDate()}
                                        </span>
                                        {/* A dot, not a digit: the number is
                                            already in the day heading below, and a
                                            second one here reads as part of the
                                            date. */}
                                        <span
                                            aria-hidden
                                            className={cn(
                                                "rounded-full block-1.5 inline-1.5",
                                                count === 0
                                                    ? "bg-transparent"
                                                    : isPast
                                                      ? "bg-border-warm"
                                                      : "bg-brand",
                                            )}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>{hint}</TooltipContent>
                                </Tooltip>
                            </button>
                        );
                    })}
                </AnimatedBackground>
            </div>
        </div>
    );
}

function StripArrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
    const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

    return (
        <button
            type="button"
            aria-label={direction === "prev" ? "Previous week" : "Next week"}
            onClick={onClick}
            className="
              flex shrink-0 items-center justify-center rounded-full border border-border-warm
              bg-surface text-ink transition-colors duration-160 block-8 inline-8
              hover:bg-surface-muted
            "
        >
            <Icon aria-hidden className="block-4 inline-4" strokeWidth={2} />
        </button>
    );
}
