"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import { AppDatePicker } from "@/components/shared/app-date-picker";
import { AppDateTimePicker } from "@/components/shared/app-date-time-picker";
import { AppImage } from "@/components/shared/app-image";
import { filterChipClassName } from "@/components/shared/filter-chip";
import {
    ArrowDownUp,
    Bell,
    Building2,
    CalendarClock,
    ChevronDown,
    Link2,
    LockKeyhole,
    Repeat,
    UserRound,
} from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
    draftFromTask,
    newTaskDraft,
    type Task,
    TASK_PRIORITY_LABELS,
    taskDateKey,
    type TaskDraft,
    taskReminderAt,
    validateTaskDraft,
} from "./model";
import { TASK_CLIENTS, TASK_OWNERS, TASK_PROPERTIES } from "./preview-store";
import { type TaskRepeat, taskRepeatLabel, taskWeekday, WEEKDAYS } from "./recurrence";
import { TaskPanel } from "./task-panel";
import { TaskReminderPicker } from "./task-reminder-picker";

import styles from "./task-form.module.css";

export function TaskSelect({
    label,
    value,
    options,
    onChange,
    disabled = false,
    toolbar = false,
    entity,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    disabled?: boolean;
    toolbar?: boolean;
    entity?: "client" | "owner" | "property";
}) {
    const id = useId();
    if (toolbar) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <button
                            type="button"
                            disabled={disabled}
                            aria-label={`${label}: ${options.find((option) => option.value === value)?.label ?? value}`}
                            className={filterChipClassName(true)}
                        />
                    }
                >
                    <ArrowDownUp aria-hidden className="text-brand block-4 inline-4" />
                    <span>{options.find((option) => option.value === value)?.label ?? value}</span>
                    <ChevronDown aria-hidden className="opacity-60 block-3.5 inline-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-inline-44">
                    {options.map((option) => (
                        <DropdownMenuItem
                            key={option.value}
                            onClick={() => onChange(option.value)}
                            className={
                                value === option.value ? "font-semibold text-brand" : undefined
                            }
                        >
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }
    if (entity) {
        const labelFor = (item: string) =>
            options.find((option) => option.value === item)?.label ?? "";
        return (
            <div className={styles.field}>
                <label htmlFor={id} className={styles.label}>
                    {label}
                </label>
                <Combobox
                    items={options.map((option) => option.value)}
                    value={value || null}
                    disabled={disabled}
                    itemToStringLabel={labelFor}
                    onValueChange={(next: string | null) => onChange(next ?? "")}
                >
                    <ComboboxInput
                        id={id}
                        size="lg"
                        className="font-normal"
                        startIcon={entity === "property" ? Building2 : UserRound}
                        placeholder={`Select ${entity === "owner" ? "an" : "a"} ${entity}`}
                        disabled={disabled}
                    />
                    <ComboboxContent
                        align="center"
                        className="inline-[min(26rem,calc(100dvw-2rem))]"
                    >
                        <ComboboxEmpty>No matching records. Try another search.</ComboboxEmpty>
                        <ComboboxList className="py-2 max-block-[min(20rem,var(--available-height))]">
                            {(item: string) => {
                                const property =
                                    entity === "property"
                                        ? TASK_PROPERTIES.find((p) => p.id === item)
                                        : undefined;
                                return (
                                    <ComboboxItem key={item || "none"} value={item}>
                                        <span className={styles.entityOption}>
                                            {item && entity !== "property" ? (
                                                <UserAvatar name={labelFor(item)} size="sm" />
                                            ) : (
                                                <span className={styles.entityIcon}>
                                                    <Building2 aria-hidden />
                                                    {property?.imageUrl && (
                                                        <AppImage
                                                            src={property.imageUrl}
                                                            alt=""
                                                            fill
                                                            sizes="40px"
                                                        />
                                                    )}
                                                </span>
                                            )}
                                            <span>
                                                {labelFor(item)}
                                                {property && (
                                                    <small>
                                                        {property.configLabel} · {property.city}
                                                    </small>
                                                )}
                                            </span>
                                        </span>
                                    </ComboboxItem>
                                );
                            }}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
            </div>
        );
    }
    return (
        <div className={styles.field}>
            <label htmlFor={id} className={styles.label}>
                {label}
            </label>
            <Select
                items={options}
                value={value}
                disabled={disabled}
                onValueChange={(next) => next !== null && onChange(next)}
            >
                <SelectTrigger id={id} size="lg" className="inline-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value || "none"} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export function TaskForm({
    task,
    mode,
    busy,
    onSave,
    onClose,
    error,
    prefill,
}: {
    task?: Task;
    mode: "create" | "edit" | "reschedule" | "reminder";
    busy: boolean;
    onSave: (draft: TaskDraft) => Promise<void>;
    onClose: () => void;
    error?: string;
    prefill?: Partial<TaskDraft>;
}) {
    const formId = useId();
    const titleRef = useRef<HTMLInputElement>(null);
    const [initial] = useState(() =>
        task ? draftFromTask(task) : { ...newTaskDraft(), ...prefill },
    );
    const [draft, setDraft] = useState<TaskDraft>(initial);
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 15_000);
        return () => window.clearInterval(timer);
    }, []);
    const [submitted, setSubmitted] = useState(false);
    const [saveError, setSaveError] = useState("");
    const fullForm = mode === "create" || mode === "edit";
    const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
    const patch = (next: Partial<TaskDraft>) => {
        setDraft((current) => ({ ...current, ...next }));
        setSaveError("");
    };
    const validation = validateTaskDraft(draft);
    const scheduleChanged = draft.dueDate !== initial.dueDate || draft.dueTime !== initial.dueTime;
    const hasNewPastReminder = (atTime: number) =>
        draft.reminders.some((minutes) => {
            const at = taskReminderAt(draft, minutes);
            const unchanged = !scheduleChanged && initial.reminders.includes(minutes);
            return at !== null && Date.parse(at) <= atTime && !unchanged;
        });
    const pastReminder = hasNewPastReminder(now);
    const setDate = (date: string | null) =>
        patch(date ? { dueDate: date } : { dueDate: "", dueTime: "", reminders: [] });
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy) return;
        setSubmitted(true);
        setSaveError("");
        const reminderHasPassed = hasNewPastReminder(Date.now());
        if (!validation.valid || reminderHasPassed) {
            setNow(Date.now());
            if (validation.errors.title) titleRef.current?.focus();
            else {
                const form = event.currentTarget;
                requestAnimationFrame(() =>
                    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
                );
            }
            return;
        }
        try {
            await onSave(draft);
        } catch {
            setSaveError("Your task couldn’t be saved. Your changes are still here; try again.");
        }
    };
    const title = {
        create: "Add task",
        edit: "Edit task",
        reschedule: "Reschedule task",
        reminder: "Task reminders",
    }[mode];
    const description = {
        create: "Start with the next small step. Add a date or a reminder when you need one.",
        edit: "Keep the details useful and your next step clear.",
        reschedule: "Choose a new date and time. All times are in India time (IST).",
        reminder: "Add one or more reminders, including your own custom times.",
    }[mode];
    const primary = mode === "create" ? "Create task" : "Save changes";
    return (
        <TaskPanel
            title={title}
            description={description}
            onClose={onClose}
            busy={busy}
            dirty={dirty}
            footer={(close) => (
                <div className={styles.discardActions}>
                    <Button variant="outline" disabled={busy} onClick={close}>
                        Cancel
                    </Button>
                    <Button
                        variant="accent"
                        type="submit"
                        form={formId}
                        disabled={busy}
                        loading={busy}
                    >
                        {primary}
                    </Button>
                </div>
            )}
        >
            <form id={formId} onSubmit={submit} className={styles.form} noValidate>
                {!fullForm && task ? (
                    <div className={styles.summary}>
                        <strong>{task.title}</strong>
                        {task.details ? <p className={styles.hint}>{task.details}</p> : null}
                    </div>
                ) : null}
                {fullForm ? (
                    <section className={styles.section} aria-label="Task details">
                        <div className={styles.field}>
                            <label htmlFor={`${formId}-title`} className={styles.label}>
                                Task name <span aria-hidden="true">*</span>
                            </label>
                            <Input
                                ref={titleRef}
                                id={`${formId}-title`}
                                name="title"
                                value={draft.title}
                                onValueChange={(title) => patch({ title })}
                                placeholder="e.g. Call Aarav about the Vesu shortlist"
                                size="lg"
                                maxLength={160}
                                disabled={busy}
                                required
                                autoComplete="off"
                                errorText={submitted ? validation.errors.title : undefined}
                            />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor={`${formId}-details`} className={styles.label}>
                                Details <span className={styles.optional}>(optional)</span>
                            </label>
                            <Textarea
                                id={`${formId}-details`}
                                name="details"
                                value={draft.details}
                                onChange={(event) => patch({ details: event.target.value })}
                                placeholder="Anything you’ll want to remember when you pick this up."
                                maxLength={2000}
                                rows={3}
                                disabled={busy}
                                className={styles.notesInput}
                                aria-invalid={submitted && !!validation.errors.details}
                            />
                            {submitted && validation.errors.details ? (
                                <p role="alert" className={styles.error}>
                                    {validation.errors.details}
                                </p>
                            ) : null}
                        </div>
                    </section>
                ) : null}
                <section className={styles.section} aria-labelledby={`${formId}-schedule`}>
                    <h2 className={styles.sectionHeading} id={`${formId}-schedule`}>
                        <CalendarClock aria-hidden="true" /> Schedule
                    </h2>
                    <div className={styles.field}>
                        <label htmlFor={`${formId}-start`} className={styles.label}>
                            Start date & time <span aria-hidden="true">*</span>
                        </label>
                        <AppDateTimePicker
                            id={`${formId}-start`}
                            aria-label="Task start date and time (IST)"
                            value={draft.startDate ? `${draft.startDate}T${draft.startTime}` : ""}
                            onChange={(value) => {
                                const [startDate = "", startTime = ""] = value.split("T");
                                patch({ startDate, startTime });
                            }}
                            disabled={busy}
                            error={
                                submitted
                                    ? validation.errors.startDate || validation.errors.startTime
                                    : undefined
                            }
                        />
                        <p className={styles.hint}>
                            A reminder at task start is included automatically. All times are IST.
                        </p>
                    </div>
                    <div className={styles.field}>
                        <div className={styles.field}>
                            <label htmlFor={`${formId}-date`} className={styles.label}>
                                Due date & time <span className={styles.optional}>(optional)</span>
                            </label>
                            <AppDateTimePicker
                                id={`${formId}-date`}
                                aria-label="Task due date and time (IST)"
                                value={draft.dueDate ? `${draft.dueDate}T${draft.dueTime}` : ""}
                                onChange={(value) => {
                                    const [dueDate = "", dueTime = ""] = value.split("T");
                                    patch({
                                        dueDate,
                                        dueTime,
                                        ...(!dueTime ? { reminders: [] } : {}),
                                    });
                                }}
                                timeOptional
                                clearable
                                disabled={busy}
                                error={
                                    submitted
                                        ? validation.errors.dueDate || validation.errors.dueTime
                                        : undefined
                                }
                            />
                        </div>
                    </div>
                    <div className={styles.shortcuts}>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            disabled={busy}
                            onClick={() => setDate(taskDateKey())}
                        >
                            Today
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            disabled={busy}
                            onClick={() => setDate(taskDateKey(Date.now() + 86_400_000))}
                        >
                            Tomorrow
                        </Button>
                        {draft.dueDate ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                disabled={busy}
                                onClick={() => setDate(null)}
                            >
                                Remove date
                            </Button>
                        ) : null}
                    </div>
                    {draft.dueDate ? (
                        <p className={styles.hint}>
                            India time (IST). Leave the time blank to do it any time that day.
                        </p>
                    ) : null}
                    {draft.dueDate && draft.dueTime ? (
                        <>
                            <TaskReminderPicker
                                reminders={draft.reminders}
                                dueDate={draft.dueDate}
                                dueTime={draft.dueTime}
                                now={now}
                                onChange={(reminders) => patch({ reminders })}
                                disabled={busy}
                            />
                            {pastReminder ? (
                                <p className={styles.error} role={submitted ? "alert" : undefined}>
                                    A reminder time has already passed. Remove it or choose a later
                                    due date and time.
                                </p>
                            ) : null}
                            {submitted && validation.errors.reminders ? (
                                <p className={styles.error} role="alert">
                                    {validation.errors.reminders}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <div className={styles.reminderHint}>
                            <Bell aria-hidden="true" />
                            <p>
                                Your task-start reminder is included. Add a due date and time to set
                                extra reminders.
                            </p>
                        </div>
                    )}
                </section>
                {mode !== "reminder" && (
                    <section className={styles.section} aria-label="Repeat task">
                        <h2 className={styles.sectionHeading}>
                            <Repeat aria-hidden />
                            Repeat task
                        </h2>
                        <TaskRepeatFields
                            value={draft.repeat}
                            anchor={draft.dueDate || draft.startDate || taskDateKey(now)}
                            onChange={(repeat) => patch({ repeat })}
                            disabled={busy}
                            error={submitted ? validation.errors.repeat : undefined}
                        />
                        <p className={styles.hint}>
                            Completing this task creates the next occurrence, keeping its links and
                            reminders. Missed dates are skipped.
                        </p>
                        {task?.completedAt ? (
                            <p className={styles.hint}>
                                Already-created occurrences keep their schedule. Edit the next open
                                task to change its future repeats.
                            </p>
                        ) : task?.repeatFromId ? (
                            <p className={styles.hint}>
                                Changes apply to this occurrence and future tasks created from it.
                            </p>
                        ) : null}
                    </section>
                )}
                {fullForm ? (
                    <>
                        <section className={styles.section} aria-labelledby={`${formId}-links`}>
                            <h2 className={styles.sectionHeading} id={`${formId}-links`}>
                                <Link2 aria-hidden="true" /> Link existing records
                                <span className={styles.optional}>(optional)</span>
                            </h2>
                            <TaskSelect
                                label="Client"
                                entity="client"
                                value={draft.clientId}
                                disabled={busy}
                                onChange={(clientId) => patch({ clientId })}
                                options={[
                                    { value: "", label: "No linked client" },
                                    ...TASK_CLIENTS.map((client) => ({
                                        value: client.id,
                                        label: client.name,
                                    })),
                                ]}
                            />
                            <TaskSelect
                                label="Owner"
                                entity="owner"
                                value={draft.ownerId}
                                disabled={busy}
                                onChange={(ownerId) => patch({ ownerId })}
                                options={[
                                    { value: "", label: "No linked owner" },
                                    ...TASK_OWNERS.map((owner) => ({
                                        value: owner.id,
                                        label: owner.name,
                                    })),
                                ]}
                            />
                            <TaskSelect
                                label="Property"
                                entity="property"
                                value={draft.propertyId}
                                disabled={busy}
                                onChange={(propertyId) => patch({ propertyId })}
                                options={[
                                    { value: "", label: "No linked property" },
                                    ...TASK_PROPERTIES.map((property) => ({
                                        value: property.id,
                                        label: `${property.title} · ${property.locality}`,
                                    })),
                                ]}
                            />
                        </section>
                        <section className={styles.section} aria-label="Task priority">
                            <TaskSelect
                                label="Priority"
                                value={draft.priority}
                                disabled={busy}
                                onChange={(priority) =>
                                    patch({ priority: priority as TaskDraft["priority"] })
                                }
                                options={[
                                    { value: "urgent", label: TASK_PRIORITY_LABELS.urgent },
                                    { value: "high", label: TASK_PRIORITY_LABELS.high },
                                    { value: "medium", label: TASK_PRIORITY_LABELS.medium },
                                    { value: "low", label: TASK_PRIORITY_LABELS.low },
                                ]}
                            />
                        </section>
                    </>
                ) : null}
                <p className={styles.hint}>
                    <LockKeyhole aria-hidden="true" />
                    Only you can see this task. Linked Client, owner and property records stay
                    unchanged.
                </p>
                {error || saveError ? (
                    <p className={styles.error} role="alert">
                        {error || saveError}
                    </p>
                ) : null}
            </form>
        </TaskPanel>
    );
}

function presetForRepeat(value: TaskRepeat | null): string {
    if (!value) return "none";
    if (value.interval !== 1) return "custom";
    if (
        value.unit === "week" &&
        value.weekdays.length === 5 &&
        [1, 2, 3, 4, 5].every((day) => value.weekdays.includes(day))
    )
        return "weekdays";
    if (value.unit === "week" && value.weekdays.length !== 1) return "custom";
    return { day: "daily", week: "weekly", month: "monthly", year: "yearly" }[value.unit];
}

function TaskRepeatFields({
    value,
    anchor,
    disabled,
    onChange,
    error,
}: {
    value: TaskRepeat | null;
    anchor: string;
    disabled: boolean;
    onChange: (repeat: TaskRepeat | null) => void;
    error?: string;
}) {
    const [custom, setCustom] = useState(() => presetForRepeat(value) === "custom");
    const dateId = useId();
    const weekday = taskWeekday(anchor);
    const weekdayLabel = WEEKDAYS.find((day) => day.value === weekday)?.label;
    const changePreset = (preset: string) => {
        setCustom(preset === "custom");
        if (preset === "none") return onChange(null);
        if (preset === "custom")
            return onChange(value || { unit: "day", interval: 2, weekdays: [], until: null });
        const unit =
            preset === "daily"
                ? "day"
                : preset === "monthly"
                  ? "month"
                  : preset === "yearly"
                    ? "year"
                    : "week";
        onChange({
            unit,
            interval: 1,
            weekdays: preset === "weekdays" ? [1, 2, 3, 4, 5] : unit === "week" ? [weekday] : [],
            until: value?.until ?? null,
        });
    };
    return (
        <>
            <TaskSelect
                label="Repeat"
                value={custom ? "custom" : presetForRepeat(value)}
                disabled={disabled}
                onChange={changePreset}
                options={[
                    { value: "none", label: "Does not repeat" },
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: `Weekly (${weekdayLabel})` },
                    { value: "monthly", label: "Monthly" },
                    { value: "yearly", label: "Yearly" },
                    { value: "weekdays", label: "Every weekday (Mon – Fri)" },
                    { value: "custom", label: "Custom…" },
                ]}
            />
            {custom && value && (
                <>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor={`${dateId}-interval`}>
                                Repeat every
                            </label>
                            <Input
                                id={`${dateId}-interval`}
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={365}
                                step={1}
                                size="md"
                                value={value.interval || ""}
                                disabled={disabled}
                                onValueChange={(interval) =>
                                    onChange({
                                        ...value,
                                        interval: interval === "" ? 0 : Number(interval),
                                    })
                                }
                            />
                        </div>
                        <TaskSelect
                            label="Repeat unit"
                            value={value.unit}
                            disabled={disabled}
                            onChange={(unit) =>
                                onChange({
                                    ...value,
                                    unit: unit as TaskRepeat["unit"],
                                    weekdays:
                                        unit === "week"
                                            ? value.weekdays.length
                                                ? value.weekdays
                                                : [weekday]
                                            : [],
                                })
                            }
                            options={[
                                { value: "day", label: "Days" },
                                { value: "week", label: "Weeks" },
                                { value: "month", label: "Months" },
                                { value: "year", label: "Years" },
                            ]}
                        />
                    </div>
                    {value.unit === "week" && (
                        <fieldset className={styles.weekdayField}>
                            <legend className={styles.label}>Repeat on</legend>
                            <div className={styles.weekdays}>
                                {WEEKDAYS.map((day) => (
                                    <Button
                                        key={day.value}
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className={
                                            value.weekdays.includes(day.value)
                                                ? "border-brand/40 bg-brand-soft text-brand-text hover:bg-brand-soft-hover"
                                                : undefined
                                        }
                                        aria-label={day.label}
                                        aria-pressed={value.weekdays.includes(day.value)}
                                        disabled={disabled}
                                        onClick={() =>
                                            onChange({
                                                ...value,
                                                weekdays: value.weekdays.includes(day.value)
                                                    ? value.weekdays.filter((d) => d !== day.value)
                                                    : [...value.weekdays, day.value],
                                            })
                                        }
                                    >
                                        {day.short}
                                    </Button>
                                ))}
                            </div>
                        </fieldset>
                    )}
                </>
            )}
            {value && (
                <>
                    <TaskSelect
                        label="Repeat ends"
                        value={value.until ? "date" : "never"}
                        disabled={disabled}
                        onChange={(end) =>
                            onChange({ ...value, until: end === "never" ? null : anchor })
                        }
                        options={[
                            { value: "never", label: "Never" },
                            { value: "date", label: "On a date" },
                        ]}
                    />
                    {value.until && (
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor={`${dateId}-end`}>
                                Last repeat date
                            </label>
                            <AppDatePicker
                                id={`${dateId}-end`}
                                value={value.until}
                                onChange={(until) => onChange({ ...value, until })}
                                disabled={disabled}
                                allowPast
                                size="md"
                            />
                        </div>
                    )}
                    <p className={styles.hint}>
                        {taskRepeatLabel(value)}
                        {value.unit === "month" || value.unit === "year"
                            ? ". Shorter months use their last day."
                            : "."}
                    </p>
                </>
            )}
            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}
        </>
    );
}
