"use client";

import {
    type ChangeEvent,
    type KeyboardEvent,
    type ReactNode,
    type SyntheticEvent,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { Check, Plus } from "@/components/shared/icons";
import {
    mapTaskClientToPicker,
    mapTaskOwnerToPicker,
} from "@/components/shared/map-to-people-picker-person";
import { mapTaskPropertyToPicker } from "@/components/shared/map-to-property-picker-property";
import type { PeopleInlineScope } from "@/components/shared/people-inline-select";
import { PeopleOptionRow } from "@/components/shared/people-option-row";
import {
    type PropertyInlineScope,
    PropertyInlineSuggestions,
} from "@/components/shared/property-inline-select";
import {
    propertyMatchesLookingFor,
    propertyMatchesQuery,
} from "@/components/shared/property-picker-meta";
import { SlidingTabs } from "@/components/shared/sliding-tabs";

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
    syncQuickAddEntities,
} from "./quick-add-draft";
import { QuickAddHelp } from "./quick-add-help";
import {
    findQuickAddMention,
    parseQuickAdd,
    type QuickAddCatalogs,
    quickAddContactOptions,
    type QuickAddHighlightKind,
    type QuickAddMention,
    type QuickAddOption,
    type QuickAddRange,
} from "./quick-add-parse";

import styles from "./quick-add.module.css";

const TITLE_LIMIT = 160;
const TEXT_LIMIT = 320;
/** The counter stays out of the way until the name is this close to the limit. */
const COUNTER_FROM = TITLE_LIMIT - 20;
const UNDO_LIMIT = 50;

type DraftSnapshot = { draft: QuickAddDraft; caret: number };

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
    if (values.startDate !== task.startDate) change.startDate = values.startDate;
    if (values.startTime !== (task.startTime ?? null)) change.startTime = values.startTime;
    if (values.dueDate !== task.dueDate) change.dueDate = values.dueDate;
    if (values.dueTime !== task.dueTime) change.dueTime = values.dueTime;
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

function mirrorText(
    text: string,
    marks: readonly Mark[],
    invalidRanges: readonly QuickAddRange[] = [],
): ReactNode[] {
    const nodes: ReactNode[] = [];
    let cursor = 0;
    marks.forEach((mark, index) => {
        if (mark.start > cursor) nodes.push(text.slice(cursor, mark.start));
        const invalid = invalidRanges.some(
            (range) => range.start === mark.start && range.end === mark.end,
        );
        nodes.push(
            <mark
                key={index}
                className={styles.mark}
                data-kind={mark.kind}
                data-invalid={invalid || undefined}
            >
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
    const historyRef = useRef<{ past: DraftSnapshot[]; future: DraftSnapshot[] }>({
        past: [],
        future: [],
    });
    const helpOpenRef = useRef(false);

    const [draft, setDraft] = useState(() =>
        task ? quickAddDraftFromTask(task, now, catalogs) : newQuickAddDraft(date),
    );
    const [caret, setCaret] = useState(draft.text.length);
    const [active, setActive] = useState(editing);
    const [peopleScopeState, setPeopleScopeState] = useState<{
        mentionStart: number | null;
        scope: PeopleInlineScope;
    }>({ mentionStart: null, scope: "all" });
    const [optionNav, setOptionNav] = useState<{ key: string; index: number }>({
        key: "",
        index: 0,
    });
    const [hint, setHint] = useState("");
    const optionsListRef = useRef<HTMLDivElement>(null);
    const [propertyScopeState, setPropertyScopeState] = useState<{
        mentionStart: number | null;
        scope: PropertyInlineScope;
    }>({ mentionStart: null, scope: "all" });
    const propertyRows = useMemo(
        () => catalogs.properties.map(mapTaskPropertyToPicker),
        [catalogs.properties],
    );

    const candidate = active
        ? findQuickAddMention(draft.text, caret, draft.entities, draft.closedMention)
        : null;
    const contactOptions = candidate
        ? candidate.kind === "property"
            ? []
            : quickAddContactOptions(catalogs, candidate.query)
        : [];
    // Scope resets automatically when a new @ mention opens (different start index).
    const peopleScope =
        candidate &&
        candidate.kind !== "property" &&
        peopleScopeState.mentionStart === candidate.start
            ? peopleScopeState.scope
            : "all";
    const propertyScope =
        candidate?.kind === "property" && propertyScopeState.mentionStart === candidate.start
            ? propertyScopeState.scope
            : "all";
    const filteredProperties =
        candidate?.kind === "property"
            ? propertyRows.filter(
                  (property) =>
                      (propertyScope === "all" ||
                          propertyMatchesLookingFor(property, propertyScope)) &&
                      propertyMatchesQuery(property, candidate.query.trim().toLowerCase()),
              )
            : [];
    const options: QuickAddOption[] = !candidate
        ? []
        : candidate.kind === "property"
          ? filteredProperties.map((property) => ({
                kind: "property",
                id: property.id,
                label: property.title,
                detail: "",
            }))
          : peopleScope === "all"
            ? contactOptions
            : contactOptions.filter((option) => option.kind === peopleScope);
    // A search with spaces and no matches is ordinary words again.
    const mention =
        candidate &&
        (contactOptions.length > 0 ||
            options.length > 0 ||
            candidate.kind === "property" ||
            !/\s/.test(candidate.query))
            ? candidate
            : null;
    const optionNavKey = `${mention?.kind ?? ""}:${mention?.start ?? ""}:${peopleScope}:${propertyScope}:${candidate?.query ?? ""}`;
    const propertyMention = mention?.kind === "property" ? mention : null;
    const optionIndex = optionNav.key === optionNavKey ? optionNav.index : 0;
    const setOptionIndex = (next: number | ((current: number) => number)) => {
        setOptionNav((current) => {
            const base = current.key === optionNavKey ? current.index : 0;
            return {
                key: optionNavKey,
                index: typeof next === "function" ? next(base) : next,
            };
        });
    };
    const setPeopleScope = (scope: PeopleInlineScope) => {
        if (!candidate || candidate.kind === "property") return;
        setPeopleScopeState({ mentionStart: candidate.start, scope });
        setOptionNav({
            key: `${candidate.kind}:${candidate.start}:${scope}:all:${candidate.query}`,
            index: 0,
        });
    };
    const activeOption = options.length ? Math.min(optionIndex, options.length - 1) : -1;
    const parse = parseQuickAdd(draft.text, {
        now,
        baseDate: draft.base.startDate,
        entities: draft.entities,
        dismissed: draft.dismissed,
        mention,
    });
    const values = resolveQuickAddValues(draft, parse, now);
    // Saved title keeps chips in place; emptiness still ignores pure detail words.
    const bareTitle = parse.title;
    const tooLong = values.title.length > TITLE_LIMIT;
    const marks: Mark[] = [
        ...parse.highlights,
        ...(mention ? [{ start: mention.start, end: mention.end, kind: "mention" as const }] : []),
    ].sort((a, b) => a.start - b.start);
    const invalidChipRanges = [
        ...values.scheduleIssues,
        ...values.dueIssues,
        ...values.reminderIssues,
    ];

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

    useLayoutEffect(() => {
        if (activeOption < 0) return;
        const root = optionsListRef.current;
        const el = root?.querySelector<HTMLElement>(`[data-option-index="${activeOption}"]`);
        el?.scrollIntoView({ block: "nearest" });
    }, [activeOption]);

    const resetDraft = () => {
        historyRef.current = { past: [], future: [] };
        setDraft(newQuickAddDraft(date));
        setCaret(0);
        selectionRef.current = { start: 0, end: 0 };
        pendingCaretRef.current = 0;
        setPeopleScopeState({ mentionStart: null, scope: "all" });
        setPropertyScopeState({ mentionStart: null, scope: "all" });
        setOptionNav({ key: "", index: 0 });
    };

    const remember = (snapshot: DraftSnapshot) => {
        const { past } = historyRef.current;
        past.push(snapshot);
        if (past.length > UNDO_LIMIT) past.shift();
        historyRef.current.future = [];
    };

    const restore = (snapshot: DraftSnapshot) => {
        setDraft(snapshot.draft);
        setCaret(snapshot.caret);
        setOptionNav({ key: "", index: 0 });
        setPeopleScopeState({ mentionStart: null, scope: "all" });
        setPropertyScopeState({ mentionStart: null, scope: "all" });
        setHint("");
        selectionRef.current = { start: snapshot.caret, end: snapshot.caret };
        pendingCaretRef.current = snapshot.caret;
    };

    const undo = () => {
        const { past, future } = historyRef.current;
        const previous = past.pop();
        if (!previous) return;
        future.push({ draft, caret });
        restore(previous);
    };

    const redo = () => {
        const { past, future } = historyRef.current;
        const next = future.pop();
        if (!next) return;
        past.push({ draft, caret });
        restore(next);
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
            const added = await onAdd?.(saved.title, saved.startDate, listId, {
                priority: saved.priority ?? "low",
                priorityAt: null,
                startTime: saved.startTime,
                dueDate: saved.dueDate,
                dueTime: saved.dueTime,
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
        remember({ draft, caret });
        const result = insertQuickAddEntity(draft, open, option);
        setDraft(result.draft);
        setCaret(result.caret);
        setOptionIndex(0);
        setPropertyScopeState({ mentionStart: null, scope: "all" });
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
        remember({ draft, caret });
        const result = changeQuickAddText(draft, next, {
            caret: caretAfter,
            previous: selectionRef.current,
            atoms: parse.atoms,
            composing: composingRef.current,
        });
        // Paste (and any free-form edit) re-links `#` / `@` tokens from the catalogs.
        const synced = syncQuickAddEntities(result.draft, catalogs);
        setDraft(synced);
        setCaret(result.caret);
        setOptionIndex(0);
        setHint("");
        selectionRef.current = { start: result.caret, end: result.caret };
        if (synced.text !== raw || result.caret !== caretAfter)
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
        if (atom) {
            remember({ draft, caret });
            setDraft((current) => dismissQuickAddRange(current, atom));
        }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.nativeEvent.isComposing || composingRef.current) return;
        const mod = event.ctrlKey || event.metaKey;
        if (mod && event.key.toLowerCase() === "z" && !event.altKey) {
            event.preventDefault();
            if (event.shiftKey) redo();
            else undo();
            return;
        }
        if (mod && event.key.toLowerCase() === "y" && !event.altKey) {
            event.preventDefault();
            redo();
            return;
        }
        if (mention) {
            if ((event.key === "ArrowDown" || event.key === "ArrowUp") && options.length) {
                event.preventDefault();
                event.stopPropagation();
                const step = event.key === "ArrowDown" ? 1 : -1;
                setOptionIndex(
                    (current) =>
                        (Math.min(current, options.length - 1) + step + options.length) %
                        options.length,
                );
                return;
            }
            if ((event.key === "Enter" || event.key === "Tab") && activeOption >= 0) {
                event.preventDefault();
                event.stopPropagation();
                pick(mention, options[activeOption]!);
                return;
            }
            if (event.key === "Enter") {
                event.preventDefault();
                return;
            }
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                setDraft((current) => ({ ...current, closedMention: mention.start }));
                setPropertyScopeState({ mentionStart: null, scope: "all" });
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
            if (helpOpenRef.current || formRef.current?.contains(document.activeElement)) return;
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
                            mirrorText(draft.text, marks, invalidChipRanges)
                        ) : (
                            <span className={styles.placeholder}>
                                <span data-idle>{editing ? "Task name" : "What’s next?"}</span>
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
                        spellCheck={false}
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
                    {propertyMention && (
                        <PropertyInlineSuggestions
                            className={styles.propertyOptions}
                            properties={filteredProperties}
                            scope={propertyScope}
                            onScopeChange={(scope) =>
                                setPropertyScopeState({
                                    mentionStart: propertyMention.start,
                                    scope,
                                })
                            }
                            listId={listboxId}
                            listRef={optionsListRef}
                            activeIndex={activeOption}
                            onActiveIndexChange={setOptionIndex}
                            selectedId={values.propertyId}
                            onSelect={(id) => {
                                const option = options.find((item) => item.id === id);
                                if (option) pick(propertyMention, option);
                            }}
                        />
                    )}
                    {mention && !propertyMention && (
                        <div
                            className={styles.peopleOptions}
                            onPointerDown={(event) => event.preventDefault()}
                        >
                            <div className={styles.peopleTabs}>
                                <SlidingTabs
                                    label="Filter people by role"
                                    value={peopleScope}
                                    onValueChange={setPeopleScope}
                                    className="self-start"
                                    height={32}
                                    options={[
                                        { value: "all", label: "All" },
                                        { value: "client", label: "Clients" },
                                        { value: "owner", label: "Owners" },
                                    ]}
                                />
                            </div>
                            <div
                                id={listboxId}
                                ref={optionsListRef}
                                role="listbox"
                                aria-label="Clients and owners"
                                className={styles.peopleList}
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
                                            data-option-index={index}
                                            className={styles.peopleOption}
                                            data-active={index === activeOption || undefined}
                                            onPointerEnter={() => setOptionIndex(index)}
                                            onClick={() => pick(mention, option)}
                                        >
                                            <PeopleOptionRow
                                                person={
                                                    option.kind === "owner"
                                                        ? mapTaskOwnerToPicker({
                                                              id: option.id,
                                                              name: option.label,
                                                              type: option.type,
                                                              phoneDigits: option.phoneDigits,
                                                          })
                                                        : mapTaskClientToPicker({
                                                              id: option.id,
                                                              name: option.label,
                                                              type: option.type,
                                                              phoneDigits: option.phoneDigits,
                                                          })
                                                }
                                                showRolePip
                                            />
                                        </button>
                                    ))
                                ) : (
                                    <p className={styles.optionsEmpty}>
                                        {peopleScope === "client"
                                            ? "No matching clients"
                                            : peopleScope === "owner"
                                              ? "No matching owners"
                                              : "No matching Clients or owners"}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <p className={styles.meta} hidden={!active}>
                    <QuickAddHelp
                        fieldRef={fieldRef}
                        onOpenChange={(open) => {
                            helpOpenRef.current = open;
                        }}
                    />
                    {values.title.length >= COUNTER_FROM && (
                        <span data-over={tooLong || undefined}>
                            {values.title.length}/{TITLE_LIMIT}
                        </span>
                    )}
                    <span
                        role="status"
                        data-error={
                            values.dueError || values.scheduleError || values.reminderError
                                ? ""
                                : undefined
                        }
                    >
                        {hint || values.dueError || values.scheduleError || values.reminderError}
                    </span>
                </p>
                <p id={helpId} className="sr-only">
                    Type the task name in plain words. Open Shortcuts for date, time, priority,
                    property, Client, reminder and repeat tips. Ctrl+Z undoes a change.
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
