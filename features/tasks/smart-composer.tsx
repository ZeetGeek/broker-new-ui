"use client";

import {
    type FormEvent,
    type KeyboardEvent,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";

import { formatInTimeZone } from "date-fns-tz";

import { Hash, Plus, UserRound } from "@/components/shared/icons";

import { TASK_TIME_ZONE, type Task, type TaskPriority } from "./model";
import type { PlannerTaskExtras } from "./planner-model";
import {
    filterSmartContacts,
    filterSmartProperties,
    parseTrailingMention,
    SMART_PRIORITY_CHIP,
    SMART_TOKEN_BOUNDARY,
    type SmartAddCatalogs,
    type SmartContactOption,
    type SmartPropertyOption,
    smartTimeChipLabel,
    splitSmartInlineParts,
} from "./smart-add";

import styles from "./planner.module.css";

const dateText = (day: string, format: string) =>
    formatInTimeZone(`${day}T12:00:00+05:30`, TASK_TIME_ZONE, format);

type TextSegment = { id: string; type: "text"; value: string };
type ChipSegment = {
    id: string;
    type: "chip";
    kind: "date" | "time" | "priority" | "property" | "client" | "owner";
    label: string;
    value: string;
};
type Segment = TextSegment | ChipSegment;

const newId = () => crypto.randomUUID();
const emptySegments = (): Segment[] => [{ id: newId(), type: "text", value: "" }];
const TITLE_MAX = 160;

/** Keep the saved title at or under TITLE_MAX while typing / pasting. */
function clampToTitleLimit(
    segments: Segment[],
    segmentId: string,
    nextValue: string,
): string | null {
    const withValue = (value: string) =>
        segments.map((segment) =>
            segment.id === segmentId && segment.type === "text" ? { ...segment, value } : segment,
        );
    if (serializeTitle(withValue(nextValue)).length <= TITLE_MAX) return nextValue;

    const current =
        segments.find((segment) => segment.id === segmentId && segment.type === "text")?.value ??
        "";
    let lo = 0;
    let hi = nextValue.length;
    let best = "";
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const candidate = nextValue.slice(0, mid);
        if (serializeTitle(withValue(candidate)).length <= TITLE_MAX) {
            best = candidate;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    if (best === current && nextValue.length > current.length) return null;
    return best;
}

/**
 * Collapse empty/whitespace gaps around chips. Empty inputs still take flex
 * min-width + line gap, which looked like "unwanted space" beside chips.
 */
function normalizeSegments(segments: Segment[]): Segment[] {
    const trailingEmptyId = [...segments]
        .reverse()
        .find((segment) => segment.type === "text" && segment.value === "")?.id;

    const prepared = segments.map((segment, index) => {
        if (segment.type !== "text") return segment;
        let value = segment.value;
        const prev = segments[index - 1];
        const next = segments[index + 1];
        if (prev?.type === "chip") value = value.replace(/^\s+/, "");
        if (next?.type === "chip") value = value.replace(/\s+$/, "");
        return { ...segment, value };
    });

    const merged: Segment[] = [];
    for (const segment of prepared) {
        if (segment.type === "text") {
            if (!segment.value) continue;
            const previous = merged.at(-1);
            if (previous?.type === "text") {
                previous.value += segment.value;
                continue;
            }
            merged.push({ ...segment });
            continue;
        }
        merged.push(segment);
    }

    if (merged.at(-1)?.type !== "text") {
        merged.push({
            id: trailingEmptyId ?? newId(),
            type: "text",
            value: "",
        });
    }
    return merged.length ? merged : emptySegments();
}

function mergeTextSegments(segments: Segment[]): Segment[] {
    return normalizeSegments(segments);
}

/** One chip per kind; a later chip replaces an earlier one of the same kind. */
function withUniqueChips(segments: Segment[]): Segment[] {
    const seen = new Set<ChipSegment["kind"]>();
    const reversed: Segment[] = [];
    for (const segment of [...segments].reverse()) {
        if (segment.type === "chip") {
            if (seen.has(segment.kind)) continue;
            seen.add(segment.kind);
        }
        reversed.push(segment);
    }
    return normalizeSegments(reversed.reverse());
}

function partsToSegments(parts: ReturnType<typeof splitSmartInlineParts>["parts"]): Segment[] {
    const segments: Segment[] = [];
    for (const part of parts) {
        if (part.type === "text") {
            if (part.value) segments.push({ id: newId(), type: "text", value: part.value });
            continue;
        }
        segments.push({
            id: newId(),
            type: "chip",
            kind: part.type,
            label: part.label,
            value: part.value,
        });
    }
    return normalizeSegments(segments);
}

function typedTitle(segments: Segment[]) {
    return segments
        .filter((segment): segment is TextSegment => segment.type === "text")
        .map((segment) => segment.value)
        .join("")
        .replace(/\s+/g, " ")
        .trim();
}

function displayPart(segment: Segment) {
    if (segment.type === "text") return segment.value;
    // Priority shows as the row colour; its spot is kept in `priorityAt` instead.
    if (segment.kind === "date" || segment.kind === "priority") return "";
    return segment.label;
}

/** Preserve the same order the user typed: "P1 Hello Aarav Shah task". */
function serializeTitle(segments: Segment[]) {
    return segments
        .map(displayPart)
        .map((part) => part.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" ")
        .trim();
}

function extrasFromSegments(segments: Segment[]) {
    let dueDate: string | null | undefined;
    let dueTime: string | null | undefined;
    let priority: TaskPriority | undefined;
    let clientId: string | null = null;
    let ownerId: string | null = null;
    let propertyId: string | null = null;
    for (const segment of segments) {
        if (segment.type !== "chip") continue;
        if (segment.kind === "date") dueDate = segment.value;
        if (segment.kind === "time") dueTime = segment.value;
        if (segment.kind === "priority") priority = segment.value as TaskPriority;
        if (segment.kind === "client") clientId = segment.value;
        if (segment.kind === "owner") ownerId = segment.value;
        if (segment.kind === "property") propertyId = segment.value;
    }
    return { dueDate, dueTime, priority, clientId, ownerId, propertyId };
}

/** Rebuild chips from a saved task so inline edit matches smart-add. */
function segmentsFromTask(task: Task, catalogs: SmartAddCatalogs, _now: number): Segment[] {
    const client = task.clientId
        ? catalogs.clients.find((item) => item.id === task.clientId)
        : undefined;
    const owner = task.ownerId
        ? catalogs.owners.find((item) => item.id === task.ownerId)
        : undefined;
    const property = task.propertyId
        ? catalogs.properties.find((item) => item.id === task.propertyId)
        : undefined;

    const chips: ChipSegment[] = [];
    if (property) {
        chips.push({
            id: newId(),
            type: "chip",
            kind: "property",
            label: property.title,
            value: property.id,
        });
    }
    if (client) {
        chips.push({
            id: newId(),
            type: "chip",
            kind: "client",
            label: client.name,
            value: client.id,
        });
    } else if (owner) {
        chips.push({
            id: newId(),
            type: "chip",
            kind: "owner",
            label: owner.name,
            value: owner.id,
        });
    }
    if (task.dueTime) {
        chips.push({
            id: newId(),
            type: "chip",
            kind: "time",
            label: smartTimeChipLabel(task.dueTime),
            value: task.dueTime,
        });
    }
    const priorityLabel = SMART_PRIORITY_CHIP[task.priority];
    const hasPriorityAt = typeof task.priorityAt === "number";
    if (task.priority !== "low" || hasPriorityAt || task.title.includes(priorityLabel)) {
        chips.push({
            id: newId(),
            type: "chip",
            kind: "priority",
            label: priorityLabel,
            value: task.priority,
        });
    }
    /* Priority is not in the title; it sits at a stored offset with zero width. */
    const chipSpan = (chip: ChipSegment, from: number) => {
        if (chip.kind === "priority" && hasPriorityAt) {
            const at = Math.min(task.priorityAt ?? 0, task.title.length);
            return at >= from ? { index: at, length: 0 } : null;
        }
        const index = task.title.indexOf(chip.label, from);
        return index < 0 ? null : { index, length: chip.label.length };
    };

    const remaining = [...chips];
    const segments: Segment[] = [];
    let cursor = 0;
    while (cursor < task.title.length) {
        let next: { index: number; length: number; chip: ChipSegment } | undefined;
        for (const chip of remaining) {
            const span = chipSpan(chip, cursor);
            if (!span) continue;
            if (
                !next ||
                span.index < next.index ||
                (span.index === next.index && span.length > next.length)
            ) {
                next = { ...span, chip };
            }
        }
        if (!next) break;
        if (next.index > cursor) {
            segments.push({
                id: newId(),
                type: "text",
                value: task.title.slice(cursor, next.index),
            });
        }
        segments.push(next.chip);
        remaining.splice(remaining.indexOf(next.chip), 1);
        cursor = next.index + next.length;
    }
    if (cursor < task.title.length) {
        segments.push({ id: newId(), type: "text", value: task.title.slice(cursor) });
    }
    if (!segments.length && task.title.trim()) {
        segments.push({ id: newId(), type: "text", value: task.title });
    }
    // Older records may have metadata not present in the title; append only those missing chips.
    segments.push(...remaining);
    return normalizeSegments(segments);
}

export function SmartTaskComposer({
    date,
    listId,
    listName,
    busy,
    now,
    catalogs,
    task,
    onAdd,
    onSave,
    onCancel,
}: {
    date: string | null;
    listId?: string;
    listName?: string;
    busy: boolean;
    now: number;
    catalogs: SmartAddCatalogs;
    /** When set, composer edits this task instead of creating one. */
    task?: Task;
    onAdd?: (
        title: string,
        date: string | null,
        listId?: string,
        extras?: PlannerTaskExtras,
    ) => Promise<boolean>;
    onSave?: (title: string, extras?: PlannerTaskExtras) => Promise<boolean>;
    onCancel?: () => void;
}) {
    const editing = !!task;
    const initialSegmentsRef = useRef<Segment[] | null>(null);
    const initialSegments = () => {
        initialSegmentsRef.current ??= task
            ? segmentsFromTask(task, catalogs, now)
            : emptySegments();
        return initialSegmentsRef.current;
    };
    const [segments, setSegments] = useState<Segment[]>(initialSegments);
    const [activeId, setActiveId] = useState<string | null>(() => {
        const next = initialSegments();
        return next.filter((segment) => segment.type === "text").at(-1)?.id ?? null;
    });
    const [highlight, setHighlight] = useState(0);
    const pending = useRef(false);
    const inputRefs = useRef(new Map<string, HTMLTextAreaElement>());
    const listIdAttr = useId();
    const activeSegment =
        segments.find((segment) => segment.id === activeId && segment.type === "text") ??
        segments.filter((segment) => segment.type === "text").at(-1);
    const activeText = activeSegment?.type === "text" ? activeSegment.value : "";
    const mention = activeSegment ? parseTrailingMention(activeText) : null;
    const propertyOptions = useMemo(
        () => (mention?.kind === "property" ? filterSmartProperties(catalogs, mention.query) : []),
        [catalogs, mention],
    );
    const contactOptions = useMemo(
        () => (mention?.kind === "contact" ? filterSmartContacts(catalogs, mention.query) : []),
        [catalogs, mention],
    );
    const options = mention?.kind === "property" ? propertyOptions : contactOptions;
    const activeIndex = options.length ? Math.min(highlight, options.length - 1) : 0;
    const title = serializeTitle(segments);
    const typed = typedTitle(segments);
    const hasChips = segments.some((segment) => segment.type === "chip");
    const empty = !typed && !hasChips;
    const needsTitle = !typed && hasChips;
    // Open @/# menus should not block Add — incomplete mentions are stripped on submit.
    const typedForSubmit =
        mention && activeSegment
            ? typedTitle(
                  segments.map((segment) =>
                      segment.id === activeSegment.id && segment.type === "text"
                          ? {
                                ...segment,
                                value: segment.value.slice(0, mention.start).replace(/\s+$/, ""),
                            }
                          : segment,
                  ),
              )
            : typed;
    const canSubmit = typedForSubmit.length > 0;

    useEffect(() => {
        if (!activeId) return;
        inputRefs.current.get(activeId)?.focus();
    }, [activeId]);

    useEffect(() => {
        if (!task) return;
        const next = segmentsFromTask(task, catalogs, now);
        setSegments(next);
        const focusId = next.filter((segment) => segment.type === "text").at(-1)?.id ?? null;
        setActiveId(focusId);
        setHighlight(0);
        // Re-seed only when opening a different task for edit.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- catalogs/now changes shouldn't reset mid-edit
    }, [task?.id]);

    const focusSegment = (id: string, cursor: "start" | "end" = "end") => {
        setActiveId(id);
        requestAnimationFrame(() => {
            const field = inputRefs.current.get(id);
            if (!field) return;
            field.focus();
            const index = cursor === "start" ? 0 : field.value.length;
            field.setSelectionRange(index, index);
        });
    };

    const replaceTextWithParts = (segmentId: string, value: string, focusTrailing = true) => {
        const { parts } = splitSmartInlineParts(value, now);
        const built = partsToSegments(parts);
        setSegments((current) => {
            const index = current.findIndex((segment) => segment.id === segmentId);
            if (index < 0) return current;
            const kinds = new Set(
                built.filter((part) => part.type === "chip").map((part) => part.kind),
            );
            const next = withUniqueChips([
                ...current
                    .slice(0, index)
                    .filter((segment) => segment.type !== "chip" || !kinds.has(segment.kind)),
                ...built,
                ...current
                    .slice(index + 1)
                    .filter((segment) => segment.type !== "chip" || !kinds.has(segment.kind)),
            ]);
            if (focusTrailing) {
                const focusId = next.filter((segment) => segment.type === "text").at(-1)?.id;
                if (focusId) {
                    setActiveId(focusId);
                    requestAnimationFrame(() => {
                        const field = inputRefs.current.get(focusId);
                        if (!field) return;
                        field.focus();
                        const caret = field.value.length;
                        field.setSelectionRange(caret, caret);
                    });
                }
            }
            return next;
        });
        setHighlight(0);
    };

    const updateText = (segmentId: string, rawValue: string) => {
        const value = clampToTitleLimit(segments, segmentId, rawValue.replace(/[\r\n]+/g, " "));
        if (value === null) return;
        if (SMART_TOKEN_BOUNDARY.test(value) && !parseTrailingMention(value)) {
            replaceTextWithParts(segmentId, value);
            return;
        }
        setSegments((current) => {
            const mapped = current.map((segment) =>
                segment.id === segmentId && segment.type === "text"
                    ? { ...segment, value }
                    : segment,
            );
            const next = normalizeSegments(mapped);
            // Clearing title text left of a chip drops that empty slot — keep caret after chips.
            if (!next.some((segment) => segment.id === segmentId)) {
                const focusId = next.filter((segment) => segment.type === "text").at(-1)?.id;
                if (focusId) {
                    setActiveId(focusId);
                    requestAnimationFrame(() => {
                        const field = inputRefs.current.get(focusId);
                        if (!field) return;
                        field.focus();
                        field.setSelectionRange(0, 0);
                    });
                }
            }
            return next;
        });
        setHighlight(0);
    };

    const insertChip = (
        chip: Omit<ChipSegment, "id" | "type">,
        segmentId: string,
        mentionStart: number,
    ) => {
        const afterId = newId();
        setSegments((current) => {
            const index = current.findIndex((segment) => segment.id === segmentId);
            const segment = current[index];
            if (!segment || segment.type !== "text") return current;
            const before = segment.value.slice(0, mentionStart).replace(/\s+$/, "");
            const next = withUniqueChips([
                ...current
                    .slice(0, index)
                    .filter((item) => item.type !== "chip" || item.kind !== chip.kind),
                ...(before ? [{ id: newId(), type: "text" as const, value: before }] : []),
                { id: newId(), type: "chip", ...chip },
                { id: afterId, type: "text", value: "" },
                ...current
                    .slice(index + 1)
                    .filter((item) => item.type !== "chip" || item.kind !== chip.kind),
            ]);
            if (serializeTitle(next).length > TITLE_MAX) return current;
            const focusId = next.filter((item) => item.type === "text").at(-1)?.id ?? afterId;
            setActiveId(focusId);
            return next;
        });
        setHighlight(0);
    };

    const applyProperty = (option: SmartPropertyOption) => {
        if (!activeSegment || !mention || mention.kind !== "property") return;
        insertChip(
            { kind: "property", label: option.title, value: option.id },
            activeSegment.id,
            mention.start,
        );
    };

    const applyContact = (option: SmartContactOption) => {
        if (!activeSegment || !mention || mention.kind !== "contact") return;
        insertChip(
            { kind: option.kind, label: option.name, value: option.id },
            activeSegment.id,
            mention.start,
        );
    };

    const removeChip = (chipId: string) => {
        setSegments((current) => {
            const index = current.findIndex((segment) => segment.id === chipId);
            if (index < 0) return current;
            const before = current[index - 1];
            const after = current[index + 1];
            let left = current.slice(0, index);
            const right = current.slice(index + 1);
            const joins =
                before?.type === "text" &&
                after?.type === "text" &&
                !!before.value &&
                !!after.value;
            let joinAt = 0;
            if (joins && before?.type === "text") {
                const spaced =
                    /\s$/.test(before.value) || (after?.type === "text" && /^\s/.test(after.value))
                        ? before.value
                        : `${before.value} `;
                left = [...left.slice(0, -1), { ...before, value: spaced }];
                joinAt = spaced.length;
            }
            const next = normalizeSegments([...left, ...right]);
            const survives = (segment: Segment | undefined) =>
                segment?.type === "text" && next.some((item) => item.id === segment.id);
            // Caret lands where the chip was: the join point, else the start of the
            // text right after it, else the end of the text right before it.
            let focus: { id: string; at: "start" | "end" | number } | undefined;
            if (joins && before) focus = { id: before.id, at: joinAt };
            else if (survives(after) && after) focus = { id: after.id, at: "start" };
            else if (survives(before) && before) focus = { id: before.id, at: "end" };
            else {
                const fallback =
                    next.slice(Math.max(0, index - 1)).find((segment) => segment.type === "text") ??
                    next.filter((segment) => segment.type === "text").at(-1);
                if (fallback) focus = { id: fallback.id, at: "start" };
            }
            if (focus) {
                const { id, at } = focus;
                setActiveId(id);
                requestAnimationFrame(() => {
                    const field = inputRefs.current.get(id);
                    if (!field) return;
                    field.focus();
                    const pos = at === "start" ? 0 : at === "end" ? field.value.length : at;
                    field.setSelectionRange(pos, pos);
                });
            }
            return next;
        });
    };

    const reset = () => {
        const next = emptySegments();
        setSegments(next);
        setActiveId(next[0].id);
        setHighlight(0);
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy || pending.current) return;
        // Drop an unfinished @/# token so chips + a real title can still save.
        const ready =
            mention && activeSegment
                ? normalizeSegments(
                      segments.map((segment) =>
                          segment.id === activeSegment.id && segment.type === "text"
                              ? {
                                    ...segment,
                                    value: segment.value
                                        .slice(0, mention.start)
                                        .replace(/\s+$/, ""),
                                }
                              : segment,
                      ),
                  )
                : segments;
        const flushed = withUniqueChips(
            ready.flatMap((segment) => {
                if (segment.type !== "text") return [segment];
                if (!segment.value.trim()) return segment.value ? [segment] : [];
                return partsToSegments(splitSmartInlineParts(segment.value, now).parts);
            }),
        );
        const clean = serializeTitle(flushed);
        const priorityIndex = flushed.findIndex(
            (segment) => segment.type === "chip" && segment.kind === "priority",
        );
        const priorityAt =
            priorityIndex < 0 ? null : serializeTitle(flushed.slice(0, priorityIndex)).length;
        if (clean.length > TITLE_MAX) return;
        if (!typedTitle(flushed)) {
            if (editing) {
                // Match prior inline edit: empty submit deletes; empty blur cancels via onCancel.
                pending.current = true;
                try {
                    const saved = await onSave?.("", {
                        clientId: null,
                        ownerId: null,
                        propertyId: null,
                    });
                    if (saved) onCancel?.();
                } finally {
                    pending.current = false;
                }
                return;
            }
            if (flushed.some((segment) => segment.type === "chip")) {
                const focusId = flushed.filter((segment) => segment.type === "text").at(-1)?.id;
                if (focusId) focusSegment(focusId, "end");
            }
            return;
        }
        const payload = extrasFromSegments(flushed);
        pending.current = true;
        try {
            if (editing) {
                const saved = await onSave?.(clean, {
                    priority: payload.priority ?? "low",
                    priorityAt: payload.priority ? priorityAt : null,
                    dueDate: payload.dueDate,
                    dueTime: payload.dueTime ?? null,
                    clientId: payload.clientId,
                    ownerId: payload.ownerId,
                    propertyId: payload.propertyId,
                });
                if (saved) onCancel?.();
            } else {
                const saved = await onAdd?.(clean, payload.dueDate ?? date, listId, {
                    priority: payload.priority,
                    priorityAt: payload.priority ? priorityAt : null,
                    dueTime: payload.dueTime,
                    clientId: payload.clientId,
                    ownerId: payload.ownerId,
                    propertyId: payload.propertyId,
                });
                if (saved) reset();
            }
        } finally {
            pending.current = false;
        }
    };

    const onTextKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>, segment: TextSegment) => {
        if (mention) {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                if (options.length) setHighlight((current) => (current + 1) % options.length);
                return;
            }
            if (event.key === "ArrowUp") {
                event.preventDefault();
                if (options.length)
                    setHighlight((current) => (current - 1 + options.length) % options.length);
                return;
            }
            if (event.key === "Escape") {
                event.preventDefault();
                if (editing && !segment.value.slice(mention.start).trim()) {
                    onCancel?.();
                    return;
                }
                updateText(segment.id, segment.value.slice(0, mention.start).trimEnd());
                return;
            }
            if (event.key === "Tab" || (event.key === "Enter" && !event.shiftKey)) {
                if (options[activeIndex]) {
                    event.preventDefault();
                    if (mention.kind === "property")
                        applyProperty(options[activeIndex] as SmartPropertyOption);
                    else applyContact(options[activeIndex] as SmartContactOption);
                    return;
                }
                // No match — strip the dangling @/# and submit if a title remains.
                if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                }
                return;
            }
        }
        if (event.key === "Escape" && editing) {
            event.preventDefault();
            onCancel?.();
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
            return;
        }
        if (event.key === "Backspace") {
            const start = event.currentTarget.selectionStart ?? 0;
            const end = event.currentTarget.selectionEnd ?? 0;
            // Only intercept when the caret is at the start (no selection).
            if (start === 0 && end === 0) {
                const index = segments.findIndex((item) => item.id === segment.id);
                let left = index - 1;
                while (
                    left >= 0 &&
                    segments[left]?.type === "text" &&
                    !(segments[left] as TextSegment).value
                ) {
                    left -= 1;
                }
                const previous = left >= 0 ? segments[left] : null;
                if (previous?.type === "chip") {
                    event.preventDefault();
                    removeChip(previous.id);
                    return;
                }
                if (previous?.type === "text" && segment.value === "") {
                    event.preventDefault();
                    setSegments((current) =>
                        normalizeSegments(current.filter((item) => item.id !== segment.id)),
                    );
                    focusSegment(previous.id, "end");
                    return;
                }
            }
        }
        if (event.key === "Delete") {
            const start = event.currentTarget.selectionStart ?? 0;
            const end = event.currentTarget.selectionEnd ?? 0;
            if (start === segment.value.length && end === start) {
                const index = segments.findIndex((item) => item.id === segment.id);
                const following = segments
                    .slice(index + 1)
                    .find((item) => item.type === "chip" || item.value);
                if (following?.type === "chip") {
                    event.preventDefault();
                    removeChip(following.id);
                    return;
                }
            }
        }
        if (event.key === "ArrowLeft" && event.currentTarget.selectionStart === 0) {
            const index = segments.findIndex((item) => item.id === segment.id);
            const previous = segments
                .slice(0, index)
                .reverse()
                .find((item) => item.type === "text");
            if (previous) {
                event.preventDefault();
                focusSegment(previous.id, "end");
            }
            return;
        }
        if (
            event.key === "ArrowRight" &&
            event.currentTarget.selectionStart === segment.value.length
        ) {
            const index = segments.findIndex((item) => item.id === segment.id);
            const next = segments.slice(index + 1).find((item) => item.type === "text");
            if (next) {
                event.preventDefault();
                focusSegment(next.id, "start");
            }
        }
    };

    return (
        <form
            className={styles.composer}
            data-editing={editing || undefined}
            onSubmit={submit}
            onBlur={(event) => {
                if (!editing || busy || pending.current) return;
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                // Same as the old title field: blur saves when there is a typed name.
                if (typedForSubmit) event.currentTarget.requestSubmit();
                else onCancel?.();
            }}
        >
            <div className={styles.smartComposer}>
                <div
                    className={styles.smartInput}
                    data-empty={empty || undefined}
                    data-needs-title={needsTitle || undefined}
                    onClick={(event) => {
                        // Clicks inside a text run keep the browser's caret placement.
                        if (event.target instanceof HTMLTextAreaElement) return;
                        const last = segments.filter((segment) => segment.type === "text").at(-1);
                        if (last) focusSegment(last.id, "end");
                    }}
                >
                    <span className={styles.smartInputLine}>
                        {empty && (
                            <span className={styles.smartPlaceholder} aria-hidden="true">
                                <span>Task name — try 9am, p1</span>
                                <span>#property or @client</span>
                            </span>
                        )}
                        {segments.map((segment) =>
                            segment.type === "text" ? (
                                <textarea
                                    key={segment.id}
                                    rows={1}
                                    ref={(node) => {
                                        if (node) inputRefs.current.set(segment.id, node);
                                        else inputRefs.current.delete(segment.id);
                                    }}
                                    className={styles.smartTextInput}
                                    value={segment.value}
                                    disabled={busy}
                                    aria-label={
                                        editing
                                            ? "Edit task title"
                                            : date
                                              ? `Add a task for ${dateText(date, "EEEE, d MMMM")}`
                                              : `Add a task to ${listName ?? "Someday"}`
                                    }
                                    aria-autocomplete="list"
                                    aria-controls={mention ? listIdAttr : undefined}
                                    aria-expanded={mention ? true : undefined}
                                    aria-activedescendant={
                                        mention && options[activeIndex]
                                            ? `${listIdAttr}-${activeIndex}`
                                            : undefined
                                    }
                                    placeholder={
                                        needsTitle &&
                                        segment.id ===
                                            segments.filter((item) => item.type === "text").at(-1)
                                                ?.id
                                            ? "Type a task name"
                                            : undefined
                                    }
                                    cols={Math.max(
                                        1,
                                        segment.value.length || (needsTitle ? 16 : 1),
                                    )}
                                    onFocus={() => setActiveId(segment.id)}
                                    onChange={(event) => updateText(segment.id, event.target.value)}
                                    onKeyDown={(event) => onTextKeyDown(event, segment)}
                                    onBlur={() => {
                                        if (segment.value && !parseTrailingMention(segment.value))
                                            replaceTextWithParts(segment.id, segment.value, false);
                                    }}
                                />
                            ) : (
                                <span
                                    key={segment.id}
                                    className={styles.smartChip}
                                    data-kind={segment.kind}
                                    data-priority={
                                        segment.kind === "priority" ? segment.value : undefined
                                    }
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <span className={styles.smartChipLabel}>{segment.label}</span>
                                </span>
                            ),
                        )}
                    </span>
                    <small className={styles.smartCount}>
                        {title.length}/{TITLE_MAX}
                        {title.length >= TITLE_MAX ? " · Limit reached" : " characters"}
                    </small>
                </div>
                {mention && (
                    <div
                        id={listIdAttr}
                        className={styles.smartMenu}
                        role="listbox"
                        aria-label={
                            mention.kind === "property"
                                ? "Matching properties"
                                : "Matching contacts"
                        }
                    >
                        {options.length === 0 ? (
                            <p className={styles.smartMenuEmpty}>
                                {mention.kind === "property"
                                    ? "No matching properties"
                                    : "No matching contacts"}
                            </p>
                        ) : mention.kind === "property" ? (
                            propertyOptions.map((option, index) => (
                                <button
                                    key={option.id}
                                    id={`${listIdAttr}-${index}`}
                                    type="button"
                                    role="option"
                                    aria-selected={index === activeIndex}
                                    className={styles.smartMenuItem}
                                    data-active={index === activeIndex || undefined}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => applyProperty(option)}
                                >
                                    <Hash aria-hidden size={14} />
                                    <span>
                                        <strong>{option.title}</strong>
                                        {option.detail && <small>{option.detail}</small>}
                                    </span>
                                </button>
                            ))
                        ) : (
                            contactOptions.map((option, index) => (
                                <button
                                    key={`${option.kind}-${option.id}`}
                                    id={`${listIdAttr}-${index}`}
                                    type="button"
                                    role="option"
                                    aria-selected={index === activeIndex}
                                    className={styles.smartMenuItem}
                                    data-active={index === activeIndex || undefined}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => applyContact(option)}
                                >
                                    <UserRound aria-hidden size={14} />
                                    <span>
                                        <strong>{option.name}</strong>
                                        <small>{option.label}</small>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
            <button
                type="submit"
                className={styles.addButton}
                disabled={busy || !canSubmit || title.length > TITLE_MAX}
                aria-label={editing ? "Save task" : "Add task"}
            >
                <Plus aria-hidden size={16} strokeWidth={2.5} />
            </button>
        </form>
    );
}
