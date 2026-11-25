import { MAX_TASK_REMINDERS } from "@/lib/reminders";

import {
    type Task,
    taskDateKey,
    type TaskDraft,
    taskDueAt,
    type TaskPriority,
    taskReminderAt,
} from "./model";
import {
    entitiesFromCatalogText,
    entitiesFromTaskTitle,
    parseQuickAdd,
    QUICK_ADD_PRIORITY_TOKENS,
    type QuickAddAtom,
    type QuickAddCatalogs,
    type QuickAddEntity,
    type QuickAddEntityKind,
    type QuickAddMention,
    type QuickAddOption,
    type QuickAddParse,
    type QuickAddRange,
    quotedQuickAddRanges,
    stripQuickAddQuotes,
} from "./quick-add-parse";
import { shiftTaskDate, type TaskRepeat, WEEKDAYS } from "./recurrence";

const TITLE_MAX = 160;
const MONTH_SHORT = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
] as const;

/** The column's date, plus details of the task being edited that aren't written out as words. Typed words win. */
export type QuickAddBase = {
    startDate: string | null;
    startTime: string | null;
    dueDate: string | null;
    dueTime: string | null;
    repeat: TaskRepeat | null;
    priority: TaskPriority | null;
    reminders: number[];
    propertyId: string | null;
    clientId: string | null;
    ownerId: string | null;
};

export type QuickAddDraft = {
    text: string;
    entities: QuickAddEntity[];
    dismissed: QuickAddRange[];
    /** Index of the # / @ whose picker was closed with Escape. */
    closedMention: number | null;
    base: QuickAddBase;
    preserved?: { atoms: QuickAddAtom[]; values: QuickAddBase };
};

export type QuickAddEditResult = { draft: QuickAddDraft; caret: number };

export type QuickAddReminderIssueReason = "need-time" | "too-many" | "already-passed" | "duplicate";

export type QuickAddReminderIssue = QuickAddRange & {
    minutes: number;
    reason: QuickAddReminderIssueReason;
};

export type QuickAddValues = {
    title: string;
    startDate: string | null;
    startTime: string | null;
    dueDate: string | null;
    dueTime: string | null;
    /** Alias of startDate — planner column / onAdd still pass this as the day. */
    date: string | null;
    time: string | null;
    repeat: TaskRepeat | null;
    priority: TaskPriority | null;
    /** Reminders that will be saved — need a due time, unique, future, within the limit. */
    reminders: number[];
    propertyId: string | null;
    clientId: string | null;
    ownerId: string | null;
    /** Typed reminder chips that will not save, with why. */
    reminderIssues: QuickAddReminderIssue[];
    /** One short status line for the first reminder problem, if any. */
    reminderError: string;
    /** Start date+time is already in the past — warn; save still creates an overdue task. */
    schedulePassed: boolean;
    /** Highlight ranges for a past start time (merged schedule chips). */
    scheduleIssues: QuickAddRange[];
    /** Status line when the start time has already passed. */
    scheduleError: string;
    /** Due clause problems (missing start, or due before start). */
    dueIssues: QuickAddRange[];
    dueError: string;
};

type TextEdit = { start: number; end: number; inserted: string };

const EMPTY_BASE: QuickAddBase = {
    startDate: null,
    startTime: null,
    dueDate: null,
    dueTime: null,
    repeat: null,
    priority: null,
    reminders: [],
    propertyId: null,
    clientId: null,
    ownerId: null,
};

const LINK_FIELD = {
    property: "propertyId",
    client: "clientId",
    owner: "ownerId",
} as const satisfies Record<QuickAddEntityKind, keyof QuickAddBase>;

export function newQuickAddDraft(date: string | null): QuickAddDraft {
    return {
        text: "",
        entities: [],
        dismissed: [],
        closedMention: null,
        base: { ...EMPTY_BASE, startDate: date },
    };
}

/**
 * Tasks created from the full form often store links without `#` / `@` in the
 * title. Append missing chip tokens so double-click edit shows them in place.
 */
function withLinkedChips(
    title: string,
    links: {
        propertyId: string | null;
        clientId: string | null;
        ownerId: string | null | undefined;
    },
    catalogs: QuickAddCatalogs,
): { text: string; entities: QuickAddEntity[] } {
    let text = title;
    let entities = entitiesFromTaskTitle(text, links, catalogs);
    const append = (
        kind: QuickAddEntityKind,
        refId: string | null | undefined,
        label: string | undefined,
    ) => {
        if (!refId || !label || entities.some((entity) => entity.kind === kind)) return;
        const token = `${kind === "property" ? "#" : "@"}${label}`;
        const spacer = text && !/\s$/.test(text) ? " " : "";
        const start = text.length + spacer.length;
        text = `${text}${spacer}${token}`;
        entities = [...entities, { kind, refId, label, start, end: start + token.length }];
    };
    append(
        "property",
        links.propertyId,
        catalogs.properties.find((item) => item.id === links.propertyId)?.title,
    );
    append(
        "client",
        links.clientId,
        catalogs.clients.find((item) => item.id === links.clientId)?.name,
    );
    append("owner", links.ownerId, catalogs.owners.find((item) => item.id === links.ownerId)?.name);
    return { text, entities };
}

function chipDatePhrase(date: string, now: number): string {
    const today = taskDateKey(now);
    if (date === today) return "today";
    if (date === shiftTaskDate(today, 1)) return "tomorrow";
    if (date === shiftTaskDate(today, 2)) return "day after tomorrow";
    const [year, month, day] = date.split("-").map(Number);
    const monthLabel = MONTH_SHORT[(month ?? 1) - 1] ?? "Jan";
    const dayLabel = String(day ?? 1);
    return year === Number(today.slice(0, 4))
        ? `${dayLabel} ${monthLabel}`
        : `${dayLabel} ${monthLabel} ${year}`;
}

/** Parser-friendly 12-hour time (`12pm`, `12:30pm`). */
function chipTimePhrase(time: string): string {
    const [hourText = "0", minuteText = "00"] = time.split(":");
    let hour = Number(hourText);
    const minutes = Number(minuteText);
    if (!Number.isFinite(hour) || !Number.isFinite(minutes)) return time;
    const meridiem = hour >= 12 ? "pm" : "am";
    hour = hour % 12 || 12;
    return minutes === 0
        ? `${hour}${meridiem}`
        : `${hour}:${String(minutes).padStart(2, "0")}${meridiem}`;
}

function chipRepeatPhrase(repeat: TaskRepeat): string | null {
    if (repeat.unit === "week") {
        if (
            repeat.interval === 1 &&
            repeat.weekdays.length === 5 &&
            [1, 2, 3, 4, 5].every((day) => repeat.weekdays.includes(day))
        ) {
            return "every weekday";
        }
        if (
            repeat.interval === 1 &&
            repeat.weekdays.length === 2 &&
            repeat.weekdays.includes(0) &&
            repeat.weekdays.includes(6)
        ) {
            return "every weekend";
        }
        if (repeat.interval === 1 && repeat.weekdays.length > 0) {
            const names = WEEKDAYS.filter((day) => repeat.weekdays.includes(day.value)).map((day) =>
                day.label.toLowerCase(),
            );
            return names.length ? `every ${names.join(", ")}` : "weekly";
        }
        if (repeat.interval === 2 && repeat.weekdays.length === 0) return "every other week";
        if (repeat.interval === 1) return "weekly";
        return `every ${repeat.interval} weeks`;
    }
    if (repeat.interval === 1) {
        return ({ day: "daily", month: "monthly", year: "yearly" } as const)[repeat.unit];
    }
    if (repeat.interval === 2) return `every other ${repeat.unit}`;
    return `every ${repeat.interval} ${repeat.unit}s`;
}

function chipReminderPhrase(minutes: number): string {
    if (minutes === 0) return "!at time";
    if (minutes % 1440 === 0) return `!${minutes / 1440}d`;
    if (minutes % 60 === 0) return `!${minutes / 60}h`;
    return `!${minutes}m`;
}

function literalDismissedTitle(draft: QuickAddDraft): string {
    const quoted = quotedQuickAddRanges(draft.text);
    let text = draft.text;
    for (const range of [...draft.dismissed].sort((a, b) => b.start - a.start)) {
        if (quoted.some((item) => range.start >= item.start && range.end <= item.end)) continue;
        text =
            text.slice(0, range.start) +
            '"' +
            text.slice(range.start, range.end) +
            '"' +
            text.slice(range.end);
    }
    return text.trim();
}

function joinTitleChips(bare: string, chips: string[]): string {
    let title = bare.trim();
    if (title.length > TITLE_MAX)
        throw new Error(
            "This task name needs extra space to preserve literal date or shortcut words. Shorten it slightly before saving; your text has not been changed.",
        );
    for (const chip of chips) {
        const next = title ? `${title} ${chip}` : chip;
        if (next.length > TITLE_MAX) break;
        title = next;
    }
    return title;
}

/**
 * Wrap shortcut-looking spans in quotes so they stay literal task words
 * (`"tomorrow"`, `"due 20m"`) instead of becoming schedule chips.
 */
function quoteShortcutSpans(
    title: string,
    catalogs: QuickAddCatalogs,
    now: number,
    baseDate: string | null,
): string {
    const entities = entitiesFromCatalogText(title, catalogs);
    const parse = parseQuickAdd(title, { now, baseDate, entities });
    const quoted = quotedQuickAddRanges(title);
    const covered = (start: number, end: number) =>
        quoted.some((range) => start >= range.start && end <= range.end);
    const spans = [
        ...parse.atoms.map((atom) => ({ start: atom.start, end: atom.end })),
        ...entities.map((entity) => ({ start: entity.start, end: entity.end })),
    ]
        .filter((span) => !covered(span.start, span.end))
        .sort((a, b) => b.start - a.start);
    let next = title;
    for (const span of spans) {
        const slice = next.slice(span.start, span.end);
        if (!slice || slice.startsWith('"')) continue;
        next = `${next.slice(0, span.start)}"${slice}"${next.slice(span.end)}`;
    }
    return next;
}

/**
 * Task name only — strips real field chips, keeps literal shortcut words
 * (unwraps quotes) so the Add-task modal shows a clean name.
 */
export function bareTaskDraftTitle(
    title: string,
    links: {
        propertyId: string | null;
        clientId: string | null;
        ownerId: string | null;
    },
    catalogs: QuickAddCatalogs,
    now: number,
    baseDate: string | null = null,
): string {
    const entities = entitiesFromTaskTitle(title, links, catalogs);
    return stripQuickAddQuotes(parseQuickAdd(title, { now, baseDate, entities }).title);
}

/**
 * Encode modal fields as end-of-title chips (same language as quick-add).
 * Shortcut words already in the name are quoted first so "tomorrow" / "10am"
 * stay part of the sentence and are not eaten by the field chips we append.
 */
export function encodeTaskDraftTitle(
    draft: TaskDraft,
    catalogs: QuickAddCatalogs,
    now: number,
): string {
    // Quote shortcut words in the name first so bare-strip cannot eat them, then
    // append field chips after. Edit modal always opens on a bare name.
    const protectedName = quoteShortcutSpans(
        draft.title.trim(),
        catalogs,
        now,
        draft.startDate || null,
    );
    const chips: string[] = [];
    if (draft.startDate) chips.push(chipDatePhrase(draft.startDate, now));
    if (draft.startTime) chips.push(chipTimePhrase(draft.startTime));

    const property = catalogs.properties.find((item) => item.id === draft.propertyId)?.title;
    if (draft.propertyId && property) chips.push(`#${property}`);
    const client = catalogs.clients.find((item) => item.id === draft.clientId)?.name;
    if (draft.clientId && client) chips.push(`@${client}`);
    const owner = catalogs.owners.find((item) => item.id === draft.ownerId)?.name;
    if (draft.ownerId && owner) chips.push(`@${owner}`);

    if (draft.dueDate || draft.dueTime) {
        chips.push("due");
        // Same-day due with a time → `due 6pm`. Otherwise keep a date word.
        if (draft.dueDate && (draft.dueDate !== draft.startDate || !draft.dueTime)) {
            chips.push(chipDatePhrase(draft.dueDate, now));
        }
        if (draft.dueTime) chips.push(chipTimePhrase(draft.dueTime));
    }

    if (draft.priority !== "low") {
        chips.push(QUICK_ADD_PRIORITY_TOKENS[draft.priority].toLowerCase());
    }

    if (draft.repeat) {
        const phrase = chipRepeatPhrase(draft.repeat);
        if (phrase) chips.push(phrase);
    }

    for (const minutes of [...draft.reminders].sort((a, b) => b - a)) {
        chips.push(chipReminderPhrase(minutes));
    }

    return joinTitleChips(protectedName, chips);
}
/**
 * Open a saved task for edit with chips still in the places they were typed.
 * Details already written in the title are owned by those words (deleting the
 * word clears the detail). Anything missing from the title — older stripped
 * titles, or a repeat with an end date — stays on `base`.
 */
export function quickAddDraftFromTask(
    task: Task,
    now: number,
    catalogs?: QuickAddCatalogs,
): QuickAddDraft {
    const links = {
        propertyId: task.propertyId,
        clientId: task.clientId,
        ownerId: task.ownerId,
    };
    const { text, entities } = catalogs
        ? withLinkedChips(task.title, links, catalogs)
        : { text: task.title, entities: [] as QuickAddEntity[] };
    const parse = parseQuickAdd(text, {
        now,
        baseDate: task.startDate,
        entities,
    });
    let reminders = [...task.reminders];
    for (const atom of parse.atoms) {
        if (atom.kind === "reminder" && atom.minutes !== undefined)
            reminders = reminders.filter((value) => value !== atom.minutes);
    }
    const typedStartDate = parse.atoms.some((atom) => atom.kind === "date");
    const typedStartTime = parse.atoms.some((atom) => atom.kind === "time");
    const typedDue =
        parse.atoms.some((atom) => atom.kind === "due") ||
        parse.atoms.some((atom) => atom.kind === "due-date" || atom.kind === "due-time");
    return {
        text,
        entities,
        dismissed: [],
        closedMention: null,
        preserved: {
            atoms: parse.atoms.map((atom) => ({ ...atom })),
            values: {
                startDate: task.startDate,
                startTime: task.startTime ?? null,
                dueDate: task.dueDate,
                dueTime: task.dueTime,
                repeat: task.repeat,
                priority: task.priority === "low" ? null : task.priority,
                reminders: [...task.reminders],
                propertyId: task.propertyId,
                clientId: task.clientId,
                ownerId: task.ownerId ?? null,
            },
        },
        base: {
            // Start stays on base so a word like “tomorrow” does not drift when
            // the task is opened on a later day; typed date words still win while editing.
            startDate: typedStartDate ? null : task.startDate,
            startTime: typedStartTime ? null : (task.startTime ?? null),
            dueDate: typedDue ? null : task.dueDate,
            dueTime: typedDue ? null : task.dueTime,
            repeat: parse.atoms.some((atom) => atom.kind === "repeat")
                ? null
                : (task.repeat ?? null),
            priority: parse.atoms.some((atom) => atom.kind === "priority")
                ? null
                : task.priority === "low"
                  ? null
                  : task.priority,
            reminders,
            propertyId: entities.some((entity) => entity.kind === "property")
                ? null
                : task.propertyId,
            clientId: entities.some((entity) => entity.kind === "client") ? null : task.clientId,
            ownerId: entities.some((entity) => entity.kind === "owner")
                ? null
                : (task.ownerId ?? null),
        },
    };
}

/** Where `prev` became `next`; the caret pins the edit when repeated letters make it ambiguous. */
export function diffText(prev: string, next: string, caret?: number | null): TextEdit {
    if (caret !== null && caret !== undefined && caret >= 0 && caret <= next.length) {
        const suffix = next.length - caret;
        if (suffix <= prev.length && prev.slice(prev.length - suffix) === next.slice(caret)) {
            const end = prev.length - suffix;
            const limit = Math.min(end, caret);
            let start = 0;
            while (start < limit && prev[start] === next[start]) start++;
            return { start, end, inserted: next.slice(start, caret) };
        }
    }
    const shortest = Math.min(prev.length, next.length);
    let start = 0;
    while (start < shortest && prev[start] === next[start]) start++;
    let suffix = 0;
    while (
        suffix < shortest - start &&
        prev[prev.length - 1 - suffix] === next[next.length - 1 - suffix]
    )
        suffix++;
    return { start, end: prev.length - suffix, inserted: next.slice(start, next.length - suffix) };
}

/** Move ranges past an edit; a range the edit touches stops being special. */
function shiftRanges<T extends QuickAddRange>(ranges: readonly T[], edit: TextEdit): T[] {
    const delta = edit.inserted.length - (edit.end - edit.start);
    const shifted: T[] = [];
    for (const range of ranges) {
        if (edit.end <= range.start)
            shifted.push({ ...range, start: range.start + delta, end: range.end + delta });
        else if (edit.start >= range.end) shifted.push(range);
    }
    return shifted;
}

function shiftIndex(index: number, edit: TextEdit): number {
    if (index <= edit.start) return index;
    if (index >= edit.end) return index + edit.inserted.length - (edit.end - edit.start);
    return edit.start + edit.inserted.length;
}

function applyEdit(draft: QuickAddDraft, edit: TextEdit): QuickAddDraft {
    const closed =
        draft.closedMention === null
            ? []
            : shiftRanges([{ start: draft.closedMention, end: draft.closedMention + 1 }], edit);
    return {
        ...draft,
        text: draft.text.slice(0, edit.start) + edit.inserted + draft.text.slice(edit.end),
        entities: shiftRanges(draft.entities, edit),
        dismissed: shiftRanges(draft.dismissed, edit),
        preserved: draft.preserved
            ? { ...draft.preserved, atoms: shiftRanges(draft.preserved.atoms, edit) }
            : undefined,
        closedMention: closed[0]?.start ?? null,
    };
}

export type QuickAddTextChange = {
    /** Caret after the browser applied the change. */
    caret: number;
    /** Selection before the change. */
    previous: QuickAddRange;
    /** Recognised phrases before the change. */
    atoms: readonly QuickAddAtom[];
    composing: boolean;
};

/**
 * Accept text from the field. Two Todoist rules apply to deletions:
 * a picked record goes as a whole, and Backspace at the end of a recognised
 * phrase first turns it back into plain words instead of deleting a letter.
 */
export function changeQuickAddText(
    draft: QuickAddDraft,
    next: string,
    change: QuickAddTextChange,
): QuickAddEditResult {
    const edit = diffText(draft.text, next, change.caret);
    const deletion = !edit.inserted && edit.end > edit.start;
    if (deletion) {
        const touched = draft.entities.filter(
            (entity) => edit.start < entity.end && edit.end > entity.start,
        );
        if (touched.length) {
            const whole: TextEdit = {
                start: Math.min(edit.start, ...touched.map((entity) => entity.start)),
                end: Math.max(edit.end, ...touched.map((entity) => entity.end)),
                inserted: "",
            };
            return { draft: applyEdit(draft, whole), caret: whole.start };
        }
    }
    // Restoring text mid-composition would fight the keyboard, so only plain Backspace dismisses.
    if (deletion && !change.composing) {
        const backspace =
            edit.end - edit.start === 1 &&
            change.previous.start === change.previous.end &&
            change.previous.end === edit.end;
        const atom = backspace && change.atoms.find((item) => item.end === edit.end);
        if (atom)
            return {
                draft: {
                    ...draft,
                    dismissed: [...draft.dismissed, { start: atom.start, end: atom.end }],
                },
                caret: atom.end,
            };
    }
    return { draft: applyEdit(draft, edit), caret: change.caret };
}

/** Delete ranges of text, each with one neighbouring space so words don't run together. */
export function removeQuickAddRanges(
    draft: QuickAddDraft,
    ranges: readonly QuickAddRange[],
    caret: number,
): QuickAddEditResult {
    let result = draft;
    let nextCaret = caret;
    for (const range of [...ranges].sort((a, b) => b.start - a.start)) {
        let { start, end } = range;
        if (result.text[end] === " ") end++;
        else if (start > 0 && result.text[start - 1] === " ") start--;
        const edit = { start, end, inserted: "" };
        result = applyEdit(result, edit);
        nextCaret = shiftIndex(nextCaret, edit);
    }
    return { draft: result, caret: nextCaret };
}

/** Replace the open # / @ search with the picked record, one per kind. */
export function insertQuickAddEntity(
    draft: QuickAddDraft,
    mention: QuickAddMention,
    option: QuickAddOption,
): QuickAddEditResult {
    const trigger = option.kind === "property" ? "#" : "@";
    const token = `${trigger}${option.label}`;
    const spacer = draft.text[mention.end] === " " ? "" : " ";
    const edit = { start: mention.start, end: mention.end, inserted: token + spacer };
    const inserted = applyEdit(draft, edit);
    const entity: QuickAddEntity = {
        kind: option.kind,
        refId: option.id,
        label: option.label,
        start: mention.start,
        end: mention.start + token.length,
    };
    const replaced = inserted.entities.filter((item) => item.kind === option.kind);
    const withEntity: QuickAddDraft = {
        ...inserted,
        entities: [...inserted.entities, entity],
        closedMention: null,
        base: { ...inserted.base, [LINK_FIELD[option.kind]]: null },
    };
    return removeQuickAddRanges(withEntity, replaced, mention.start + token.length + 1);
}

export function dismissQuickAddRange(draft: QuickAddDraft, range: QuickAddRange): QuickAddDraft {
    return { ...draft, dismissed: [...draft.dismissed, { start: range.start, end: range.end }] };
}

/**
 * After paste or any free-form edit, re-attach `#` / `@` chips that match the
 * catalogs so copied tokens behave like picked ones again.
 */
export function syncQuickAddEntities(
    draft: QuickAddDraft,
    catalogs: QuickAddCatalogs,
): QuickAddDraft {
    const entities = entitiesFromCatalogText(draft.text, catalogs);
    if (
        entities.length === draft.entities.length &&
        entities.every(
            (entity, index) =>
                entity.kind === draft.entities[index]?.kind &&
                entity.refId === draft.entities[index]?.refId &&
                entity.start === draft.entities[index]?.start &&
                entity.end === draft.entities[index]?.end,
        )
    ) {
        return draft;
    }
    let base = draft.base;
    for (const entity of entities) {
        base = { ...base, [LINK_FIELD[entity.kind]]: null };
    }
    return { ...draft, entities, base };
}

const REMINDER_ERROR: Record<QuickAddReminderIssueReason, string> = {
    "need-time": "Reminders need a due time — add due 5pm (or similar).",
    "too-many": `You can add up to ${MAX_TASK_REMINDERS} reminders.`,
    "already-passed":
        "That reminder time has already passed. Choose a shorter lead time or a later due time.",
    duplicate: "That reminder is already added.",
};

const REMINDER_ERROR_PRIORITY: QuickAddReminderIssueReason[] = [
    "need-time",
    "too-many",
    "already-passed",
    "duplicate",
];

function reminderIssueMessage(issues: readonly QuickAddReminderIssue[]): string {
    for (const reason of REMINDER_ERROR_PRIORITY) {
        if (issues.some((issue) => issue.reason === reason)) return REMINDER_ERROR[reason];
    }
    return "";
}

function reminderHasPassed(date: string, time: string, minutes: number, now: number): boolean {
    const at = taskReminderAt({ dueDate: date, dueTime: time }, minutes);
    return !at || Date.parse(at) <= now;
}

function scheduleInstant(date: string, time: string | null): number | null {
    if (!time) return null;
    const at = taskDueAt({ dueDate: date, dueTime: time });
    return at ? Date.parse(at) : null;
}

function dueIsBeforeStart(
    startDate: string,
    startTime: string | null,
    dueDate: string,
    dueTime: string | null,
): boolean {
    if (dueDate < startDate) return true;
    if (dueDate > startDate) return false;
    if (startTime && dueTime) return dueTime < startTime;
    return false;
}

function dueClauseRanges(parse: QuickAddParse): QuickAddRange[] {
    return parse.highlights
        .filter((highlight) => highlight.kind === "due")
        .map(({ start, end }) => ({ start, end }));
}

/**
 * What the task will be saved with: typed words first, then the column date / existing values.
 * Plain date/time → start. Explicit `due …` → optional end. Reminders need a due time.
 */
export function resolveQuickAddValues(
    draft: QuickAddDraft,
    parse: QuickAddParse,
    now: number,
): QuickAddValues {
    const { base } = draft;
    const isPreserved = (atom: QuickAddAtom) =>
        draft.preserved?.atoms.some(
            (saved) =>
                saved.kind === atom.kind && saved.start === atom.start && saved.end === atom.end,
        ) ?? false;
    const preservedGroup = (kinds: QuickAddAtom["kind"][]) => {
        const atoms = parse.atoms.filter((atom) => kinds.includes(atom.kind));
        return atoms.length > 0 && atoms.every(isPreserved);
    };
    const askedDue =
        parse.atoms.some((atom) => atom.kind === "due") ||
        parse.dueDate !== null ||
        parse.dueTime !== null ||
        base.dueDate !== null ||
        base.dueTime !== null;

    const dateKinds: QuickAddAtom["kind"][] = [
        ...parse.atoms,
        ...(draft.preserved?.atoms ?? []),
    ].some((atom) => atom.kind === "date")
        ? ["date"]
        : ["time", "repeat"];
    const startDate = preservedGroup(dateKinds)
        ? draft.preserved!.values.startDate
        : (parse.startDate ?? base.startDate);
    const startTime = startDate
        ? preservedGroup(["time"])
            ? draft.preserved!.values.startTime
            : (parse.startTime ?? base.startTime)
        : null;

    const typedDue = parse.atoms.some(
        (atom) => atom.kind === "due" || atom.kind === "due-date" || atom.kind === "due-time",
    );
    let dueDate = typedDue ? parse.dueDate : (parse.dueDate ?? base.dueDate);
    let dueTime = dueDate ? (typedDue ? parse.dueTime : (parse.dueTime ?? base.dueTime)) : null;
    if (preservedGroup(["due", "due-date", "due-time"])) {
        dueDate = draft.preserved!.values.dueDate;
        dueTime = draft.preserved!.values.dueTime;
    }

    const dueIssues: QuickAddRange[] = [];
    let dueError = "";
    if (askedDue || typedDue) {
        if (!startDate || !startTime) {
            dueIssues.push(...dueClauseRanges(parse));
            dueError = "Add a start date and time before the due date.";
            dueDate = null;
            dueTime = null;
        } else if (dueDate && dueIsBeforeStart(startDate, startTime, dueDate, dueTime)) {
            dueIssues.push(...dueClauseRanges(parse));
            dueError = "Due must be on or after the start date and time.";
            dueDate = null;
            dueTime = null;
        } else if (typedDue && !dueDate) {
            dueIssues.push(...dueClauseRanges(parse));
            dueError = "Add a due date after due, like due tomorrow 6pm.";
            dueTime = null;
        }
    }

    const reminderAtoms = parse.atoms.filter(
        (atom): atom is QuickAddAtom & { minutes: number } =>
            atom.kind === "reminder" && atom.minutes !== undefined,
    );
    const typedMinutes = new Set(reminderAtoms.map((atom) => atom.minutes));
    const baseOnly = base.reminders.filter((minutes) => !typedMinutes.has(minutes));
    const accepted: number[] = [];
    const issues: QuickAddReminderIssue[] = [];

    if (dueDate && dueTime) {
        for (const minutes of baseOnly) {
            // Keep existing offsets even if they already fired — same rule as the task form.
            if (accepted.length < MAX_TASK_REMINDERS) accepted.push(minutes);
        }
    }

    for (const atom of reminderAtoms) {
        const { minutes, start, end } = atom;
        if (!dueDate || !dueTime) {
            issues.push({ start, end, minutes, reason: "need-time" });
            continue;
        }
        if (accepted.includes(minutes)) {
            issues.push({ start, end, minutes, reason: "duplicate" });
            continue;
        }
        const unchangedReminder =
            isPreserved(atom) &&
            draft.preserved!.values.reminders.includes(minutes) &&
            dueDate === draft.preserved!.values.dueDate &&
            dueTime === draft.preserved!.values.dueTime;
        if (!unchangedReminder && reminderHasPassed(dueDate, dueTime, minutes, now)) {
            issues.push({ start, end, minutes, reason: "already-passed" });
            continue;
        }
        if (accepted.length >= MAX_TASK_REMINDERS) {
            issues.push({ start, end, minutes, reason: "too-many" });
            continue;
        }
        accepted.push(minutes);
    }

    const startAt = startDate ? scheduleInstant(startDate, startTime) : null;
    const schedulePassed = startAt !== null && startAt <= now;
    const scheduleIssues = schedulePassed
        ? parse.highlights
              .filter((highlight) => highlight.kind === "schedule")
              .map(({ start, end }) => ({ start, end }))
        : [];

    return {
        // Keep chips in the places they were typed; fields are stored beside this text.
        title: literalDismissedTitle(draft),
        startDate,
        startTime,
        dueDate,
        dueTime,
        date: startDate,
        time: startTime,
        // An undated task can still repeat from its start date; typed repeats always bring a date.
        repeat: preservedGroup(["repeat"])
            ? draft.preserved!.values.repeat
            : (parse.repeat ?? base.repeat),
        priority: parse.priority ?? base.priority,
        reminders: [...accepted].sort((a, b) => b - a),
        propertyId: parse.propertyId ?? base.propertyId,
        clientId: parse.clientId ?? base.clientId,
        ownerId: parse.ownerId ?? base.ownerId,
        reminderIssues: issues,
        reminderError: reminderIssueMessage(issues),
        schedulePassed,
        scheduleIssues,
        scheduleError: schedulePassed ? "That time has already passed. Pick a later time." : "",
        dueIssues,
        dueError,
    };
}
