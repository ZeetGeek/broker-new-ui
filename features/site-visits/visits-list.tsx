"use client";

import { useMemo } from "react";

import { useReducedMotion } from "motion/react";

import { formatDateIso, formatDateShort, isSameCalendarDay } from "@/lib/format/date";
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

type DayGroup = {
    key: string;
    day: Date;
    visits: VisitItem[];
};

/** Groups visits into calendar days, each day's visits ordered by clock time. */
function groupByDay(visits: VisitItem[]): DayGroup[] {
    const buckets = new Map<string, DayGroup>();

    for (const visit of visits) {
        const scheduled = new Date(visit.scheduledAt);
        const key = dayKey(scheduled);
        const existing = buckets.get(key);

        if (existing) {
            existing.visits.push(visit);
        } else {
            const day = new Date(scheduled);
            day.setHours(0, 0, 0, 0);
            buckets.set(key, { key, day, visits: [visit] });
        }
    }

    const groups = [...buckets.values()];
    // The API already sorted the flat list, but grouping loses that guarantee
    // across days, so both levels are sorted explicitly here.
    groups.sort((a, b) => a.day.getTime() - b.day.getTime());
    for (const group of groups) {
        group.visits.sort(
            (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
        );
    }

    return groups;
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
}: VisitsListProps) {
    const groups = useMemo(() => groupByDay(visits), [visits]);

    return (
        <div className="flex flex-col gap-6">
            {onSelectDay ? (
                <WeekStrip
                    now={now}
                    selectedDay={selectedDay}
                    onSelectDay={onSelectDay}
                    dayCounts={dayCounts ?? new Map()}
                />
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
            ) : null}

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
                            <span className="tabular">{group.visits.length}</span>{" "}
                            {group.visits.length === 1 ? "visit" : "visits"}
                        </span>
                    </h2>

                    <div
                        className="
                          overflow-hidden rounded-card border border-bs-0 border-border-warm
                        "
                    >
                        {group.visits.map((visit) => (
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
    );
}

/**
 * The seven days from today, as a day filter.
 *
 * Tapping a day narrows the list to that day; tapping it again clears it.
 * Filtering rather than scrolling means the answer to "what does Thursday
 * look like" is the only thing on screen, which is what a broker on a small
 * Android phone can actually act on.
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
}: {
    now: Date;
    selectedDay: string;
    onSelectDay: (dayKey: string) => void;
    dayCounts: Map<string, number>;
}) {
    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(now, i)), [now]);
    const reduceMotion = useReducedMotion();

    return (
        // The seven days share the full width rather than sitting in a short
        // fixed-width row — a strip that stops a third of the way across reads
        // as a rendering fault, not as a control.
        <div
            role="group"
            aria-label="Filter visits by day"
            className="grid grid-cols-7 gap-1 rounded-card border border-border-warm bg-surface p-1"
        >
            <AnimatedBackground
                // Passing "" when nothing is selected retracts the pill, so
                // clearing the filter is visible rather than silent.
                defaultValue={selectedDay}
                // AnimatedBackground overwrites each child's onClick with its
                // own, so selection is routed through here — an onClick on the
                // button below would be discarded by cloneElement.
                onValueChange={(id) => onSelectDay(id === selectedDay ? "" : (id ?? ""))}
                className="rounded-inner bg-brand-ink/10 ring-1 ring-brand-ink"
                transition={reduceMotion ? { duration: 0 } : spring.snappy}
            >
                {days.map((day) => {
                    const key = dayKey(day);
                    const count = dayCounts.get(key) ?? 0;
                    const isToday = isSameCalendarDay(day, now);
                    const isSelected = selectedDay === key;

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
                        ? `${dateLabel} — ${load}. Tap to show every day.`
                        : `${dateLabel} — ${load}. Tap to show only this day.`;

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
                                    <span className="body-xs text-ink-subtle">
                                        {day.toLocaleDateString("en-IN", { weekday: "short" })}
                                    </span>
                                    <span
                                        className={cn(
                                            `
                                              body-sm tabular flex items-center justify-center
                                              rounded-full font-semibold block-7 inline-7
                                            `,
                                            isToday ? "bg-brand-ink text-white" : "text-ink",
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
                                            count > 0 ? "bg-brand" : "bg-transparent",
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
    );
}
