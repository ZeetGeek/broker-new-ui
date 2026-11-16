import { MAX_TASK_REMINDERS } from "@/lib/reminders";

import { type Task, type TaskPriority, taskDueAt, taskReminderAt } from "./model";
import {
    entitiesFromCatalogText,
    entitiesFromTaskTitle,
    parseQuickAdd,
    type QuickAddAtom,
    type QuickAddCatalogs,
    type QuickAddEntity,
    type QuickAddEntityKind,
    type QuickAddMention,
    type QuickAddOption,
    type QuickAddParse,
    type QuickAddRange,
} from "./quick-add-parse";
import type { TaskRepeat } from "./recurrence";

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
    const entities = catalogs
        ? entitiesFromTaskTitle(
              task.title,
              {
                  propertyId: task.propertyId,
                  clientId: task.clientId,
                  ownerId: task.ownerId,
              },
              catalogs,
          )
        : [];
    const parse = parseQuickAdd(task.title, {
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
        text: task.title,
        entities,
        dismissed: [],
        closedMention: null,
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
    const askedDue =
        parse.atoms.some((atom) => atom.kind === "due") ||
        parse.dueDate !== null ||
        parse.dueTime !== null ||
        base.dueDate !== null ||
        base.dueTime !== null;

    const startDate = parse.startDate ?? base.startDate;
    const startTime = startDate ? (parse.startTime ?? base.startTime) : null;

    const typedDue = parse.atoms.some(
        (atom) => atom.kind === "due" || atom.kind === "due-date" || atom.kind === "due-time",
    );
    let dueDate = typedDue ? parse.dueDate : (parse.dueDate ?? base.dueDate);
    let dueTime = dueDate ? (typedDue ? parse.dueTime : (parse.dueTime ?? base.dueTime)) : null;

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
        if (reminderHasPassed(dueDate, dueTime, minutes, now)) {
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
        title: draft.text.trim(),
        startDate,
        startTime,
        dueDate,
        dueTime,
        date: startDate,
        time: startTime,
        // An undated task can still repeat from its start date; typed repeats always bring a date.
        repeat: parse.repeat ?? base.repeat,
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
