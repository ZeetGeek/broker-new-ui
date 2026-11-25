"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { MAX_CHARS } from "@/lib/validation/text-limits";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { AppDatePicker } from "@/components/shared/app-date-picker";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { AppTimePicker } from "@/components/shared/app-time-picker";
import { CharacterCount } from "@/components/shared/character-count";
import { revealDrawerSections } from "@/components/shared/drawer-section";
import { Bell, LockKeyhole, Pencil } from "@/components/shared/icons";
import { ListToolbarSelect } from "@/components/shared/list-toolbar";
import { MobileSelectDrawer } from "@/components/shared/mobile-select-drawer";
import {
    mapTaskClientToPicker,
    mapTaskOwnerToPicker,
} from "@/components/shared/map-to-people-picker-person";
import { mapTaskPropertyToPicker } from "@/components/shared/map-to-property-picker-property";
import { PeopleInlineSelect } from "@/components/shared/people-inline-select";
import { PropertyPickerField } from "@/components/shared/property-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { FormField } from "@/features/contacts/contact-form-ui";
import {
    FORM_SECTIONS_CLASS,
    FORM_STACK_CLASS,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

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
import { bareTaskDraftTitle } from "./quick-add-draft";
import { type TaskRepeat, taskRepeatLabel, taskWeekday, WEEKDAYS } from "./recurrence";
import { useTaskCatalogs } from "./task-catalogs";
import { TaskPanel } from "./task-panel";
import { TaskReminderPicker } from "./task-reminder-picker";

export function TaskSelect({
    label,
    value,
    options,
    onChange,
    disabled = false,
    toolbar = false,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    disabled?: boolean;
    toolbar?: boolean;
}) {
    const id = useId();
    const mobile = useMobileMenu();
    if (toolbar) {
        return (
            <ListToolbarSelect
                mobileDrawer
                label={label}
                value={value}
                options={options}
                onChange={onChange}
                active
                disabled={disabled}
            />
        );
    }
    if (mobile) {
        return (
            <FormField label={label} htmlFor={id}>
                <MobileSelectDrawer
                    id={id}
                    label={label}
                    value={value}
                    options={options}
                    onChange={onChange}
                    disabled={disabled}
                />
            </FormField>
        );
    }
    return (
        <FormField label={label} htmlFor={id}>
            <Select
                items={options}
                value={value}
                disabled={disabled}
                onValueChange={(next) => next !== null && onChange(next)}
            >
                <SelectTrigger id={id} size="md" className="text-sm inline-full">
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
        </FormField>
    );
}

/** Client + owner pickers — at most one of each, same as the old chips field. */
function TaskContactsField({
    clientId,
    ownerId,
    disabled,
    onChange,
}: {
    clientId: string;
    ownerId: string;
    disabled?: boolean;
    onChange: (next: { clientId: string; ownerId: string }) => void;
}) {
    const id = useId();
    const catalogs = useTaskCatalogs();
    const clients = catalogs.clients.map(mapTaskClientToPicker);
    const owners = catalogs.owners.map(mapTaskOwnerToPicker);

    return (
        <FormField label="Contacts" htmlFor={id} hint="Link a Client, an owner, or both.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <PeopleInlineSelect
                    id={`${id}-client`}
                    lockedScope="client"
                    people={clients}
                    value={clientId || null}
                    onValueChange={(next) => onChange({ clientId: next ?? "", ownerId })}
                    placeholder="Any client"
                    allowClear
                    clearLabel="No client"
                    disabled={disabled}
                    size="md"
                />
                <PeopleInlineSelect
                    id={`${id}-owner`}
                    lockedScope="owner"
                    people={owners}
                    value={ownerId || null}
                    onValueChange={(next) => onChange({ clientId, ownerId: next ?? "" })}
                    placeholder="Any owner"
                    allowClear
                    clearLabel="No owner"
                    disabled={disabled}
                    size="md"
                />
            </div>
        </FormField>
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
    const catalogs = useTaskCatalogs();
    const detailsCountId = `${formId}-details-count`;
    const detailsErrorId = `${formId}-details-error`;
    const titleRef = useRef<HTMLInputElement>(null);
    const [initial] = useState(() => {
        const base = task ? draftFromTask(task) : { ...newTaskDraft(), ...prefill };
        // Edit modal shows a clean name; chips are re-encoded from fields on save.
        if (task && mode === "edit") {
            return {
                ...base,
                title: bareTaskDraftTitle(
                    base.title,
                    {
                        propertyId: base.propertyId || null,
                        clientId: base.clientId || null,
                        ownerId: base.ownerId || null,
                    },
                    catalogs,
                    Date.now(),
                    base.startDate || null,
                ),
            };
        }
        return base;
    });
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
    const showDueError = submitted || !!draft.dueDate;
    const setDate = (date: string | null) =>
        patch(date ? { dueDate: date } : { dueDate: "", dueTime: "", reminders: [] });
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy) return;
        setSubmitted(true);
        setSaveError("");
        const reminderHasPassed = hasNewPastReminder(Date.now());
        if (!validation.valid || reminderHasPassed) {
            revealDrawerSections(event.currentTarget);
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
    const description =
        mode === "reschedule"
            ? "Choose a new date and time. All times are in India time (IST)."
            : mode === "reminder"
              ? "Add one or more reminders, including your own custom times."
              : "";
    const primary = mode === "create" ? "Create task" : "Save changes";
    return (
        <TaskPanel
            title={title}
            description={description}
            onClose={onClose}
            busy={busy}
            dirty={dirty}
            footer={
                <AppModalFooter
                    className="flex flex-wrap items-center justify-end gap-2 inline-full"
                    primaryLabel={primary}
                    primaryVariant="accent"
                    primaryType="submit"
                    primaryFormId={formId}
                    primaryDisabled={busy}
                    primaryLoading={busy}
                />
            }
        >
            <form id={formId} onSubmit={submit} className="inline-full" noValidate>
                <div className={FORM_SECTIONS_CLASS}>
                    {!fullForm && task ? (
                        <div className="flex flex-col gap-1.5">
                            <p className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
                                {task.title}
                            </p>
                            {task.details ? (
                                <p className="text-sm/6 text-ink-muted">{task.details}</p>
                            ) : null}
                        </div>
                    ) : null}

                    {fullForm ? (
                        <WizardSection
                            title="Task details"
                            description="Start with the next small step. Add schedule and links when you need them."
                        >
                            <div className={FORM_STACK_CLASS}>
                                <FormField label="Task name" htmlFor={`${formId}-title`} required>
                                    <Input
                                        ref={titleRef}
                                        id={`${formId}-title`}
                                        name="title"
                                        startIcon={Pencil}
                                        size="lg"
                                        className="text-sm block-control-lg"
                                        value={draft.title}
                                        onValueChange={(next) => patch({ title: next })}
                                        placeholder="e.g. Call Aarav about the Vesu shortlist"
                                        maxLength={160}
                                        disabled={busy}
                                        autoComplete="off"
                                        required
                                        errorText={submitted ? validation.errors.title : undefined}
                                    />
                                </FormField>
                                <FormField
                                    label="Details"
                                    htmlFor={`${formId}-details`}
                                    hint={
                                        <CharacterCount
                                            id={detailsCountId}
                                            value={draft.details}
                                            maxChars={MAX_CHARS.taskDetails}
                                        />
                                    }
                                >
                                    <Textarea
                                        id={`${formId}-details`}
                                        name="details"
                                        value={draft.details}
                                        onChange={(event) => patch({ details: event.target.value })}
                                        maxLength={MAX_CHARS.taskDetails}
                                        rows={4}
                                        disabled={busy}
                                        placeholder="Anything you’ll want to remember when you pick this up."
                                        aria-invalid={
                                            submitted && !!validation.errors.details
                                                ? true
                                                : undefined
                                        }
                                        aria-describedby={
                                            submitted && validation.errors.details
                                                ? `${detailsCountId} ${detailsErrorId}`
                                                : detailsCountId
                                        }
                                        className={cn(
                                            `
                                              field-sizing-fixed resize-y rounded-control border-2
                                              border-border-warm bg-surface px-4 py-2.5 text-sm/6
                                              text-ink shadow-none min-block-27
                                              placeholder:text-ink-subtle
                                              hover:border-ink-subtle
                                              focus-visible:border-ring focus-visible:ring-3
                                              focus-visible:ring-ring/30
                                              aria-invalid:border-danger-mid
                                            `,
                                        )}
                                    />
                                    {submitted && validation.errors.details ? (
                                        <p
                                            id={detailsErrorId}
                                            role="alert"
                                            className="text-sm text-danger"
                                        >
                                            {validation.errors.details}
                                        </p>
                                    ) : null}
                                </FormField>
                            </div>
                        </WizardSection>
                    ) : null}

                    <WizardSection
                        title="Schedule"
                        description="Set when this starts. Add a due date if it needs one."
                    >
                        <div className={FORM_STACK_CLASS}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    label="Start date"
                                    htmlFor={`${formId}-start-date`}
                                    required
                                    error={submitted ? validation.errors.startDate : undefined}
                                >
                                    <AppDatePicker
                                        id={`${formId}-start-date`}
                                        className="border-2 text-sm block-control-lg inline-full"
                                        value={draft.startDate || null}
                                        onChange={(startDate) =>
                                            patch({ startDate: startDate ?? "" })
                                        }
                                        disabled={busy}
                                        allowPast
                                        invalid={submitted && !!validation.errors.startDate}
                                    />
                                </FormField>
                                <FormField
                                    label="Start time (IST)"
                                    htmlFor={`${formId}-start-time`}
                                    required
                                    hint="A reminder at task start is included automatically."
                                >
                                    <AppTimePicker
                                        id={`${formId}-start-time`}
                                        className="**:data-[slot=time-picker-trigger]:text-sm **:data-[slot=time-picker-trigger]:block-control-lg"
                                        aria-label="Task start time (IST)"
                                        value={draft.startTime}
                                        onChange={(startTime) => patch({ startTime })}
                                        disabled={busy}
                                        required
                                        error={submitted ? validation.errors.startTime : undefined}
                                    />
                                </FormField>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    label="Due date"
                                    htmlFor={`${formId}-due-date`}
                                    error={showDueError ? validation.errors.dueDate : undefined}
                                >
                                    <AppDatePicker
                                        id={`${formId}-due-date`}
                                        className="border-2 text-sm block-control-lg inline-full"
                                        value={draft.dueDate || null}
                                        onChange={(dueDate) =>
                                            patch(
                                                dueDate
                                                    ? { dueDate }
                                                    : {
                                                          dueDate: "",
                                                          dueTime: "",
                                                          reminders: [],
                                                      },
                                            )
                                        }
                                        disabled={busy}
                                        allowPast
                                        min={draft.startDate || undefined}
                                        invalid={showDueError && !!validation.errors.dueDate}
                                    />
                                </FormField>
                                <FormField
                                    label="Due time (IST)"
                                    htmlFor={`${formId}-due-time`}
                                    hint={
                                        draft.dueDate
                                            ? "Leave blank to do it any time that day."
                                            : "Choose a due date first."
                                    }
                                >
                                    <AppTimePicker
                                        id={`${formId}-due-time`}
                                        className="**:data-[slot=time-picker-trigger]:text-sm **:data-[slot=time-picker-trigger]:block-control-lg"
                                        aria-label="Task due time (IST)"
                                        value={draft.dueTime}
                                        onChange={(dueTime) =>
                                            patch({
                                                dueTime,
                                                ...(!dueTime ? { reminders: [] } : {}),
                                            })
                                        }
                                        disabled={busy || !draft.dueDate}
                                        min={
                                            draft.dueDate &&
                                            draft.startDate &&
                                            draft.dueDate === draft.startDate &&
                                            draft.startTime
                                                ? draft.startTime
                                                : undefined
                                        }
                                        error={showDueError ? validation.errors.dueTime : undefined}
                                    />
                                </FormField>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="md"
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setDate(taskDateKey())}
                                >
                                    Today
                                </Button>
                                <Button
                                    variant="outline"
                                    size="md"
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setDate(taskDateKey(Date.now() + 86_400_000))}
                                >
                                    Tomorrow
                                </Button>
                                {draft.dueDate ? (
                                    <Button
                                        variant="ghost"
                                        size="md"
                                        type="button"
                                        disabled={busy}
                                        onClick={() => setDate(null)}
                                    >
                                        Remove date
                                    </Button>
                                ) : null}
                            </div>

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
                                        <p
                                            className="text-sm text-danger"
                                            role={submitted ? "alert" : undefined}
                                        >
                                            A reminder time has already passed. Remove it or choose
                                            a later due date and time.
                                        </p>
                                    ) : null}
                                    {submitted && validation.errors.reminders ? (
                                        <p className="text-sm text-danger" role="alert">
                                            {validation.errors.reminders}
                                        </p>
                                    ) : null}
                                </>
                            ) : (
                                <p className="flex items-start gap-2 text-sm/6 text-ink-muted">
                                    <Bell
                                        aria-hidden
                                        className="mbs-0.5 shrink-0 text-brand block-4 inline-4"
                                    />
                                    Your task-start reminder is included. Add a due date and time to
                                    set extra reminders.
                                </p>
                            )}
                        </div>
                    </WizardSection>

                    {mode !== "reminder" ? (
                        <WizardSection
                            title="Repeat"
                            description="Completing this task can create the next occurrence with the same links and reminders."
                        >
                            <div className={FORM_STACK_CLASS}>
                                <TaskRepeatFields
                                    value={draft.repeat}
                                    anchor={draft.dueDate || draft.startDate || taskDateKey(now)}
                                    onChange={(repeat) => patch({ repeat })}
                                    disabled={busy}
                                    error={submitted ? validation.errors.repeat : undefined}
                                />
                                {task?.completedAt ? (
                                    <p className="text-sm/6 text-ink-muted">
                                        Already-created occurrences keep their schedule. Edit the
                                        next open task to change its future repeats.
                                    </p>
                                ) : task?.repeatFromId ? (
                                    <p className="text-sm/6 text-ink-muted">
                                        Changes apply to this occurrence and future tasks created
                                        from it.
                                    </p>
                                ) : null}
                            </div>
                        </WizardSection>
                    ) : null}

                    {fullForm ? (
                        <>
                            <WizardSection
                                title="Links"
                                description="Optionally connect this task to a Client, owner, or property."
                            >
                                <div className={FORM_STACK_CLASS}>
                                    <TaskContactsField
                                        clientId={draft.clientId}
                                        ownerId={draft.ownerId}
                                        disabled={busy}
                                        onChange={(next) => patch(next)}
                                    />
                                    <PropertyPickerField
                                        label="Property"
                                        manageBrowserHistory={false}
                                        properties={catalogs.properties.map(
                                            mapTaskPropertyToPicker,
                                        )}
                                        value={draft.propertyId || null}
                                        onConfirm={(propertyId) =>
                                            patch({ propertyId: propertyId ?? "" })
                                        }
                                        disabled={busy}
                                        placeholder="No linked property"
                                        allowClear
                                        clearLabel="No linked property"
                                        triggerSize="default"
                                    />
                                </div>
                            </WizardSection>

                            <WizardSection
                                title="Priority"
                                description="Use this when you need to scan for what matters first."
                            >
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
                            </WizardSection>
                        </>
                    ) : null}

                    <p className="flex items-start gap-2 text-sm/6 text-ink-muted">
                        <LockKeyhole aria-hidden className="mbs-0.5 shrink-0 block-4 inline-4" />
                        Only you can see this task. Linked contacts and property records stay
                        unchanged.
                    </p>

                    {error || saveError ? (
                        <p
                            role="alert"
                            className="
                              body-sm rounded-inner bg-danger-soft px-3 py-2 font-semibold
                              text-danger
                            "
                        >
                            {error || saveError}
                        </p>
                    ) : null}
                </div>
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Repeat every" htmlFor={`${dateId}-interval`}>
                            <Input
                                id={`${dateId}-interval`}
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={365}
                                step={1}
                                size="lg"
                                className="text-sm block-control-lg"
                                value={value.interval || ""}
                                disabled={disabled}
                                onValueChange={(interval) =>
                                    onChange({
                                        ...value,
                                        interval: interval === "" ? 0 : Number(interval),
                                    })
                                }
                            />
                        </FormField>
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
                        <fieldset className="m-0 border-0 p-0 min-inline-0">
                            <legend className="mbe-2 text-sm font-semibold text-ink">
                                Repeat on
                            </legend>
                            <div className="flex flex-wrap gap-2">
                                {WEEKDAYS.map((day) => (
                                    <Button
                                        key={day.value}
                                        type="button"
                                        size="md"
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
                        <FormField label="Last repeat date" htmlFor={`${dateId}-end`}>
                            <AppDatePicker
                                id={`${dateId}-end`}
                                className="border-2 text-sm block-control-lg inline-full"
                                value={value.until}
                                onChange={(until) => onChange({ ...value, until })}
                                disabled={disabled}
                                allowPast
                            />
                        </FormField>
                    )}
                    <p className="text-sm/6 text-ink-muted">
                        {taskRepeatLabel(value)}
                        {value.unit === "month" || value.unit === "year"
                            ? ". Shorter months use their last day."
                            : "."}
                    </p>
                </>
            )}
            {error && (
                <p className="text-sm text-danger" role="alert">
                    {error}
                </p>
            )}
        </>
    );
}
