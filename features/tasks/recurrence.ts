import { z } from "zod";

const DAY_MS = 86_400_000;
export const WEEKDAYS = [
    { value: 1, label: "Monday", short: "Mon" },
    { value: 2, label: "Tuesday", short: "Tue" },
    { value: 3, label: "Wednesday", short: "Wed" },
    { value: 4, label: "Thursday", short: "Thu" },
    { value: 5, label: "Friday", short: "Fri" },
    { value: 6, label: "Saturday", short: "Sat" },
    { value: 0, label: "Sunday", short: "Sun" },
];
const dateSchema = z.iso.date().refine((date) => date >= "1900-01-01" && date <= "9999-12-31");
export const taskRepeatSchema = z
    .object({
        unit: z.enum(["day", "week", "month", "year"]),
        interval: z.number().int().min(1).max(365),
        weekdays: z
            .array(z.number().int().min(0).max(6))
            .refine((days) => new Set(days).size === days.length),
        until: dateSchema.nullable(),
    })
    .refine(
        (rule) => (rule.unit === "week" ? rule.weekdays.length > 0 : rule.weekdays.length === 0),
        "Choose at least one weekday for a weekly repeat.",
    );
export type TaskRepeat = z.infer<typeof taskRepeatSchema>;

function dayNumber(date: string): number {
    return Date.parse(`${date}T12:00:00Z`) / DAY_MS;
}
function dayKey(day: number): string | null {
    const date = new Date(day * DAY_MS);
    const year = date.getUTCFullYear();
    return year >= 1900 && year <= 9999 ? date.toISOString().slice(0, 10) : null;
}
export function shiftTaskDate(date: string, days: number): string | null {
    return dayKey(dayNumber(date) + days);
}
export function taskDaysBetween(from: string, to: string): number {
    return Math.round(dayNumber(to) - dayNumber(from));
}
export function taskWeekday(date: string): number {
    return new Date(`${date}T12:00:00Z`).getUTCDay();
}
function monthDay(year: number, month: number, date: number): string | null {
    const last = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
    return dayKey(Date.UTC(year, month, Math.min(date, last), 12) / DAY_MS);
}

/** Calendar arithmetic is timezone-independent. Month/year repeats retain the
 * original day, so 31 Jan → 28 Feb → 31 Mar and leap-day repeats recover. */
export function nextRepeatDate(anchor: string, after: string, rule: TaskRepeat): string | null {
    if (
        !dateSchema.safeParse(anchor).success ||
        !dateSchema.safeParse(after).success ||
        !taskRepeatSchema.safeParse(rule).success
    )
        return null;
    const start = dayNumber(anchor),
        cutoff = Math.max(start, dayNumber(after));
    let next: string | null = null;
    if (rule.unit === "day") {
        next = dayKey(start + (Math.floor((cutoff - start) / rule.interval) + 1) * rule.interval);
    } else if (rule.unit === "week") {
        const monday = start - ((taskWeekday(anchor) + 6) % 7);
        const firstWeek = Math.floor((cutoff - monday) / (7 * rule.interval));
        const offsets = rule.weekdays.map((day) => (day + 6) % 7).sort((a, b) => a - b);
        for (let week = firstWeek; week <= firstWeek + 1 && !next; week++) {
            for (const offset of offsets) {
                const candidate = monday + week * rule.interval * 7 + offset;
                if (candidate > cutoff && candidate >= start) {
                    next = dayKey(candidate);
                    break;
                }
            }
        }
    } else {
        const original = new Date(`${anchor}T12:00:00Z`);
        const afterDate = new Date(cutoff * DAY_MS);
        const months = rule.unit === "year" ? rule.interval * 12 : rule.interval;
        const originMonth = original.getUTCFullYear() * 12 + original.getUTCMonth();
        const currentMonth = afterDate.getUTCFullYear() * 12 + afterDate.getUTCMonth();
        const index = Math.max(0, Math.floor((currentMonth - originMonth) / months));
        for (let step = index; step <= index + 1 && !next; step++) {
            const target = originMonth + step * months;
            const candidate = monthDay(Math.floor(target / 12), target % 12, original.getUTCDate());
            if (candidate && dayNumber(candidate) > cutoff) next = candidate;
        }
    }
    return next && (!rule.until || next <= rule.until) ? next : null;
}

export function taskRepeatLabel(rule: TaskRepeat | null): string {
    if (!rule) return "Does not repeat";
    if (
        rule.unit === "week" &&
        rule.interval === 1 &&
        rule.weekdays.length === 5 &&
        [1, 2, 3, 4, 5].every((day) => rule.weekdays.includes(day))
    )
        return "Every weekday";
    const base =
        rule.interval === 1
            ? ({ day: "Daily", week: "Weekly", month: "Monthly", year: "Yearly" } as const)[
                  rule.unit
              ]
            : `Every ${rule.interval} ${rule.unit}s`;
    const days =
        rule.unit === "week"
            ? ` · ${WEEKDAYS.filter((day) => rule.weekdays.includes(day.value))
                  .map((day) => day.short)
                  .join(", ")}`
            : "";
    return `${base}${days}`;
}
