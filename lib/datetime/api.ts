/**
 * API date/time contract helpers (date-fns + @date-fns/tz).
 *
 * - Instants (createdAt, scheduledAt, …): ISO-8601 UTC with `Z` suffix.
 * - Date-only fields (availableFrom, …): `YYYY-MM-DD` calendar string — never UTC-shifted.
 */

import { tz, TZDate } from "@date-fns/tz";
import { format, parseISO, transpose } from "date-fns";

import { getUserTimeZone } from "@/lib/datetime/timezone";

/** Parse an API instant (`2026-08-27T07:30:00.000Z`) to a Date. */
export function parseApiInstant(value: string): Date {
    return parseISO(value);
}

/**
 * Serialize a Date instant for API request bodies: UTC with `Z`
 * (`2026-10-06T04:30:00.000Z`). Not `formatISO` — that keeps the local offset.
 */
export function toApiInstant(value: Date): string {
    return new Date(value.getTime()).toISOString();
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
    // Numeric parts, not an ISO string: TZDate parses a string in the device's zone.
    const [year, month, day] = dateOnly.split("-").map(Number);
    const [hours, minutes] = time24.split(":").map(Number);
    return toApiInstant(new TZDate(year, month - 1, day, hours, minutes, timeZone));
}

/**
 * Local calendar date + wall-clock time → the same instant as a UTC calendar date
 * (`YYYY-MM-DD`) and UTC time (`HH:mm`). For APIs that take dates and times separately.
 */
export function toApiUtcParts(
    dateOnly: string,
    time24: string,
    timeZone = getUserTimeZone(),
): { date: string; time: string } {
    const instant = toApiInstantFromLocalParts(dateOnly, time24, timeZone);
    return { date: instant.slice(0, 10), time: instant.slice(11, 16) };
}
