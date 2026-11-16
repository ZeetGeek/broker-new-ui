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
/* Date words stay as plain text — the planner column already owns the day. */
const TOKEN_BOUNDARY = /(?:(?:1[0-2]|0?[1-9])(?::[0-5]\d)?\s*(?:am|pm)|p[1-4])\s+/i;

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

/** Match planner preview titles: "Call Happy Elegance · Aarav Shah · 9:00 AM". */
function serializeTitle(segments: Segment[]) {
    const text = typedTitle(segments);
    let property: string | undefined;
    let contact: string | undefined;
    let time: string | undefined;
    for (const segment of segments) {
        if (segment.type !== "chip") continue;
        if (segment.kind === "property") property = segment.label;
        if (segment.kind === "client" || segment.kind === "owner") contact = segment.label;
        if (segment.kind === "time") time = segment.label;
    }

    const extras = [property, contact, time].filter((part): part is string => !!part);
    if (!text) return extras.join(" · ");
    if (!extras.length) return text;
    return `${text} · ${extras.join(" · ")}`;
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

function normalizeLabel(value: string) {
    return value.replace(/\s+/g, " ").trim();
}

function stripTrailingLabel(title: string, label: string) {
    const normalizedLabel = normalizeLabel(label);
    if (!normalizedLabel) return title;
    if (normalizeLabel(title) === normalizedLabel) return "";
    const parts = title.split(" · ");
    if (parts.length < 2) return title;
    if (normalizeLabel(parts.at(-1) ?? "") !== normalizedLabel) return title;
    return parts.slice(0, -1).join(" · ").trimEnd();
}

/** Rebuild chips from a saved task so inline edit matches smart-add. */
function segmentsFromTask(task: Task, catalogs: SmartAddCatalogs, now: number): Segment[] {
    const original = task.title;
    let text = original;
    if (task.dueTime) text = stripTrailingLabel(text, smartTimeChipLabel(task.dueTime));
    const client = task.clientId
        ? catalogs.clients.find((item) => item.id === task.clientId)
        : undefined;
    const owner = task.ownerId
        ? catalogs.owners.find((item) => item.id === task.ownerId)
        : undefined;
    const property = task.propertyId
        ? catalogs.properties.find((item) => item.id === task.propertyId)
        : undefined;
    if (client) text = stripTrailingLabel(text, client.name);
    if (owner) text = stripTrailingLabel(text, owner.name);
    if (property) text = stripTrailingLabel(text, property.title);

    const chips: Segment[] = [];
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
    if (task.priority !== "low") {
        chips.push({
            id: newId(),
            type: "chip",
            kind: "priority",
            label: SMART_PRIORITY_CHIP[task.priority],
            value: task.priority,
        });
    }
    // If stripping failed, keep the original title so edit never opens blank.
    if (!text.trim() && chips.length === 0 && original.trim()) text = original;
    return normalizeSegments([
        ...(text ? [{ id: newId(), type: "text" as const, value: text }] : []),
        ...chips,
    ]);
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
    const inputRefs = useRef(new Map<string, HTMLInputElement>());
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
        const { parts } = splitSmartInlineParts(value, now, { includeDates: false });
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

    const updateText = (segmentId: string, value: string) => {
        if (TOKEN_BOUNDARY.test(value) && !parseTrailingMention(value)) {
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

    const removeChip = (chipId: string, caret: "start" | "end" = "end") => {
        setSegments((current) => {
            const index = current.findIndex((segment) => segment.id === chipId);
            if (index < 0) return current;
            const before = current[index - 1];
            const after = current[index + 1];
            let left = current.slice(0, index);
            let right = current.slice(index + 1);
            if (
                before?.type === "text" &&
                after?.type === "text" &&
                before.value &&
                after.value &&
                !/\s$/.test(before.value) &&
                !/^\s/.test(after.value)
            ) {
                left = [...left.slice(0, -1), { ...before, value: `${before.value} ` }];
            }
            const next = normalizeSegments([...left, ...right]);
            const focusId =
                (caret === "start"
                    ? next.slice(Math.max(0, index - 1)).find((segment) => segment.type === "text")
                    : [...next.slice(0, Math.min(index, next.length))]
                          .reverse()
                          .find((segment) => segment.type === "text")
                )?.id ?? next.find((segment) => segment.type === "text")?.id;
            if (focusId) {
                setActiveId(focusId);
                requestAnimationFrame(() => {
                    const field = inputRefs.current.get(focusId);
                    if (!field) return;
                    field.focus();
                    const pos = caret === "start" ? 0 : field.value.length;
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
                return partsToSegments(
                    splitSmartInlineParts(segment.value, now, { includeDates: false }).parts,
                );
            }),
        );
        const clean = serializeTitle(flushed);
        if (clean.length > 160) return;
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
                    dueTime: payload.dueTime ?? null,
                    clientId: payload.clientId,
                    ownerId: payload.ownerId,
                    propertyId: payload.propertyId,
                });
                if (saved) onCancel?.();
            } else {
                const saved = await onAdd?.(clean, date, listId, {
                    priority: payload.priority,
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

    const onTextKeyDown = (event: KeyboardEvent<HTMLInputElement>, segment: TextSegment) => {
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
        if (event.key === "Enter" && !event.shiftKey) {
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
                    removeChip(previous.id, segment.value ? "start" : "end");
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
                    data-empty={!editing && empty ? true : undefined}
                    data-needs-title={needsTitle || undefined}
                    onClick={() => {
                        const last = segments.filter((segment) => segment.type === "text").at(-1);
                        if (last) focusSegment(last.id, "end");
                    }}
                >
                    <span className={styles.smartInputLine}>
                        {empty && !editing && (
                            <span className={styles.smartPlaceholder} aria-hidden="true">
                                <span>Task name — try 9am, p1</span>
                                <span>#property or @client</span>
                            </span>
                        )}
                        {segments.map((segment) =>
                            segment.type === "text" ? (
                                <input
                                    key={segment.id}
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
                                    size={Math.max(
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
                        {title.length}/160
                        {title.length >= 160 ? " · Limit reached" : " characters"}
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
                disabled={busy || !canSubmit || title.length > 160}
                aria-label={editing ? "Save task" : "Add task"}
            >
                <Plus aria-hidden size={16} strokeWidth={2.5} />
            </button>
        </form>
    );
}
