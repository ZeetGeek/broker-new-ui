import { MAX_REMINDER_MINUTES } from "@/lib/reminders";
import { inputValueInIst } from "@/lib/visits/time";

import { isTaskDate, isTaskTime, taskDateKey, type TaskPriority } from "./model";
import { shiftTaskDate, type TaskRepeat, taskRepeatSchema, taskWeekday } from "./recurrence";

export type QuickAddRange = { start: number; end: number };
export type QuickAddEntityKind = "property" | "client" | "owner";
/** A picked # / @ record. Its text is atomic: one Backspace removes all of it. */
export type QuickAddEntity = QuickAddRange & {
    kind: QuickAddEntityKind;
    refId: string;
    label: string;
};
export type QuickAddAtomKind =
    "date" | "time" | "due" | "due-date" | "due-time" | "repeat" | "priority" | "reminder";
export type QuickAddAtom = QuickAddRange & { kind: QuickAddAtomKind; minutes?: number };
export type QuickAddHighlightKind =
    "schedule" | "due" | "priority" | "reminder" | QuickAddEntityKind;
export type QuickAddHighlight = QuickAddRange & { kind: QuickAddHighlightKind };
export type QuickAddMention = QuickAddRange & { kind: "property" | "contact"; query: string };

export type QuickAddParse = {
    /** Recognised phrases that become task fields. */
    atoms: QuickAddAtom[];
    /** Visual groups: adjacent date / time / repeat phrases read as one highlight. */
    highlights: QuickAddHighlight[];
    /**
     * Title with recognised phrases stripped — used to decide whether the field
     * has a real task name. The saved title keeps the typed words in place.
     */
    title: string;
    /** Start schedule — from plain `today` / `5pm` / `next Monday` words. */
    startDate: string | null;
    startTime: string | null;
    /** Optional end schedule — only from an explicit `due …` clause. */
    dueDate: string | null;
    dueTime: string | null;
    /**
     * Alias of `startDate` / `startTime` for older call sites.
     * Prefer the start* names in new code.
     */
    date: string | null;
    time: string | null;
    repeat: TaskRepeat | null;
    priority: TaskPriority | null;
    reminders: number[];
    propertyId: string | null;
    clientId: string | null;
    ownerId: string | null;
};

export type QuickAddParseOptions = {
    now: number;
    /** Day the composer belongs to; time-only and repeat phrases schedule from here. */
    baseDate?: string | null;
    entities?: readonly QuickAddEntity[];
    /** Phrases the user turned back into plain text. */
    dismissed?: readonly QuickAddRange[];
    /** Open # / @ search; its text is a query, not task words. */
    mention?: QuickAddMention | null;
};

export type QuickAddCatalogs = {
    clients: { id: string; name: string }[];
    owners: { id: string; name: string }[];
    properties: {
        id: string;
        title: string;
        locality: string;
        city: string;
        address?: string;
        configLabel?: string;
    }[];
};

export type QuickAddOption = {
    id: string;
    kind: QuickAddEntityKind;
    label: string;
    detail: string;
};

export const QUICK_ADD_PRIORITY_TOKENS: Record<TaskPriority, string> = {
    urgent: "P1",
    high: "P2",
    medium: "P3",
    low: "P4",
};

const PRIORITY_BY_DIGIT: Record<string, TaskPriority> = {
    "1": "urgent",
    "2": "high",
    "3": "medium",
    "4": "low",
};

const DAY_INDEX: Record<string, number> = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tues: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thur: 4,
    thurs: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6,
};
const MONTH_INDEX: Record<string, number> = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
};
const WORD_NUMBERS: Record<string, number> = {
    a: 1,
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
};

const L = String.raw`(?<![\p{L}\p{N}])`;
const R = String.raw`(?![\p{L}\p{N}])`;
const ON = String.raw`(?:(?:on|by|due|before)\s+)?`;
const DAY_FULL = "sunday|monday|tuesday|wednesday|thursday|friday|saturday";
const DAY_SHORT = "sun|mon|tues|tue|wed|thurs|thur|thu|fri|sat";
const DAY = `${DAY_FULL}|${DAY_SHORT}`;
const MONTH =
    "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec";
const DAY_LIST_SEPARATOR = String.raw`(?:\s*,\s*(?:and\s+)?|\s+and\s+|\s*&\s*)`;

const pattern = (source: string) => new RegExp(source, "giu");

type Ctx = { now: number; today: string };
type Matcher<T> = { pattern: RegExp; resolve: (match: RegExpExecArray, ctx: Ctx) => T | null };
type Hit<T> = QuickAddRange & { value: T };

function nextWeekday(from: string, weekday: number, exclusive: boolean): string | null {
    let delta = (weekday - taskWeekday(from) + 7) % 7;
    if (exclusive && delta === 0) delta = 7;
    return shiftTaskDate(from, delta);
}

function addMonths(date: string, months: number): string | null {
    const [year, month, day] = date.split("-").map(Number);
    const target = year * 12 + (month - 1) + months;
    const targetYear = Math.floor(target / 12);
    const targetMonth = target % 12;
    const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    const value = `${String(targetYear).padStart(4, "0")}-${String(targetMonth + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
    return isTaskDate(value) ? value : null;
}

/** A day and month without a year means the next time that date comes round. */
function calendarDate(day: number, month: number, year: number | null, today: string) {
    const build = (y: number) =>
        `${String(y).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (year !== null) {
        const value = build(year);
        return isTaskDate(value) ? value : null;
    }
    const thisYear = Number(today.slice(0, 4));
    const value = build(thisYear);
    if (!isTaskDate(value)) return null;
    if (value >= today) return value;
    const next = build(thisYear + 1);
    return isTaskDate(next) ? next : null;
}

const fourDigitYear = (value: string | undefined) =>
    value === undefined ? null : value.length === 2 ? 2000 + Number(value) : Number(value);

const DATE_MATCHERS: Matcher<string>[] = [
    {
        pattern: pattern(
            `${L}${ON}(day\\s+after\\s+tomorrow|dayaftertomorrow|today|tomm?orr?ow|tmrw|tmr)${R}`,
        ),
        resolve: ([, word], { today }) => {
            const normalized = word.toLowerCase();
            if (normalized === "today") return today;
            if (normalized.startsWith("day")) return shiftTaskDate(today, 2);
            return shiftTaskDate(today, 1);
        },
    },
    {
        pattern: pattern(`${L}(?:(on|by|due|before)\\s+)?(?:(next|this|coming)\\s+)?(${DAY})${R}`),
        resolve: ([, preposition, relative, name], { today }) => {
            const normalized = name.toLowerCase();
            // "sun", "sat" and "wed" are ordinary words too; only read them as days after a cue.
            if (DAY_SHORT.split("|").includes(normalized) && !preposition && !relative) return null;
            return nextWeekday(today, DAY_INDEX[normalized], relative?.toLowerCase() === "next");
        },
    },
    {
        pattern: pattern(`${L}${ON}(next|this)\\s+(week|month|weekend)${R}`),
        resolve: ([, relative, unit], { today }) => {
            const next = relative.toLowerCase() === "next";
            const span = unit.toLowerCase();
            if (span === "week") return next ? nextWeekday(today, 1, true) : today;
            if (span === "month") return next ? addMonths(`${today.slice(0, 8)}01`, 1) : today;
            const saturday = nextWeekday(today, 6, false);
            const weekday = taskWeekday(today);
            if (!next) return weekday === 0 ? today : saturday;
            return weekday === 0 ? shiftTaskDate(today, 6) : saturday && shiftTaskDate(saturday, 7);
        },
    },
    {
        pattern: pattern(
            `${L}${ON}(?:in|after)\\s+(\\d{1,3}|a|an|one|two|three|four|five|six|seven)\\s+(days?|weeks?|months?)${R}`,
        ),
        resolve: ([, amount, unit], { today }) => {
            const count = /^\d+$/.test(amount)
                ? Number(amount)
                : WORD_NUMBERS[amount.toLowerCase()];
            if (!count) return null;
            const kind = unit.toLowerCase();
            if (kind.startsWith("day")) return shiftTaskDate(today, count);
            if (kind.startsWith("week")) return shiftTaskDate(today, count * 7);
            return addMonths(today, count);
        },
    },
    {
        // dd/mm/yyyy always; dd/mm only after a cue so "2/3 BHK" stays plain text.
        pattern: pattern(
            `${L}(?:(on|by|due|before)\\s+)?(\\d{1,2})[/-](\\d{1,2})(?:[/-](\\d{4}|\\d{2}))?(?![\\p{L}\\p{N}/-])`,
        ),
        resolve: ([, preposition, day, month, year], { today }) => {
            if (!year && !preposition) return null;
            return calendarDate(Number(day), Number(month) - 1, fourDigitYear(year), today);
        },
    },
    {
        pattern: pattern(
            `${L}${ON}(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH})(?:,?\\s+(\\d{4}))?${R}`,
        ),
        resolve: ([, day, month, year], { today }) =>
            calendarDate(Number(day), MONTH_INDEX[month.toLowerCase()], fourDigitYear(year), today),
    },
    {
        pattern: pattern(
            `${L}${ON}(${MONTH})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?${R}`,
        ),
        resolve: ([, month, day, year], { today }) =>
            calendarDate(Number(day), MONTH_INDEX[month.toLowerCase()], fourDigitYear(year), today),
    },
];

const clock = (hour: number, minutes: number) => {
    const value = `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    return isTaskTime(value) ? value : null;
};
/** A bare 1–7 o'clock is an afternoon meeting in practice; 8–11 is the morning. */
const workingHour = (hour: number, padded: boolean) =>
    !padded && hour >= 1 && hour <= 7 ? hour + 12 : hour;

const TIME_MATCHERS: Matcher<string>[] = [
    {
        pattern: pattern(
            `${L}(?:(?:at|by)\\s+)?(\\d{1,2})(?:[:.](\\d{2}))?\\s*([ap])\\.?m\\.?(?![\\p{L}\\p{N}])`,
        ),
        resolve: ([, hourText, minuteText, meridiem]) => {
            const hour = Number(hourText);
            if (hour < 1 || hour > 12) return null;
            const base = hour % 12;
            return clock(
                meridiem.toLowerCase() === "p" ? base + 12 : base,
                Number(minuteText ?? 0),
            );
        },
    },
    {
        pattern: pattern(`${L}(?:(?:at|by)\\s+)?(\\d{1,2}):(\\d{2})${R}`),
        resolve: ([, hourText, minuteText]) =>
            clock(workingHour(Number(hourText), hourText.length === 2), Number(minuteText)),
    },
    {
        pattern: pattern(
            `${L}at\\s+(\\d{1,2})(?![\\p{L}\\p{N}:./-])(?!\\s*(?:bhk|rk|cr|crore|lakhs?|lacs?|%|sq))`,
        ),
        resolve: ([, hourText]) => clock(workingHour(Number(hourText), false), 0),
    },
    { pattern: pattern(`${L}(?:at\\s+)?noon${R}`), resolve: () => "12:00" },
];

const weekRule = (weekdays: number[], interval = 1): TaskRepeat => ({
    unit: "week",
    interval,
    weekdays: [...new Set(weekdays)].sort((a, b) => a - b),
    until: null,
});
const unitRule = (unit: string, interval: number): TaskRepeat | null => {
    const normalized = unit.toLowerCase().replace(/s$/, "");
    const map: Record<string, TaskRepeat["unit"]> = {
        day: "day",
        week: "week",
        month: "month",
        year: "year",
    };
    const resolved = map[normalized];
    return resolved ? { unit: resolved, interval, weekdays: [], until: null } : null;
};

const REPEAT_MATCHERS: Matcher<TaskRepeat>[] = [
    {
        pattern: pattern(`${L}every\\s+((?:${DAY})(?:${DAY_LIST_SEPARATOR}(?:${DAY}))*)${R}`),
        resolve: ([, list]) =>
            weekRule(
                list
                    .toLowerCase()
                    .split(/[^a-z]+/)
                    .filter((word) => word in DAY_INDEX)
                    .map((word) => DAY_INDEX[word]),
            ),
    },
    {
        pattern: pattern(`${L}every\\s+(?:weekday|working\\s+day|work\\s*day)s?${R}`),
        resolve: () => weekRule([1, 2, 3, 4, 5]),
    },
    { pattern: pattern(`${L}every\\s+weekends?${R}`), resolve: () => weekRule([0, 6]) },
    {
        pattern: pattern(`${L}every\\s+other\\s+(day|week|month|year)${R}`),
        resolve: ([, unit]) => unitRule(unit, 2),
    },
    {
        pattern: pattern(`${L}every\\s+(\\d{1,3})\\s+(days?|weeks?|months?|years?)${R}`),
        resolve: ([, count, unit]) => unitRule(unit, Number(count)),
    },
    {
        pattern: pattern(
            `${L}(?:every\\s*(day|week|month|year)|(daily|weekly|monthly|yearly|annually))${R}`,
        ),
        resolve: ([, unit, adverb]) =>
            unitRule(
                unit ??
                    {
                        daily: "day",
                        weekly: "week",
                        monthly: "month",
                        yearly: "year",
                        annually: "year",
                    }[adverb.toLowerCase()] ??
                    "",
                1,
            ),
    },
];

const PRIORITY_MATCHERS: Matcher<TaskPriority>[] = [
    { pattern: pattern(`${L}p([1-4])${R}`), resolve: ([, digit]) => PRIORITY_BY_DIGIT[digit] },
];

const REMINDER_MATCHERS: Matcher<number>[] = [
    {
        pattern: pattern(
            `(?<![\\p{L}\\p{N}!])!\\s?(\\d{1,4})\\s*(minutes?|mins?|m|hours?|hrs?|h|days?|d)(?:\\s+before)?${R}`,
        ),
        resolve: ([, amount, unit]) => {
            const kind = unit.toLowerCase();
            const size = kind.startsWith("d") ? 1440 : kind.startsWith("h") ? 60 : 1;
            const minutes = Number(amount) * size;
            return minutes <= MAX_REMINDER_MINUTES ? minutes : null;
        },
    },
    {
        pattern: pattern(`(?<![\\p{L}\\p{N}!])!\\s?(?:at|on)\\s+time${R}`),
        resolve: () => 0,
    },
];

function scan<T>(masked: string, matchers: Matcher<T>[], ctx: Ctx): Hit<T>[] {
    const hits: Hit<T>[] = [];
    for (const matcher of matchers) {
        matcher.pattern.lastIndex = 0;
        for (const match of masked.matchAll(matcher.pattern)) {
            const value = matcher.resolve(match, ctx);
            if (value === null || value === undefined) continue;
            const start = match.index;
            hits.push({ start, end: start + match[0].length, value });
        }
    }
    hits.sort((a, b) => a.start - b.start || b.end - a.end);
    const kept: Hit<T>[] = [];
    for (const hit of hits) {
        if (kept.length && hit.start < kept[kept.length - 1].end) continue;
        kept.push(hit);
    }
    return kept;
}

/** Blank out ranges in UTF-16 units, the same offsets the textarea reports. */
function mask(text: string, ranges: readonly QuickAddRange[]): string {
    if (!ranges.length) return text;
    const units = text.split("");
    for (const range of ranges) {
        for (
            let index = Math.max(0, range.start);
            index < Math.min(units.length, range.end);
            index++
        )
            units[index] = "\u0000";
    }
    return units.join("");
}

/**
 * `"tomorrow"` / `"due 20m"` stays plain words — quotes mask the span from
 * shortcut parsing (same idea as dismissing a chip).
 */
export function quotedQuickAddRanges(text: string): QuickAddRange[] {
    const ranges: QuickAddRange[] = [];
    for (let index = 0; index < text.length; index++) {
        if (text[index] !== '"') continue;
        const end = text.indexOf('"', index + 1);
        if (end < 0) break;
        ranges.push({ start: index, end: end + 1 });
        index = end;
    }
    return ranges;
}

/** Drop quote marks used to keep shortcut words literal. */
export function stripQuickAddQuotes(text: string): string {
    return text
        .replace(/"/g, "")
        .replace(/\s+/g, " ")
        .replace(/\s+([,.;:!?])/g, "$1")
        .trim();
}

const isTrigger = (char: string | undefined) => char === "#" || char === "@";
const isSpace = (char: string | undefined) => char !== undefined && /\s/.test(char);

/** The # or @ the caret is typing after, if it can still become a picked record. */
export function findQuickAddMention(
    text: string,
    caret: number,
    entities: readonly QuickAddEntity[] = [],
    closedMention: number | null = null,
): QuickAddMention | null {
    const limit = Math.max(0, caret - 41);
    for (let index = caret - 1; index >= limit; index--) {
        const char = text[index];
        if (char === "\n" || entities.some((entity) => index >= entity.start && index < entity.end))
            return null;
        if (!isTrigger(char)) continue;
        if (index > 0 && !isSpace(text[index - 1])) return null;
        const query = text.slice(index + 1, caret);
        if (isSpace(query[0]) || /\s{2}/.test(query) || index === closedMention) return null;
        return {
            kind: char === "#" ? "property" : "contact",
            start: index,
            end: caret,
            query,
        };
    }
    return null;
}

function cleanTitle(text: string, removed: readonly QuickAddRange[]): string {
    const sorted = [...removed].sort((a, b) => a.start - b.start);
    let title = "";
    let cursor = 0;
    for (const range of sorted) {
        if (range.start > cursor) title += text.slice(cursor, range.start);
        title += " ";
        cursor = Math.max(cursor, range.end);
    }
    title += text.slice(cursor);
    return title
        .replace(/(^|\s)[#@](?=\s|$)/g, "$1")
        .replace(/\s+/g, " ")
        .replace(/\s+([,.;:!?])/g, "$1")
        .replace(/([,;:])(?:\s*[,;:])+/g, "$1")
        .replace(/^[\s,;:·–—-]+|[\s,;:·–—-]+$/g, "")
        .trim();
}

function highlightKind(kind: QuickAddAtomKind): QuickAddHighlightKind {
    if (kind === "priority" || kind === "reminder") return kind;
    if (kind === "due" || kind === "due-date" || kind === "due-time") return "due";
    return "schedule";
}

/** Merge picked date / time / repeat phrases separated only by spaces into one highlight. */
function groupHighlights(
    text: string,
    atoms: readonly QuickAddAtom[],
    entities: readonly QuickAddEntity[],
): QuickAddHighlight[] {
    const visual: QuickAddHighlight[] = [
        ...atoms.map((atom) => ({
            start: atom.start,
            end: atom.end,
            kind: highlightKind(atom.kind),
        })),
        ...entities.map((entity) => ({ start: entity.start, end: entity.end, kind: entity.kind })),
    ].sort((a, b) => a.start - b.start);
    const merged: QuickAddHighlight[] = [];
    for (const item of visual) {
        const previous = merged[merged.length - 1];
        if (
            previous &&
            previous.kind === item.kind &&
            (item.kind === "schedule" || item.kind === "due") &&
            !text.slice(previous.end, item.start).trim()
        ) {
            previous.end = item.end;
            continue;
        }
        merged.push({ ...item });
    }
    return merged;
}

/** First standalone `due` — everything after it is the optional end schedule. */
function findDueMarker(masked: string): QuickAddRange | null {
    const matcher = pattern(`${L}due${R}`);
    matcher.lastIndex = 0;
    const match = matcher.exec(masked);
    if (!match) return null;
    return { start: match.index, end: match.index + match[0].length };
}

function resolveScheduleDate(
    date: string | null,
    time: string | null,
    now: number,
    baseDate: string | null,
    today: string,
): string | null {
    if (date) return date;
    if (!time) return null;
    const currentTime = inputValueInIst(new Date(now)).slice(11, 16);
    return baseDate ?? (time > currentTime ? today : shiftTaskDate(today, 1));
}

function firstWeekdayFrom(from: string, weekdays: number[]): string {
    for (let offset = 0; offset < 7; offset++) {
        const day = shiftTaskDate(from, offset);
        if (day && weekdays.includes(taskWeekday(day))) return day;
    }
    return from;
}

export function parseQuickAdd(text: string, options: QuickAddParseOptions): QuickAddParse {
    const { now, baseDate = null, mention = null } = options;
    const entities = [...(options.entities ?? [])].sort((a, b) => a.start - b.start);
    const dismissed = options.dismissed ?? [];
    const quoted = quotedQuickAddRanges(text);
    const today = taskDateKey(now);
    const ctx: Ctx = { now, today };

    let masked = mask(text, [...entities, ...dismissed, ...quoted, ...(mention ? [mention] : [])]);
    const dueMarker = findDueMarker(masked);
    const take = <T>(matchers: Matcher<T>[]) => {
        const hits = scan(masked, matchers, ctx);
        masked = mask(masked, hits);
        return hits;
    };
    const repeats = take(REPEAT_MATCHERS);
    const priorities = take(PRIORITY_MATCHERS);
    const reminders = take(REMINDER_MATCHERS);

    // Plain dates/times are start; after an explicit `due` they become the end schedule.
    let startDates: Hit<string>[] = [];
    let startTimes: Hit<string>[] = [];
    let dueDates: Hit<string>[] = [];
    let dueTimes: Hit<string>[] = [];
    if (dueMarker) {
        const startMasked = mask(masked, [{ start: dueMarker.start, end: text.length }]);
        startDates = scan(startMasked, DATE_MATCHERS, ctx);
        startTimes = scan(mask(startMasked, startDates), TIME_MATCHERS, ctx);
        const dueMasked = mask(masked, [
            { start: 0, end: dueMarker.end },
            ...startDates,
            ...startTimes,
        ]);
        dueDates = scan(dueMasked, DATE_MATCHERS, ctx);
        dueTimes = scan(mask(dueMasked, dueDates), TIME_MATCHERS, ctx);
        masked = mask(masked, [dueMarker, ...startDates, ...startTimes, ...dueDates, ...dueTimes]);
    } else {
        startDates = take(DATE_MATCHERS);
        startTimes = take(TIME_MATCHERS);
    }

    const atoms: QuickAddAtom[] = [];
    const pick = <T>(hits: Hit<T>[], kind: QuickAddAtomKind) => {
        const hit = hits[0];
        if (hit) atoms.push({ start: hit.start, end: hit.end, kind });
        return hit?.value ?? null;
    };
    let repeat = pick(repeats, "repeat");
    let startDate = pick(startDates, "date");
    const startTime = pick(startTimes, "time");
    let dueDate = pick(dueDates, "due-date");
    const dueTime = pick(dueTimes, "due-time");
    if (dueMarker) atoms.push({ start: dueMarker.start, end: dueMarker.end, kind: "due" });
    const priority = pick(priorities, "priority");
    const reminderValues: number[] = [];
    for (const hit of reminders) {
        atoms.push({ start: hit.start, end: hit.end, kind: "reminder", minutes: hit.value });
        if (!reminderValues.includes(hit.value)) reminderValues.push(hit.value);
    }
    atoms.sort((a, b) => a.start - b.start);

    const from = baseDate ?? today;
    if (repeat) {
        const anchor = startDate ?? from;
        if (repeat.unit === "week" && repeat.weekdays.length === 0)
            repeat = { ...repeat, weekdays: [taskWeekday(anchor)] };
        if (!startDate)
            startDate = repeat.unit === "week" ? firstWeekdayFrom(from, repeat.weekdays) : from;
        if (!taskRepeatSchema.safeParse(repeat).success) repeat = null;
    }
    startDate = resolveScheduleDate(startDate, startTime, now, baseDate, today);
    dueDate = resolveScheduleDate(dueDate, dueTime, now, startDate ?? baseDate, today);

    const firstEntity = (kind: QuickAddEntityKind) =>
        entities.find((entity) => entity.kind === kind)?.refId ?? null;
    return {
        atoms,
        highlights: groupHighlights(text, atoms, entities),
        title: cleanTitle(text, [...atoms, ...entities]),
        startDate,
        startTime,
        dueDate,
        dueTime,
        date: startDate,
        time: startTime,
        repeat,
        priority,
        reminders: reminderValues.sort((a, b) => b - a),
        propertyId: firstEntity("property"),
        clientId: firstEntity("client"),
        ownerId: firstEntity("owner"),
    };
}

/** True when `#Label` / `@Name` sits on its own, not mid-word. */
function isEntityTokenBoundary(text: string, start: number, end: number) {
    const beforeOk = start === 0 || /\s/.test(text[start - 1] ?? "");
    const afterOk = end >= text.length || /[\s,.;:!?)\]}]/.test(text[end] ?? "");
    return beforeOk && afterOk;
}

/**
 * Rebuild property / Client / owner chips from `#` / `@` labels in the text.
 * Used after paste so copied chips become real linked tokens again.
 */
export function entitiesFromCatalogText(
    text: string,
    catalogs: QuickAddCatalogs,
): QuickAddEntity[] {
    const candidates = [
        ...catalogs.properties.map((property) => ({
            kind: "property" as const,
            refId: property.id,
            label: property.title,
            token: `#${property.title}`,
        })),
        ...catalogs.clients.map((client) => ({
            kind: "client" as const,
            refId: client.id,
            label: client.name,
            token: `@${client.name}`,
        })),
        ...catalogs.owners.map((owner) => ({
            kind: "owner" as const,
            refId: owner.id,
            label: owner.name,
            token: `@${owner.name}`,
        })),
    ].sort((a, b) => b.token.length - a.token.length || a.token.localeCompare(b.token));

    const matches: QuickAddEntity[] = [];
    for (const candidate of candidates) {
        let from = 0;
        while (from < text.length) {
            const start = text.indexOf(candidate.token, from);
            if (start < 0) break;
            const end = start + candidate.token.length;
            if (isEntityTokenBoundary(text, start, end)) {
                matches.push({
                    kind: candidate.kind,
                    refId: candidate.refId,
                    label: candidate.label,
                    start,
                    end,
                });
            }
            from = start + 1;
        }
    }

    matches.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
    const usedKinds = new Set<QuickAddEntityKind>();
    const taken: QuickAddRange[] = [];
    const entities: QuickAddEntity[] = [];
    for (const match of matches) {
        if (usedKinds.has(match.kind)) continue;
        if (taken.some((range) => match.start < range.end && match.end > range.start)) continue;
        usedKinds.add(match.kind);
        taken.push(match);
        entities.push(match);
    }
    return entities;
}

/**
 * Find `#Property` / `@Person` tokens already in a saved title so edit and the
 * task row can highlight them in the same place the user typed them.
 */
export function entitiesFromTaskTitle(
    text: string,
    links: {
        propertyId: string | null;
        clientId: string | null;
        ownerId: string | null | undefined;
    },
    catalogs: QuickAddCatalogs,
): QuickAddEntity[] {
    const entities: QuickAddEntity[] = [];
    const take = (
        kind: QuickAddEntityKind,
        refId: string | null | undefined,
        label: string | undefined,
    ) => {
        if (!refId || !label) return;
        const token = `${kind === "property" ? "#" : "@"}${label}`;
        let from = 0;
        while (from < text.length) {
            const start = text.indexOf(token, from);
            if (start < 0) return;
            const end = start + token.length;
            const overlaps = entities.some((entity) => start < entity.end && end > entity.start);
            if (!overlaps) {
                entities.push({ kind, refId, label, start, end });
                return;
            }
            from = start + 1;
        }
    };
    take(
        "property",
        links.propertyId,
        catalogs.properties.find((item) => item.id === links.propertyId)?.title,
    );
    take(
        "client",
        links.clientId,
        catalogs.clients.find((item) => item.id === links.clientId)?.name,
    );
    take("owner", links.ownerId, catalogs.owners.find((item) => item.id === links.ownerId)?.name);
    return entities.sort((a, b) => a.start - b.start);
}

/** Highlights for a saved task title — used when editing still needs chip ranges. */
export function highlightsForTaskTitle(
    text: string,
    links: {
        propertyId: string | null;
        clientId: string | null;
        ownerId: string | null | undefined;
    },
    catalogs: QuickAddCatalogs,
    now: number,
    baseDate: string | null,
): QuickAddHighlight[] {
    const entities = entitiesFromTaskTitle(text, links, catalogs);
    return parseQuickAdd(text, { now, baseDate, entities }).highlights;
}

/**
 * Saved-row title: plain sentence. Drops date / priority / reminder / repeat words
 * (the day column and row colour already say those), strips # / @ from links, keeps
 * times in place. The composer still shows the full chipped text when editing.
 */
export function taskRowTitle(
    text: string,
    links: {
        propertyId: string | null;
        clientId: string | null;
        ownerId: string | null | undefined;
    },
    catalogs: QuickAddCatalogs,
    now: number,
    baseDate: string | null,
): string {
    const entities = entitiesFromTaskTitle(text, links, catalogs);
    const parse = parseQuickAdd(text, { now, baseDate, entities });
    const edits: { start: number; end: number; insert: string }[] = [
        ...parse.atoms
            .filter((atom) => atom.kind !== "time")
            .map((atom) => ({ start: atom.start, end: atom.end, insert: "" })),
        ...entities.map((entity) => ({
            start: entity.start,
            end: entity.end,
            insert: entity.label,
        })),
    ].sort((a, b) => b.start - a.start);

    let next = text;
    for (const edit of edits) {
        next = next.slice(0, edit.start) + edit.insert + next.slice(edit.end);
    }
    return stripQuickAddQuotes(
        next
            .replace(/\s+/g, " ")
            .replace(/\s+([,.;:!?])/g, "$1")
            .replace(/^[\s,;:·–—-]+|[\s,;:·–—-]+$/g, "")
            .trim(),
    );
}

const OPTION_LIMIT = 8;

export function quickAddPropertyOptions(
    catalogs: QuickAddCatalogs,
    query: string,
): QuickAddOption[] {
    const needle = query.trim().toLowerCase();
    return catalogs.properties
        .filter(
            (property) =>
                !needle ||
                `${property.title} ${property.locality} ${property.city} ${property.address ?? ""} ${property.configLabel ?? ""}`
                    .toLowerCase()
                    .includes(needle),
        )
        .slice(0, OPTION_LIMIT)
        .map((property) => ({
            id: property.id,
            kind: "property" as const,
            label: property.title,
            detail: [property.configLabel, property.locality, property.city]
                .filter(Boolean)
                .join(" · "),
        }));
}

export function quickAddContactOptions(
    catalogs: QuickAddCatalogs,
    query: string,
): QuickAddOption[] {
    const needle = query.trim().toLowerCase();
    return [
        ...catalogs.clients.map((client) => ({
            id: client.id,
            kind: "client" as const,
            label: client.name,
            detail: "Client",
        })),
        ...catalogs.owners.map((owner) => ({
            id: owner.id,
            kind: "owner" as const,
            label: owner.name,
            detail: "Owner",
        })),
    ]
        .filter((contact) => !needle || contact.label.toLowerCase().includes(needle))
        .slice(0, OPTION_LIMIT);
}
