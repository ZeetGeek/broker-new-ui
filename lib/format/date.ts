/**
 * Display formatting — date-fns v4 + @date-fns/tz in the user's local timezone.
 * API instants arrive as UTC ISO strings; parse with `parseApiInstant`.
 */

import { tz } from "@date-fns/tz";
import {
    addDays,
    differenceInCalendarDays,
    format,
    formatDistanceToNowStrict,
    isSameDay,
} from "date-fns";

import { getUserTimeZone, userTzContext } from "@/lib/datetime/timezone";

const LOCALE = "en-IN";

function formatInUserTz(date: Date, pattern: string, timeZone = getUserTimeZone()): string {
    return format(date, pattern, { in: tz(timeZone), locale: undefined });
}

/** Whether two instants fall on the same calendar day in the user's timezone. */
export function isSameCalendarDay(a: Date, b: Date, timeZone = getUserTimeZone()): boolean {
    return isSameDay(a, b, { in: tz(timeZone) });
}

/** Whole calendar days between two instants in the user's timezone. */
export function calendarDaysBetween(from: Date, to: Date, timeZone = getUserTimeZone()): number {
    return Math.max(0, differenceInCalendarDays(to, from, { in: tz(timeZone) }));
}

function addCalendarDays(date: Date, days: number, timeZone = getUserTimeZone()): Date {
    return addDays(date, days, { in: tz(timeZone) });
}

/** Calendar date as `dd/mm/yyyy` in the user's timezone. */
export function formatDateIn(date: Date): string {
    return formatInUserTz(date, "dd/MM/yyyy");
}

/** Calendar date as `yyyy-mm-dd` for `<time dateTime>` (local calendar day). */
export function formatDateIso(date: Date): string {
    return formatInUserTz(date, "yyyy-MM-dd");
}

/** Conversational date as `24 Aug` in the user's timezone. */
export function formatDateShort(date: Date): string {
    return formatInUserTz(date, "d MMM");
}

/** Dashboard date line as `Mon, 24 Aug` in the user's timezone. */
export function formatWeekdayDate(date: Date): string {
    return formatInUserTz(date, "EEE, d MMM");
}

/** Notification detail line as `Monday 03:20pm`. */
export function formatNotificationDayTime(date: Date): string {
    const timeZone = getUserTimeZone();
    console.log("timeZone", timeZone);
    const weekday = formatInUserTz(date, "EEEE", timeZone);
    const parts = new Intl.DateTimeFormat(LOCALE, {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === "hour")?.value ?? "";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "";
    const dayPeriod = (parts.find((p) => p.type === "dayPeriod")?.value ?? "").toLowerCase();
    return `${weekday} ${hour}:${minute}${dayPeriod}`;
}

/** Notification detail line as `Friday 3:04 PM`. */
export function formatNotificationWhen(date: Date): string {
    const weekday = formatInUserTz(date, "EEEE");
    return `${weekday} ${formatTimeIn(date)}`;
}

/** Wall-clock time as `11:00 AM` in the user's timezone. */
export function formatTimeIn(date: Date): string {
    return formatInUserTz(date, "h:mm a");
}

/** 24-hour clock `HH:mm` for sorting and compact labels. */
export function formatTime24(date: Date): string {
    return formatInUserTz(date, "HH:mm");
}

function calendarDayKey(date: Date): string {
    return formatDateIso(date);
}

/** Site-visit when-line: `Today, 11:00 am` / `Tomorrow, 4:30 pm` / `26 Aug, 11:00 am`. */
export function formatShowingWhen(scheduledAt: Date, now: Date): string {
    const time = formatTimeIn(scheduledAt);
    const scheduledDay = calendarDayKey(scheduledAt);
    const today = calendarDayKey(now);

    if (scheduledDay === today) {
        return `Today, ${time}`;
    }

    if (scheduledDay === calendarDayKey(addCalendarDays(now, 1))) {
        return `Tomorrow, ${time}`;
    }

    return `${formatDateShort(scheduledAt)}, ${time}`;
}

export type DurationUntil = {
    label: string;
    minutesRemaining: number;
    isPast: boolean;
};

/** Relative past as `Just now` / `12m ago` / `3h ago` / `Yesterday` / `4d ago` / `24 Aug`. */
export function formatRelativePast(date: Date, now: Date): string {
    const minutesAgo = Math.round((now.getTime() - date.getTime()) / 60_000);

    if (minutesAgo < 0) {
        return formatDateShort(date);
    }

    if (minutesAgo < 1) {
        return "Just now";
    }

    if (minutesAgo < 60) {
        return `${minutesAgo}m ago`;
    }

    const hoursAgo = Math.round(minutesAgo / 60);
    if (hoursAgo < 24 && isSameCalendarDay(date, now)) {
        return `${hoursAgo}h ago`;
    }

    const daysAgo = calendarDaysBetween(date, now);
    if (daysAgo === 1) {
        return "Yesterday";
    }

    if (daysAgo < 7) {
        return `${daysAgo}d ago`;
    }

    return formatDateShort(date);
}

/** Relative wait until a showing: `in 2h 14m`, `in 18m`, or `Started`. */
export function formatDurationUntil(target: Date, now: Date): DurationUntil {
    const minutesRemaining = Math.round((target.getTime() - now.getTime()) / 60_000);

    if (minutesRemaining <= 0) {
        return { label: "Started", minutesRemaining: 0, isPast: true };
    }

    if (minutesRemaining < 60) {
        return {
            label: `in ${minutesRemaining}m`,
            minutesRemaining,
            isPast: false,
        };
    }

    const hours = Math.floor(minutesRemaining / 60);
    const minutes = minutesRemaining % 60;
    const label = minutes > 0 ? `in ${hours}h ${minutes}m` : `in ${hours}h`;

    return { label, minutesRemaining, isPast: false };
}

/**
 * Compact past relative for activity feeds: `12m`, `2h`, `1d`.
 * Uses the user's local calendar day once the event is not same-day.
 */
export function formatCompactRelative(occurredAt: Date, now: Date): string {
    const elapsedMs = Math.max(0, now.getTime() - occurredAt.getTime());
    const minutes = Math.floor(elapsedMs / 60_000);

    if (minutes < 60) {
        return `${Math.max(1, minutes)}m`;
    }

    const hours = Math.floor(minutes / 60);
    if (isSameCalendarDay(occurredAt, now)) {
        return `${hours}h`;
    }

    const dayDiff = calendarDaysBetween(occurredAt, now);
    return `${Math.max(1, dayDiff)}d`;
}

export type ActivityDayGroup = "today" | "yesterday" | "this_week";

/** Bucket an event into Today / Yesterday / This week (local calendar). */
export function activityDayGroup(occurredAt: Date, now: Date): ActivityDayGroup {
    if (isSameCalendarDay(occurredAt, now)) return "today";
    if (isSameCalendarDay(occurredAt, addCalendarDays(now, -1))) return "yesterday";
    return "this_week";
}

/** Activity feed day header: `Today · 27 Aug`, `Yesterday · 26 Aug`, `Mon · 24 Aug`. */
export function formatActivityDayLabel(occurredAt: Date, now: Date): string {
    const datePart = formatDateShort(occurredAt);
    const group = activityDayGroup(occurredAt, now);

    if (group === "today") return `Today · ${datePart}`;
    if (group === "yesterday") return `Yesterday · ${datePart}`;

    const weekday = formatInUserTz(occurredAt, "EEE");
    return `${weekday} · ${datePart}`;
}

/** Human-readable distance from now, e.g. for slot lists (`in 2 hours`, `3 days ago`). */
export function formatDistanceFromNow(date: Date, _now = new Date()): string {
    return formatDistanceToNowStrict(date, {
        addSuffix: true,
        roundingMethod: "floor",
        in: userTzContext(),
    });
}

// Re-export timezone + API helpers for visit/slot booking screens.
export {
    parseApiInstant,
    toApiDateOnly,
    toApiInstant,
    toApiInstantFromLocalParts,
} from "@/lib/datetime/api";
export {
    fromUserZonedTime,
    getUserTimeZone,
    toUserZonedTime,
    userTzContext,
} from "@/lib/datetime/timezone";
