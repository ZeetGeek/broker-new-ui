"use client";

import {
    type ChangeEvent,
    type KeyboardEvent,
    type ReactNode,
    type SyntheticEvent,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react";

import { Check, Hash, Plus, UserRound } from "@/components/shared/icons";

import { type Task, taskDateLabel } from "./model";
import type { PlannerTaskExtras } from "./planner-model";
import type { TaskQuickChange } from "./quick-actions";
import {
    changeQuickAddText,
    diffText,
    dismissQuickAddRange,
    insertQuickAddEntity,
    newQuickAddDraft,
    type QuickAddDraft,
    quickAddDraftFromTask,
    type QuickAddValues,
    resolveQuickAddValues,
} from "./quick-add-draft";
import {
    findQuickAddMention,
    parseQuickAdd,
    type QuickAddCatalogs,
    quickAddContactOptions,
    type QuickAddHighlightKind,
    type QuickAddMention,
    type QuickAddOption,
    quickAddPropertyOptions,
    type QuickAddRange,
} from "./quick-add-parse";

import styles from "./quick-add.module.css";

const TITLE_LIMIT = 160;
const TEXT_LIMIT = 320;
/** The counter stays out of the way until the name is this close to the limit. */
const COUNTER_FROM = TITLE_LIMIT - 20;

export type QuickAddComposerProps = {
    /** Day this composer adds to; null for Someday lists. */
    date: string | null;
    listId?: string;
    listName?: string;
    busy: boolean;
    now: number;
    catalogs: QuickAddCatalogs;
    /** Present when editing a task inline. */
    task?: Task;
    onAdd?: (
        title: string,
        date: string | null,
        listId?: string,
        extras?: PlannerTaskExtras,
    ) => Promise<boolean>;
    /** Inline edit save; an empty title means delete. */
    onSave?: (change: TaskQuickChange) => Promise<boolean>;
    /** Inline edit finished; `restoreFocus` is false when the user clicked away. */
    onClose?: (restoreFocus: boolean) => void;
};

type Submission = { draft: QuickAddDraft; values: QuickAddValues; restoreFocus: boolean };
type Mark = QuickAddRange & { kind: QuickAddHighlightKind | "mention" };

const sameNumbers = (a: readonly number[], b: readonly number[]) =>
    a.length === b.length && a.every((value) => b.includes(value));

function taskChange(task: Task, values: QuickAddValues): TaskQuickChange {
    const change: TaskQuickChange = {};
    if (values.title !== task.title) change.title = values.title;
    if (values.date !== task.dueDate) change.dueDate = values.date;
    if (values.time !== (task.dueDate ? task.dueTime : null)) change.dueTime = values.time;
    if (JSON.stringify(values.repeat) !== JSON.stringify(task.repeat ?? null))
        change.repeat = values.repeat;
    const priority = values.priority ?? "low";
    if (priority !== task.priority) {
        change.priority = priority;
        change.priorityAt = null;
    }
    if (!sameNumbers(values.reminders, task.reminders)) change.reminders = values.reminders;
    if (values.propertyId !== task.propertyId) change.propertyId = values.propertyId;
    if (values.clientId !== task.clientId) change.clientId = values.clientId;
    if (values.ownerId !== (task.ownerId ?? null)) change.ownerId = values.ownerId;
    return change;
}

function mirrorText(text: string, marks: readonly Mark[]): ReactNode[] {
    const nodes: ReactNode[] = [];
    let cursor = 0;
    marks.forEach((mark, index) => {
        if (mark.start > cursor) nodes.push(text.slice(cursor, mark.start));
        nodes.push(
            <mark key={index} className={styles.mark} data-kind={mark.kind}>
                {text.slice(mark.start, mark.end)}
            </mark>,
        );
        cursor = mark.end;
    });
    // The trailing zero-width space keeps a final empty line the same height as the field.
    nodes.push(text.slice(cursor), "\u200b");
    return nodes;
}

/**
 * Todoist-style quick add on one native textarea: words like “tomorrow 5pm p1”
 * are highlighted in a mirror layer underneath and saved as task fields.
 */
export function QuickAddComposer({
    date,
    listId,
    listName,
    busy,
    now,
    catalogs,
    task,
    onAdd,
    onSave,
    onClose,
}: QuickAddComposerProps) {
    const editing = !!task;
    const id = useId();
    const listboxId = `${id}-options`;
    const helpId = `${id}-help`;
    const formRef = useRef<HTMLFormElement>(null);
    const fieldRef = useRef<HTMLTextAreaElement>(null);
    const selectionRef = useRef<QuickAddRange>({ start: 0, end: 0 });
    const pendingCaretRef = useRef<number | null>(null);
    const composingRef = useRef(false);
    const focusedAtPressRef = useRef(false);
    const blurTimerRef = useRef<number | undefined>(undefined);
    const queuedRef = useRef<Submission | null>(null);
    const savingRef = useRef(false);

    const [draft, setDraft] = useState(() =>
        task ? quickAddDraftFromTask(task, now, catalogs) : newQuickAddDraft(date),
    );
    const [caret, setCaret] = useState(draft.text.length);
    const [active, setActive] = useState(editing);
    const [optionIndex, setOptionIndex] = useState(0);
    const [hint, setHint] = useState("");

    const candidate = active
        ? findQuickAddMention(draft.text, caret, draft.entities, draft.closedMention)
        : null;
    const options = candidate
        ? candidate.kind === "property"
            ? quickAddPropertyOptions(catalogs, candidate.query)
            : quickAddContactOptions(catalogs, candidate.query)
        : [];
    // A search with spaces and no matches is ordinary words again.
    const mention =
        candidate && (options.length > 0 || !/\s/.test(candidate.query)) ? candidate : null;
    const activeOption = options.length ? Math.min(optionIndex, options.length - 1) : -1;
    const parse = parseQuickAdd(draft.text, {
        now,
        baseDate: draft.base.date,
        entities: draft.entities,
        dismissed: draft.dismissed,
        mention,
    });
    const values = resolveQuickAddValues(draft, parse);
    // Saved title keeps chips in place; emptiness still ignores pure detail words.
    const bareTitle = parse.title;
    const tooLong = values.title.length > TITLE_LIMIT;
    const marks: Mark[] = [
        ...parse.highlights,
        ...(mention ? [{ start: mention.start, end: mention.end, kind: "mention" as const }] : []),
    ].sort((a, b) => a.start - b.start);

    useLayoutEffect(() => {
        const target = pendingCaretRef.current;
        const field = fieldRef.current;
        if (target === null || !field) return;
        pendingCaretRef.current = null;
        field.setSelectionRange(target, target);
    });

    // Layout timing keeps focus inside the tap that opened the editor, so Android shows the keyboard.
    useLayoutEffect(() => {
        if (!editing) return;
        const field = fieldRef.current;
        if (!field) return;
        const end = field.value.length;
        field.focus({ preventScroll: true });
        field.setSelectionRange(end, end);
        selectionRef.current = { start: end, end };
    }, [editing]);

    useEffect(() => () => window.clearTimeout(blurTimerRef.current), []);

    const resetDraft = () => {
        setDraft(newQuickAddDraft(date));
        setCaret(0);
        selectionRef.current = { start: 0, end: 0 };
        pendingCaretRef.current = 0;
    };

    const commit = async ({ draft: sent, values: saved, restoreFocus }: Submission) => {
        savingRef.current = true;
        try {
            if (task) {
                const change = sent.text.trim() ? taskChange(task, saved) : { title: "" };
                if (!Object.keys(change).length) {
                    onClose?.(restoreFocus);
                    return;
                }
                if (await onSave?.(change)) onClose?.(restoreFocus);
                else setHint("Couldn’t save this change. Try again.");
                return;
            }
            const added = await onAdd?.(saved.title, saved.date, listId, {
                priority: saved.priority ?? "low",
                priorityAt: null,
                dueTime: saved.time,
                repeat: saved.repeat,
                reminders: saved.reminders,
                clientId: saved.clientId,
                ownerId: saved.ownerId,
                propertyId: saved.propertyId,
            });
            if (!added) {
                // Put the words back unless the user has already started the next task.
                if (!fieldRef.current?.value) {
                    setDraft(sent);
                    setCaret(sent.text.length);
                    pendingCaretRef.current = sent.text.length;
                }
                setHint("Couldn’t add this task. Try again.");
                return;
            }
            setHint(
                saved.date === date
                    ? ""
                    : saved.date
                      ? `Added to ${taskDateLabel(saved.date, now)}`
                      : "Added without a date",
            );
        } finally {
            savingRef.current = false;
        }
    };

    useEffect(() => {
        if (busy || !queuedRef.current) return;
        const timer = window.setTimeout(() => {
            const queued = queuedRef.current;
            queuedRef.current = null;
            if (queued) void commit(queued);
        }, 0);
        return () => window.clearTimeout(timer);
    });

    const submit = (restoreFocus = true) => {
        if (savingRef.current || queuedRef.current) return;
        const text = draft.text.trim();
        if (!editing && !text) return;
        if (text && !bareTitle) {
            setHint("Add a task name — a date or tag alone can’t be a task.");
            return;
        }
        if (tooLong) {
            setHint(`Keep the task name under ${TITLE_LIMIT} characters.`);
            return;
        }
        const submission = { draft, values, restoreFocus };
        if (!editing) resetDraft();
        if (busy) {
            queuedRef.current = submission;
            setHint("Saving…");
            return;
        }
        void commit(submission);
    };

    const pick = (open: QuickAddMention, option: QuickAddOption) => {
        const result = insertQuickAddEntity(draft, open, option);
        setDraft(result.draft);
        setCaret(result.caret);
        setOptionIndex(0);
        setHint("");
        selectionRef.current = { start: result.caret, end: result.caret };
        pendingCaretRef.current = result.caret;
        fieldRef.current?.focus({ preventScroll: true });
    };

    const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        const field = event.currentTarget;
        const raw = field.value;
        const caretAfter = field.selectionEnd ?? raw.length;
        if (/[\r\n]/.test(raw)) {
            const edit = diffText(draft.text, raw, caretAfter);
            // Some Android keyboards type Enter as a newline instead of sending a key press.
            if (edit.start === edit.end && /^(\r?\n)$/.test(edit.inserted)) {
                pendingCaretRef.current = edit.start;
                submit();
                return;
            }
        }
        const next = raw.replace(/\r\n?|\n/g, " ");
        const result = changeQuickAddText(draft, next, {
            caret: caretAfter,
            previous: selectionRef.current,
            atoms: parse.atoms,
            composing: composingRef.current,
        });
        setDraft(result.draft);
        setCaret(result.caret);
        setOptionIndex(0);
        setHint("");
        selectionRef.current = { start: result.caret, end: result.caret };
        if (result.draft.text !== raw || result.caret !== caretAfter)
            pendingCaretRef.current = result.caret;
    };

    const onSelect = (event: SyntheticEvent<HTMLTextAreaElement>) => {
        const field = event.currentTarget;
        let start = field.selectionStart;
        let end = field.selectionEnd;
        if (start === end && !composingRef.current) {
            // A picked record is one unit: the caret sits before or after it, never inside.
            const inside = draft.entities.find(
                (entity) => start > entity.start && start < entity.end,
            );
            if (inside) {
                const snapped =
                    start - inside.start < inside.end - start ? inside.start : inside.end;
                field.setSelectionRange(snapped, snapped);
                start = snapped;
                end = snapped;
            }
        }
        selectionRef.current = { start, end };
        setCaret(end);
    };

    const onClick = (event: SyntheticEvent<HTMLTextAreaElement>) => {
        // Tapping into a highlighted phrase of a focused field keeps it as plain words.
        if (!focusedAtPressRef.current) return;
        const { selectionStart: start, selectionEnd: end } = event.currentTarget;
        if (start !== end) return;
        const atom = parse.atoms.find((item) => start > item.start && start < item.end);
        if (atom) setDraft((current) => dismissQuickAddRange(current, atom));
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.nativeEvent.isComposing || composingRef.current) return;
        if (mention) {
            if ((event.key === "ArrowDown" || event.key === "ArrowUp") && options.length) {
                event.preventDefault();
                const step = event.key === "ArrowDown" ? 1 : -1;
                setOptionIndex((activeOption + step + options.length) % options.length);
                return;
            }
            if ((event.key === "Enter" || event.key === "Tab") && activeOption >= 0) {
                event.preventDefault();
                pick(mention, options[activeOption]);
                return;
            }
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                setDraft((current) => ({ ...current, closedMention: mention.start }));
                return;
            }
        }
        if (event.key === "Escape") {
            event.preventDefault();
            if (editing) onClose?.(true);
            else event.currentTarget.blur();
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            submit();
        }
    };

    const leave = () => {
        setActive(false);
        if (!editing || savingRef.current || queuedRef.current) return;
        if (draft.text.trim() && bareTitle && !tooLong) submit(false);
        else onClose?.(false);
    };

    const onFocus = () => {
        window.clearTimeout(blurTimerRef.current);
        setActive(true);
    };

    const onBlur = () => {
        window.clearTimeout(blurTimerRef.current);
        blurTimerRef.current = window.setTimeout(() => {
            if (formRef.current?.contains(document.activeElement)) return;
            leave();
        }, 0);
    };

    const where = listName ?? (date ? taskDateLabel(date, now) : null);

    return (
        <form
            ref={formRef}
            className={styles.root}
            data-quick-add=""
            data-active={active || undefined}
            data-editing={editing || undefined}
            data-empty={!draft.text || undefined}
            onSubmit={(event) => {
                event.preventDefault();
                submit();
            }}
            onFocus={onFocus}
            onBlur={onBlur}
        >
            <div className={styles.body}>
                <div className={styles.field}>
                    <div className={styles.mirror} aria-hidden>
                        {draft.text ? (
                            mirrorText(draft.text, marks)
                        ) : (
                            <span className={styles.placeholder}>
                                <span data-idle>
                                    {editing
                                        ? "Task name"
                                        : "Add a task — try “tomorrow 5pm”, p1, #property, @Client, !30m"}
                                </span>
                            </span>
                        )}
                    </div>
                    <textarea
                        ref={fieldRef}
                        className={styles.input}
                        rows={1}
                        value={draft.text}
                        maxLength={TEXT_LIMIT}
                        autoComplete="off"
                        autoCapitalize="sentences"
                        enterKeyHint={editing ? "done" : "enter"}
                        aria-label={
                            editing
                                ? `Edit task: ${task.title}`
                                : `Add a task${where ? ` to ${where}` : ""}`
                        }
                        aria-describedby={helpId}
                        aria-autocomplete="list"
                        aria-controls={mention ? listboxId : undefined}
                        aria-activedescendant={
                            mention && activeOption >= 0
                                ? `${listboxId}-${activeOption}`
                                : undefined
                        }
                        onChange={onChange}
                        onSelect={onSelect}
                        onKeyDown={onKeyDown}
                        onPointerDown={(event) => {
                            focusedAtPressRef.current =
                                document.activeElement === event.currentTarget;
                        }}
                        onClick={onClick}
                        onCompositionStart={() => {
                            composingRef.current = true;
                        }}
                        onCompositionEnd={() => {
                            composingRef.current = false;
                        }}
                    />
                    {mention && (
                        <div
                            id={listboxId}
                            role="listbox"
                            aria-label={
                                mention.kind === "property" ? "Properties" : "Clients and owners"
                            }
                            className={styles.options}
                            onPointerDown={(event) => event.preventDefault()}
                        >
                            {options.length ? (
                                options.map((option, index) => (
                                    <button
                                        key={`${option.kind}-${option.id}`}
                                        id={`${listboxId}-${index}`}
                                        type="button"
                                        role="option"
                                        tabIndex={-1}
                                        aria-selected={index === activeOption}
                                        className={styles.option}
                                        data-active={index === activeOption || undefined}
                                        onPointerEnter={() => setOptionIndex(index)}
                                        onClick={() => pick(mention, option)}
                                    >
                                        {option.kind === "property" ? (
                                            <Hash aria-hidden />
                                        ) : (
                                            <UserRound aria-hidden />
                                        )}
                                        <span>
                                            <strong>{option.label}</strong>
                                            {option.detail && <small>{option.detail}</small>}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <p className={styles.optionsEmpty}>
                                    {mention.kind === "property"
                                        ? "No matching properties"
                                        : "No matching Clients or owners"}
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <p className={styles.meta} hidden={!active}>
                    {values.title.length >= COUNTER_FROM && (
                        <span data-over={tooLong || undefined}>
                            {values.title.length}/{TITLE_LIMIT}
                        </span>
                    )}
                    <span role="status">
                        {hint ||
                            (values.remindersNeedTime
                                ? "Reminders need a time — add one, like 5pm."
                                : "")}
                    </span>
                </p>
                <p id={helpId} className="sr-only">
                    Type the task name in plain words. Words like tomorrow, 5pm, every Monday, p1
                    and !30m set the date, time, repeat, priority and reminder. Type # to link a
                    property or @ to link a Client or owner. Recognised words highlight as you type
                    and are saved as task details, not as part of the title. Backspace right after a
                    highlighted phrase keeps it as plain words.
                </p>
            </div>
            <button
                type="submit"
                className={styles.submit}
                disabled={!bareTitle || tooLong}
                aria-label={editing ? "Save task" : "Add task"}
                title={editing ? "Save (Enter)" : "Add (Enter)"}
                onPointerDown={(event) => event.preventDefault()}
            >
                {editing ? <Check aria-hidden /> : <Plus aria-hidden />}
            </button>
        </form>
    );
}
