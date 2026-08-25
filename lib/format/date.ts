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
