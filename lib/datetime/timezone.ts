import { tz, TZDate } from "@date-fns/tz";
/** Single-city India launch: display and booking use IST on server and device alike. */
export const APP_TIME_ZONE = "Asia/Kolkata";

/** App scheduling timezone. Kept under the existing name for caller compatibility. */
export function getUserTimeZone(): string {
    return APP_TIME_ZONE;
}

/** date-fns context option for the user's timezone. */
export function userTzContext(timeZone = getUserTimeZone()) {
    return tz(timeZone);
}

/** UTC instant → TZDate in the user's timezone (for display / pickers). */
export function toUserZonedTime(date: Date, timeZone = getUserTimeZone()): TZDate {
    return new TZDate(date, timeZone);
}

/**
 * Wall-clock instant in the user's timezone → UTC Date for API payloads.
 * Use when the user picks a local date/time in a slot or visit form.
 */
export function fromUserZonedTime(date: Date, timeZone = getUserTimeZone()): Date {
    const zoned = date instanceof TZDate ? date : new TZDate(date, timeZone);
    return new Date(zoned.getTime());
}
