import { formatInTimeZone } from "date-fns-tz";

import {
    isTaskDate,
    isTaskTime,
    TASK_TIME_ZONE,
    type TaskPriority,
    taskDateKey,
    taskTimeLabel,
} from "./model";
import { shiftTaskDate, taskWeekday } from "./recurrence";

export type SmartMentionKind = "property" | "contact";

export type SmartHighlight = {
    start: number;
    end: number;
    kind: "date" | "time" | "priority" | "property" | "contact";
};

export type SmartMention = {
    kind: SmartMentionKind;
    start: number;
    query: string;
};

export type SmartAddParse = {
    title: string;
    dueDate: string | null;
    hasDueDate: boolean;
    dueTime: string | null;
    priority: TaskPriority | null;
    highlights: SmartHighlight[];
    mention: SmartMention | null;
};

export type SmartAddCatalogs = {
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

export type SmartContactOption = {
    id: string;
    name: string;
    kind: "client" | "owner";
    label: string;
};

export type SmartPropertyOption = {
    id: string;
    title: string;
    detail: string;
};

const PRIORITY_BY_TOKEN: Record<string, TaskPriority> = {
    p1: "urgent",
    p2: "high",
    p3: "medium",
    p4: "low",
};

const WEEKDAY_NAMES = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
] as const;

/** Match whole-word smart tokens; # / @ mentions are handled separately. */
const DATE_SOURCE = String.raw`\b(?:day\s*after\s*tomorrow|dayaftertomorrow|tomorrow|today|next\s+week|next\s+(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|\d{1,2}\/\d{1,2}\/\d{4})\b`;
/** 1am, 9am, 12:00pm, 10:12pm (optional space before am/pm). */
const TIME_SOURCE = String.raw`\b(?:1[0-2]|0?[1-9])(?::[0-5]\d)?\s*(?:am|pm)\b`;
const PRIORITY_SOURCE = String.raw`\bp[1-4]\b`;
const MENTION_PATTERN = /(^|\s)([#@])(\S*)$/;
const datePattern = () => new RegExp(DATE_SOURCE, "gi");
const timePattern = () => new RegExp(TIME_SOURCE, "gi");
const priorityPattern = () => new RegExp(PRIORITY_SOURCE, "gi");

/** Parse 12h clock tokens into task dueTime (`HH:mm`, 24h). */
export function resolveTimeToken(token: string): string | null {
    const match = /^(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)$/i.exec(token.trim());
    if (!match) return null;
    let hour = Number(match[1]);
    const minutes = match[2] ?? "00";
    const meridiem = match[3].toLowerCase();
    if (meridiem === "am") {
        if (hour === 12) hour = 0;
    } else if (hour !== 12) {
        hour += 12;
    }
    const value = `${String(hour).padStart(2, "0")}:${minutes}`;
    return isTaskTime(value) ? value : null;
}

export function smartTimeChipLabel(time: string): string {
    return taskTimeLabel(time);
}

function pushHighlight(
    highlights: SmartHighlight[],
    start: number,
    end: number,
    kind: SmartHighlight["kind"],
) {
    if (start < end) highlights.push({ start, end, kind });
}

function parseExplicitDate(token: string): string | null {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(token);
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const value = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return isTaskDate(value) ? value : null;
}

function nextWeekday(today: string, weekday: number, exclusive: boolean): string {
    const current = taskWeekday(today);
    let delta = (weekday - current + 7) % 7;
    if (exclusive && delta === 0) delta = 7;
    return shiftTaskDate(today, delta)!;
}

function resolveDateToken(token: string, now: number): string | null {
    const today = taskDateKey(now);
    const normalized = token.toLowerCase().replace(/\s+/g, " ").trim();
    if (normalized === "today") return today;
    if (normalized === "tomorrow") return shiftTaskDate(today, 1);
    if (normalized === "day after tomorrow" || normalized === "dayaftertomorrow")
        return shiftTaskDate(today, 2);
    if (normalized === "next week") return shiftTaskDate(today, 7);
    const nextDay = /^next (sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/.exec(
        normalized,
    );
    if (nextDay)
        return nextWeekday(
            today,
            WEEKDAY_NAMES.indexOf(nextDay[1] as (typeof WEEKDAY_NAMES)[number]),
            true,
        );
    const weekday = WEEKDAY_NAMES.indexOf(normalized as (typeof WEEKDAY_NAMES)[number]);
    if (weekday >= 0) return nextWeekday(today, weekday, false);
    return parseExplicitDate(normalized);
}

/** Live parse of free-text smart tokens and an open # / @ mention at the end. */
export function parseSmartAdd(input: string, now = Date.now()): SmartAddParse {
    const mentionMatch = MENTION_PATTERN.exec(input);
    const mention: SmartMention | null = mentionMatch
        ? {
              kind: mentionMatch[2] === "#" ? "property" : "contact",
              start: mentionMatch.index + mentionMatch[1].length,
              query: mentionMatch[3],
          }
        : null;
    const searchable = mention ? input.slice(0, mention.start) : input;
    const highlights: SmartHighlight[] = [];
    let dueDate: string | null = null;
    let hasDueDate = false;
    let dueTime: string | null = null;
    let priority: TaskPriority | null = null;

    for (const match of searchable.matchAll(datePattern())) {
        const token = match[0];
        const start = match.index ?? 0;
        const resolved = resolveDateToken(token, now);
        if (!resolved) continue;
        dueDate = resolved;
        hasDueDate = true;
        pushHighlight(highlights, start, start + token.length, "date");
    }
    for (const match of searchable.matchAll(timePattern())) {
        const token = match[0];
        const start = match.index ?? 0;
        const resolved = resolveTimeToken(token);
        if (!resolved) continue;
        dueTime = resolved;
        pushHighlight(highlights, start, start + token.length, "time");
    }
    for (const match of searchable.matchAll(priorityPattern())) {
        const token = match[0];
        const start = match.index ?? 0;
        priority = PRIORITY_BY_TOKEN[token.toLowerCase()] ?? priority;
        pushHighlight(highlights, start, start + token.length, "priority");
    }
    if (mention) {
        pushHighlight(highlights, mention.start, input.length, mention.kind);
    }

    const title = stripSmartTokens(input, mention);
    return { title, dueDate, hasDueDate, dueTime, priority, highlights, mention };
}

/** Remove recognized date / time / priority / open-mention tokens for the saved task title. */
export function stripSmartTokens(input: string, mention: SmartMention | null = null): string {
    const withoutMention = mention ? input.slice(0, mention.start) : input;
    return withoutMention
        .replace(datePattern(), " ")
        .replace(timePattern(), " ")
        .replace(priorityPattern(), " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function removeSmartRange(input: string, start: number, end: number): string {
    return `${input.slice(0, start)}${input.slice(end)}`.replace(/\s+/g, " ").trimStart();
}

export function clearSmartKind(input: string, kind: "date" | "time" | "priority"): string {
    const pattern =
        kind === "date" ? datePattern() : kind === "time" ? timePattern() : priorityPattern();
    return input.replace(pattern, " ").replace(/\s+/g, " ").trim();
}

export function filterSmartProperties(
    catalogs: SmartAddCatalogs,
    query: string,
): SmartPropertyOption[] {
    const needle = query.trim().toLowerCase();
    return catalogs.properties
        .map((property) => ({
            id: property.id,
            title: property.title,
            detail: [property.configLabel, property.locality, property.city]
                .filter(Boolean)
                .join(" · "),
            haystack:
                `${property.title} ${property.locality} ${property.city} ${property.address ?? ""} ${property.configLabel ?? ""}`.toLowerCase(),
        }))
        .filter((property) => !needle || property.haystack.includes(needle))
        .map(({ id, title, detail }) => ({ id, title, detail }));
}

export function filterSmartContacts(
    catalogs: SmartAddCatalogs,
    query: string,
): SmartContactOption[] {
    const needle = query.trim().toLowerCase();
    const clients = catalogs.clients.map((client) => ({
        id: client.id,
        name: client.name,
        kind: "client" as const,
        label: "Client",
    }));
    const owners = catalogs.owners.map((owner) => ({
        id: owner.id,
        name: owner.name,
        kind: "owner" as const,
        label: "Owner",
    }));
    return [...clients, ...owners].filter(
        (contact) => !needle || contact.name.toLowerCase().includes(needle),
    );
}

export function smartDateChipLabel(date: string, now = Date.now()): string {
    const today = taskDateKey(now);
    if (date === today) return "Today";
    if (date === shiftTaskDate(today, 1)) return "Tomorrow";
    if (date === shiftTaskDate(today, 2)) return "Day after tomorrow";
    if (date === shiftTaskDate(today, 7)) return "Next week";
    return formatInTimeZone(`${date}T12:00:00+05:30`, TASK_TIME_ZONE, "d MMM yyyy");
}

export const SMART_PRIORITY_CHIP: Record<TaskPriority, string> = {
    urgent: "P1",
    high: "P2",
    medium: "P3",
    low: "P4",
};

export type SmartInlinePart =
    | { type: "text"; value: string }
    | { type: "date"; value: string; label: string }
    | { type: "time"; value: string; label: string }
    | { type: "priority"; value: TaskPriority; label: string };

/** Split plain text into inline runs, turning completed date/time/priority tokens into chip parts. */
export function splitSmartInlineParts(
    input: string,
    now = Date.now(),
): {
    parts: SmartInlinePart[];
    mention: SmartMention | null;
} {
    const mentionMatch = MENTION_PATTERN.exec(input);
    const mention: SmartMention | null = mentionMatch
        ? {
              kind: mentionMatch[2] === "#" ? "property" : "contact",
              start: mentionMatch.index + mentionMatch[1].length,
              query: mentionMatch[3],
          }
        : null;
    const searchable = mention ? input.slice(0, mention.start) : input;
    const rest = mention ? input.slice(mention.start) : "";
    const hits: { start: number; end: number; part: SmartInlinePart }[] = [];
    for (const match of searchable.matchAll(datePattern())) {
        const token = match[0];
        const start = match.index ?? 0;
        const value = resolveDateToken(token, now);
        if (!value) continue;
        hits.push({
            start,
            end: start + token.length,
            part: { type: "date", value, label: smartDateChipLabel(value, now) },
        });
    }
    for (const match of searchable.matchAll(timePattern())) {
        const token = match[0];
        const start = match.index ?? 0;
        const value = resolveTimeToken(token);
        if (!value) continue;
        hits.push({
            start,
            end: start + token.length,
            part: { type: "time", value, label: smartTimeChipLabel(value) },
        });
    }
    for (const match of searchable.matchAll(priorityPattern())) {
        const token = match[0];
        const start = match.index ?? 0;
        const value = PRIORITY_BY_TOKEN[token.toLowerCase()];
        if (!value) continue;
        hits.push({
            start,
            end: start + token.length,
            part: { type: "priority", value, label: SMART_PRIORITY_CHIP[value] },
        });
    }
    hits.sort((a, b) => a.start - b.start || b.end - a.end);
    const parts: SmartInlinePart[] = [];
    let cursor = 0;
    for (const hit of hits) {
        if (hit.start < cursor) continue;
        if (hit.start > cursor)
            parts.push({ type: "text", value: searchable.slice(cursor, hit.start) });
        parts.push(hit.part);
        cursor = hit.end;
    }
    if (cursor < searchable.length) parts.push({ type: "text", value: searchable.slice(cursor) });
    if (rest) parts.push({ type: "text", value: rest });
    if (parts.length === 0) parts.push({ type: "text", value: "" });
    return { parts, mention };
}

export function parseTrailingMention(input: string): SmartMention | null {
    const mentionMatch = MENTION_PATTERN.exec(input);
    if (!mentionMatch) return null;
    return {
        kind: mentionMatch[2] === "#" ? "property" : "contact",
        start: mentionMatch.index + mentionMatch[1].length,
        query: mentionMatch[3],
    };
}
