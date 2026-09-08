"use client";

import { useMemo } from "react";

import { formatDateIso, formatDateShort, isSameCalendarDay } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { VisitItem, VisitViewer } from "@/features/site-visits/types";
import { VisitRow, type VisitRowHandlers } from "@/features/site-visits/visit-row";

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
    /** Jumps to a day section. Omitted when the list is not date-ordered. */
    onJumpToDay?: (day: Date) => void;
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
    onJumpToDay,
}: VisitsListProps) {
    const groups = useMemo(() => groupByDay(visits), [visits]);

    return (
        <div className="flex flex-col gap-6">
            {onJumpToDay ? <WeekStrip groups={groups} now={now} onJumpToDay={onJumpToDay} /> : null}

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
 * The seven days from today, as a jump bar.
 *
 * Only days that actually hold a visit are clickable — an enabled control that
 * scrolls nowhere teaches the user not to trust the bar. Days with nothing on
 * them still render, because an empty Friday is information.
 */
function WeekStrip({
    groups,
    now,
    onJumpToDay,
}: {
    groups: DayGroup[];
    now: Date;
    onJumpToDay: (day: Date) => void;
}) {
    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(now, i)), [now]);
    const counts = useMemo(
        () => new Map(groups.map((group) => [group.key, group.visits.length])),
        [groups],
    );

    return (
        // The seven days share the full width rather than sitting in a short
        // fixed-width row — a strip that stops a third of the way across reads
        // as a rendering fault, not as a control.
        <div className="grid grid-cols-7 gap-1 rounded-card border border-border-warm bg-surface p-1">
            {days.map((day) => {
                const count = counts.get(dayKey(day)) ?? 0;
                const isToday = isSameCalendarDay(day, now);

                const dateLabel = day.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                });
                const hint =
                    count === 0
                        ? `${dateLabel} — nothing booked`
                        : `${dateLabel} — ${count} ${count === 1 ? "visit" : "visits"}. Tap to jump.`;

                return (
                    <Tooltip key={day.toISOString()}>
                        <TooltipTrigger
                            render={
                                <button
                                    type="button"
                                    disabled={count === 0}
                                    onClick={() => onJumpToDay(day)}
                                    className={cn(
                                        `
                                          flex flex-col items-center gap-0.5 rounded-inner px-1 py-2
                                          transition-colors duration-160
                                        `,
                                        count > 0
                                            ? "hover:bg-surface-muted"
                                            : "cursor-default opacity-40",
                                        isToday && "bg-surface-muted",
                                    )}
                                />
                            }
                        >
                            <span className="body-xs text-ink-subtle">
                                {day.toLocaleDateString("en-IN", { weekday: "short" })}
                            </span>
                            <span
                                className={cn(
                                    `
                                      body-sm tabular flex items-center justify-center rounded-full
                                      font-semibold block-7 inline-7
                                    `,
                                    isToday ? "bg-brand-ink text-white" : "text-ink",
                                )}
                            >
                                {day.getDate()}
                            </span>
                            {/* A dot, not a digit: the number is already in the
                                day heading below, and a second one here reads
                                as part of the date. */}
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
                );
            })}
        </div>
    );
}
