import { tz, TZDate } from "@date-fns/tz";
import { transpose } from "date-fns";

/** IANA timezone for the current user (browser/system). Falls back to UTC on the server. */
export function getUserTimeZone(): string {
    if (typeof Intl !== "undefined") {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
    return "UTC";
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
    return transpose(zoned, Date);
}
