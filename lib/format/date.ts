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
