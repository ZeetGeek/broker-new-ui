import { tz } from "@date-fns/tz";
import { addDays, addMonths, differenceInMinutes, startOfWeek } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { MIN_NOTICE_MINUTES, VISITS_TIME_ZONE } from "@/lib/visits/constants";

export function addVisitDays(value: Date, amount: number): Date {
    return addDays(value, amount, { in: tz(VISITS_TIME_ZONE) });
}

export function addVisitMonths(value: Date, amount: number): Date {
    return addMonths(value, amount, { in: tz(VISITS_TIME_ZONE) });
}

export function visitWeekDays(anchor: string): Date[] {
    const start = startOfWeek(istDayAsDate(anchor), { weekStartsOn: 1, in: tz(VISITS_TIME_ZONE) });
    return Array.from({ length: 7 }, (_, index) => addVisitDays(start, index));
}

export function formatVisitTime(value: string | Date): string {
    return formatInTimeZone(value, VISITS_TIME_ZONE, "h:mm a");
}

export function formatVisitDate(value: string | Date): string {
    return formatInTimeZone(value, VISITS_TIME_ZONE, "EEE d MMM");
}

export function formatVisitA11yDate(value: string | Date): string {
    return formatInTimeZone(value, VISITS_TIME_ZONE, "EEEE d MMMM yyyy");
}

export function formatVisitDayHeading(value: string | Date, now = new Date()): string {
    const key = istDateKey(value);
    const today = istDateKey(now);
    const tomorrow = istDateKey(addDays(istDayAsDate(now), 1, { in: tz(VISITS_TIME_ZONE) }));
    const prefix =
        key === today
            ? "Today"
            : key === tomorrow
              ? "Tomorrow"
              : formatInTimeZone(value, VISITS_TIME_ZONE, "EEEE");
    return `${prefix}, ${formatInTimeZone(value, VISITS_TIME_ZONE, "EEE d MMM")}`;
}

export function istDateKey(value: string | Date): string {
    return formatInTimeZone(value, VISITS_TIME_ZONE, "yyyy-MM-dd");
}

export function istDayAsDate(value: string | Date): Date {
    const dateKey = istDateKey(value);
    return fromZonedTime(`${dateKey}T00:00:00`, VISITS_TIME_ZONE);
}

export function dateAtIstOffset(dayOffset: number, hour: number, minute = 0): string {
    const day = addDays(istDayAsDate(new Date()), dayOffset, { in: tz(VISITS_TIME_ZONE) });
    const dateKey = formatInTimeZone(day, VISITS_TIME_ZONE, "yyyy-MM-dd");
    return fromZonedTime(
        `${dateKey}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
        VISITS_TIME_ZONE,
    ).toISOString();
}

export function durationMinutes(startsAt: string, endsAt: string): number {
    return differenceInMinutes(new Date(endsAt), new Date(startsAt));
}

export function isTooSoon(startsAt: string, now = new Date()): boolean {
    return differenceInMinutes(new Date(startsAt), now) < MIN_NOTICE_MINUTES;
}

export function visitAge(createdAt: string, now = new Date()): string {
    const minutes = Math.max(0, differenceInMinutes(now, new Date(createdAt)));
    if (minutes < 60) return `asked ${Math.max(1, minutes)}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `asked ${hours}h ago`;
    return `asked ${Math.floor(hours / 24)}d ago`;
}

export function inputValueInIst(value: string | Date): string {
    return formatInTimeZone(value, VISITS_TIME_ZONE, "yyyy-MM-dd'T'HH:mm");
}

export function inputValueToUtc(value: string): string {
    return fromZonedTime(value, VISITS_TIME_ZONE).toISOString();
}
