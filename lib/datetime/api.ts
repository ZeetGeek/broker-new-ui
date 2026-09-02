/**
 * API date/time contract helpers (date-fns + @date-fns/tz).
 *
 * - Instants (createdAt, scheduledAt, …): ISO-8601 UTC with `Z` suffix.
 * - Date-only fields (availableFrom, …): `YYYY-MM-DD` calendar string — never UTC-shifted.
 */

import { tz, TZDate } from "@date-fns/tz";
import { format, formatISO, parseISO, transpose } from "date-fns";

import { fromUserZonedTime, getUserTimeZone } from "@/lib/datetime/timezone";

/** Parse an API instant (`2026-08-27T07:30:00.000Z`) to a Date. */
export function parseApiInstant(value: string): Date {
    return parseISO(value);
}

/** Serialize a Date instant for API request bodies (always UTC). */
export function toApiInstant(value: Date): string {
    return formatISO(value, { representation: "complete" });
}

/**
 * Serialize a calendar date for API request bodies.
 * Uses the user's local calendar day — not shifted to UTC.
 */
export function toApiDateOnly(value: Date, timeZone = getUserTimeZone()): string {
    return format(value, "yyyy-MM-dd", { in: tz(timeZone) });
}

/** Parse API date-only string (`YYYY-MM-DD`) as start of that day in the user's timezone. */
export function parseApiDateOnly(value: string, timeZone = getUserTimeZone()): Date {
    const zoned = new TZDate(`${value}T00:00:00`, timeZone);
    return transpose(zoned, Date);
}

/**
 * Combine a calendar date (`YYYY-MM-DD`) and wall-clock time (`HH:mm`) in the user's
 * timezone, returning a UTC instant for API payloads. For visit/slot booking forms.
 */
export function toApiInstantFromLocalParts(
    dateOnly: string,
    time24: string,
    timeZone = getUserTimeZone(),
): string {
    return toApiInstant(fromUserZonedTime(new TZDate(`${dateOnly}T${time24}:00`, timeZone)));
}
