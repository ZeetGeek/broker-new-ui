import type { Task, TaskPriority } from "./model";
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
    date: string | null;
    time: string | null;
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

export type QuickAddValues = {
    title: string;
    date: string | null;
    time: string | null;
    repeat: TaskRepeat | null;
    priority: TaskPriority | null;
    /** Reminders that will be saved — only when there is a due time. */
    reminders: number[];
    propertyId: string | null;
    clientId: string | null;
    ownerId: string | null;
    /** Reminders were asked for, but there is no time to remind before. */
    remindersNeedTime: boolean;
};

type TextEdit = { start: number; end: number; inserted: string };

const EMPTY_BASE: QuickAddBase = {
    date: null,
    time: null,
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
        base: { ...EMPTY_BASE, date },
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
        baseDate: task.dueDate,
        entities,
    });
    let reminders = [...task.reminders];
    for (const atom of parse.atoms) {
        if (atom.kind === "reminder" && atom.minutes !== undefined)
            reminders = reminders.filter((value) => value !== atom.minutes);
    }
    return {
        text: task.title,
        entities,
        dismissed: [],
        closedMention: null,
        base: {
            // Date stays on base so a word like “tomorrow” does not drift when
            // the task is opened on a later day; typed date words still win while editing.
            date: task.dueDate,
            time: parse.atoms.some((atom) => atom.kind === "time")
                ? null
                : task.dueDate
                  ? task.dueTime
                  : null,
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

/** What the task will be saved with: typed words first, then the column date / existing values. */
export function resolveQuickAddValues(draft: QuickAddDraft, parse: QuickAddParse): QuickAddValues {
    const { base } = draft;
    const date = parse.date ?? base.date;
    const time = date ? (parse.time ?? base.time) : null;
    const asked = [...new Set([...parse.reminders, ...base.reminders])].sort((a, b) => b - a);
    return {
        // Keep chips in the places they were typed; fields are stored beside this text.
        title: draft.text.trim(),
        date,
        time,
        // An undated task can still repeat from its start date; typed repeats always bring a date.
        repeat: parse.repeat ?? base.repeat,
        priority: parse.priority ?? base.priority,
        reminders: time ? asked : [],
        propertyId: parse.propertyId ?? base.propertyId,
        clientId: parse.clientId ?? base.clientId,
        ownerId: parse.ownerId ?? base.ownerId,
        remindersNeedTime: asked.length > 0 && !time,
    };
}
