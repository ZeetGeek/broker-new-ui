const TIME_ZONE = "Asia/Kolkata";
const LOCALE = "en-IN";

function partsFor(date: Date, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormatPart[] {
    return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options }).formatToParts(date);
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
    return parts.find((entry) => entry.type === type)?.value ?? "";
}

function calendarParts(date: Date): Intl.DateTimeFormatPart[] {
    return partsFor(date, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Calendar date as `dd/mm/yyyy`. */
export function formatDateIn(date: Date): string {
    const parts = calendarParts(date);
    return `${part(parts, "day")}/${part(parts, "month")}/${part(parts, "year")}`;
}

/** Calendar date as `yyyy-mm-dd` for `<time dateTime>`. */
export function formatDateIso(date: Date): string {
    const parts = calendarParts(date);
    return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

/** Conversational date as `24 Aug`. */
export function formatDateShort(date: Date): string {
    return new Intl.DateTimeFormat(LOCALE, {
        timeZone: TIME_ZONE,
        day: "numeric",
        month: "short",
    }).format(date);
}

/** Dashboard date line as `Mon, 24 Aug`. */
export function formatWeekdayDate(date: Date): string {
    return new Intl.DateTimeFormat(LOCALE, {
        timeZone: TIME_ZONE,
        weekday: "short",
        day: "numeric",
        month: "short",
    }).format(date);
}

/** Notification detail line as `Monday 03:20pm`. */
export function formatNotificationDayTime(date: Date): string {
    const weekday = new Intl.DateTimeFormat(LOCALE, {
        timeZone: TIME_ZONE,
        weekday: "long",
    }).format(date);
    const parts = partsFor(date, { hour: "2-digit", minute: "2-digit", hour12: true });
    const hour = part(parts, "hour");
    const minute = part(parts, "minute");
    const dayPeriod = part(parts, "dayPeriod").toLowerCase();
    return `${weekday} ${hour}:${minute}${dayPeriod}`;
}

/** Notification detail line as `Friday 3:04 PM`. */
export function formatNotificationWhen(date: Date): string {
    const weekday = new Intl.DateTimeFormat(LOCALE, {
        timeZone: TIME_ZONE,
        weekday: "long",
    }).format(date);
    return `${weekday} ${formatTimeIn(date)}`;
}

/** Wall-clock time as `11:00 AM`. */
export function formatTimeIn(date: Date): string {
    const parts = partsFor(date, { hour: "numeric", minute: "2-digit", hour12: true });
    const hour = part(parts, "hour");
    const minute = part(parts, "minute");
    const dayPeriod = part(parts, "dayPeriod").toUpperCase();
    return `${hour}:${minute} ${dayPeriod}`;
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

    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (scheduledDay === calendarDayKey(tomorrow)) {
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
    if (hoursAgo < 24) {
        return `${hoursAgo}h ago`;
    }

    const daysAgo = Math.round(hoursAgo / 24);
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
 * Uses Asia/Kolkata calendar days once the event is not same-day.
 */
export function formatCompactRelative(occurredAt: Date, now: Date): string {
    const elapsedMs = Math.max(0, now.getTime() - occurredAt.getTime());
    const minutes = Math.floor(elapsedMs / 60_000);

    if (minutes < 60) {
        return `${Math.max(1, minutes)}m`;
    }

    const hours = Math.floor(minutes / 60);
    if (calendarDayKey(occurredAt) === calendarDayKey(now)) {
        return `${hours}h`;
    }

    const occurredDay = calendarDayKey(occurredAt);
    const todayDay = calendarDayKey(now);
    const occurredUtc = Date.UTC(
        Number(occurredDay.slice(0, 4)),
        Number(occurredDay.slice(5, 7)) - 1,
        Number(occurredDay.slice(8, 10)),
    );
    const todayUtc = Date.UTC(
        Number(todayDay.slice(0, 4)),
        Number(todayDay.slice(5, 7)) - 1,
        Number(todayDay.slice(8, 10)),
    );
    const dayDiff = Math.max(1, Math.round((todayUtc - occurredUtc) / 86_400_000));
    return `${dayDiff}d`;
}

export type ActivityDayGroup = "today" | "yesterday" | "this_week";

/** Bucket an event into Today / Yesterday / This week (Asia/Kolkata calendar). */
export function activityDayGroup(occurredAt: Date, now: Date): ActivityDayGroup {
    const occurredDay = calendarDayKey(occurredAt);
    const todayDay = calendarDayKey(now);
    if (occurredDay === todayDay) return "today";

    // India has no DST — one day back is a stable calendar yesterday for bucketing.
    const yesterdayDay = calendarDayKey(new Date(now.getTime() - 86_400_000));
    if (occurredDay === yesterdayDay) return "yesterday";

    return "this_week";
}

/** Activity feed day header: `Today · 27 Aug`, `Yesterday · 26 Aug`, `Mon · 24 Aug`. */
export function formatActivityDayLabel(occurredAt: Date, now: Date): string {
    const datePart = formatDateShort(occurredAt);
    const group = activityDayGroup(occurredAt, now);

    if (group === "today") return `Today · ${datePart}`;
    if (group === "yesterday") return `Yesterday · ${datePart}`;

    const weekday = new Intl.DateTimeFormat(LOCALE, {
        timeZone: TIME_ZONE,
        weekday: "short",
    }).format(occurredAt);

    return `${weekday} · ${datePart}`;
}
