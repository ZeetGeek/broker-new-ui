"use client";

import { type FormEvent, Fragment, useId, useState } from "react";

import { formatVisitTime, inputValueInIst } from "@/lib/visits/time";

import { AppTimePicker } from "@/components/shared/app-time-picker";
import { Bell, Clock } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
    EMPTY_DRAFT,
    type SiteVisit,
    validateDraft,
    type VisitDraft,
    visitDurationLabel,
    visitDurationMinutes,
    visitEndTime,
} from "./model";
import { VisitOverlay } from "./visit-overlay";
import { VisitDatePicker, VisitEntityCombobox } from "./visit-pickers";
import { VisitReminderPicker } from "./visit-reminder-picker";

import styles from "./visits.module.css";

export function ScheduleForm({
    visit,
    visits,
    now,
    prefill,
    busy,
    saveError,
    onSave,
    onBack,
}: {
    visit?: SiteVisit;
    visits: SiteVisit[];
    now: number;
    prefill?: Partial<VisitDraft>;
    busy: boolean;
    saveError: string;
    onSave: (draft: VisitDraft) => Promise<void>;
    onBack: () => void;
}) {
    const formId = useId();
    const [initial] = useState<VisitDraft>(() =>
        visit
            ? {
                  clientId: visit.clientId,
                  propertyId: visit.propertyId,
                  date: inputValueInIst(visit.startsAt).slice(0, 10),
                  startTime: inputValueInIst(visit.startsAt).slice(11),
                  endTime: inputValueInIst(visit.endsAt).slice(11),
                  reminders: [...visit.reminders],
                  notes: visit.notes,
              }
            : { ...EMPTY_DRAFT, ...prefill },
    );
    const [draft, setDraft] = useState(initial);
    const [submitted, setSubmitted] = useState(false);
    const [manualDuration, setManualDuration] = useState(() =>
        visitDurationMinutes(initial.startTime, initial.endTime),
    );
    const duration = visitDurationMinutes(draft.startTime, draft.endTime);
    const presets = [30, 45, 60];
    const customDuration =
        manualDuration !== null && !presets.includes(manualDuration)
            ? manualDuration
            : duration !== null && !presets.includes(duration)
              ? duration
              : null;
    const durationOptions = customDuration !== null ? [customDuration, ...presets] : presets;
    const patch = (next: Partial<VisitDraft>) => setDraft((current) => ({ ...current, ...next }));
    const { errors, valid } = validateDraft(draft, visits, now, visit?.id);
    const conflict = visits.find((candidate) => candidate.id === errors.conflict);
    const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy) return;
        setSubmitted(true);
        if (valid) await onSave(draft);
        else {
            const form = event.currentTarget;
            requestAnimationFrame(() =>
                form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
            );
        }
    };
    return (
        <VisitOverlay
            title={visit ? "Edit visit" : "Schedule a visit"}
            onClose={onBack}
            busy={busy}
            dirty={dirty}
            error={saveError}
            footer={(close) => (
                <>
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
                        {visit ? "Save changes" : "Schedule visit"}
                    </Button>
                </>
            )}
        >
            <form id={formId} onSubmit={submit} noValidate>
                <fieldset disabled={busy} className="m-0 border-0 p-0 min-inline-0">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <div className={styles.field}>
                                <label htmlFor={`${formId}-client`}>
                                    Client <span className={styles.required}>*</span>
                                </label>
                                <VisitEntityCombobox
                                    id={`${formId}-client`}
                                    kind="client"
                                    value={draft.clientId}
                                    onChange={(clientId) => patch({ clientId })}
                                    disabled={busy}
                                    error={submitted ? errors.clientId : undefined}
                                />
                            </div>
                            <div className={styles.field}>
                                <label htmlFor={`${formId}-property`}>
                                    Property <span className={styles.required}>*</span>
                                </label>
                                <VisitEntityCombobox
                                    id={`${formId}-property`}
                                    kind="property"
                                    value={draft.propertyId}
                                    onChange={(propertyId) => patch({ propertyId })}
                                    disabled={busy}
                                    error={submitted ? errors.propertyId : undefined}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className={styles.field}>
                                <label htmlFor={`${formId}-date`}>
                                    Visit date <span className={styles.required}>*</span>
                                </label>
                                <VisitDatePicker
                                    id={`${formId}-date`}
                                    value={draft.date}
                                    onChange={(date) => patch({ date })}
                                    recorded={
                                        visit?.status === "completed" ||
                                        visit?.status === "not_attended"
                                    }
                                    disabled={busy}
                                    error={submitted ? errors.date : undefined}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className={styles.field}>
                                    <label htmlFor={`${formId}-start`}>
                                        Start time (IST) <span className={styles.required}>*</span>
                                    </label>
                                    <AppTimePicker
                                        className={styles.timeInput}
                                        id={`${formId}-start`}
                                        aria-label="Visit start time (IST)"
                                        value={draft.startTime}
                                        onChange={(startTime) => {
                                            if (duration === null) {
                                                const chosen = visitDurationMinutes(
                                                    startTime,
                                                    draft.endTime,
                                                );
                                                if (chosen !== null) setManualDuration(chosen);
                                            }
                                            patch({
                                                startTime,
                                                ...(duration !== null
                                                    ? {
                                                          endTime:
                                                              visitEndTime(startTime, duration) ??
                                                              "",
                                                      }
                                                    : {}),
                                            });
                                        }}
                                        error={submitted ? errors.startTime : undefined}
                                        disabled={busy}
                                        required
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label htmlFor={`${formId}-end`}>
                                        End time (IST) <span className={styles.required}>*</span>
                                    </label>
                                    <AppTimePicker
                                        className={styles.timeInput}
                                        id={`${formId}-end`}
                                        aria-label="Visit end time (IST)"
                                        value={draft.endTime}
                                        onChange={(endTime) => {
                                            patch({ endTime });
                                            const chosen = visitDurationMinutes(
                                                draft.startTime,
                                                endTime,
                                            );
                                            if (chosen !== null) setManualDuration(chosen);
                                        }}
                                        error={submitted ? errors.endTime : undefined}
                                        disabled={busy}
                                        required
                                    />
                                </div>
                            </div>
                            {draft.date && duration !== null && (
                                <div
                                    role="group"
                                    aria-label="Visit duration"
                                    className="flex flex-wrap items-center gap-2"
                                >
                                    <span className="body-sm text-ink-muted">Duration</span>
                                    {durationOptions.map((minutes, index) => (
                                        <Fragment key={minutes}>
                                            {customDuration !== null && index === 1 && (
                                                <span
                                                    aria-hidden="true"
                                                    className="mx-1 shrink-0 bg-ink/20 block-6 inline-px"
                                                />
                                            )}
                                            <Button
                                                type="button"
                                                variant={
                                                    duration === minutes ? "accent" : "outline"
                                                }
                                                size="sm"
                                                aria-pressed={duration === minutes}
                                                disabled={
                                                    busy ||
                                                    visitEndTime(draft.startTime, minutes) === null
                                                }
                                                onClick={() => {
                                                    if (draft.startTime)
                                                        patch({
                                                            endTime:
                                                                visitEndTime(
                                                                    draft.startTime,
                                                                    minutes,
                                                                ) ?? "",
                                                        });
                                                }}
                                            >
                                                {visitDurationLabel(minutes)}
                                            </Button>
                                        </Fragment>
                                    ))}
                                </div>
                            )}
                            {conflict && (
                                <p role="alert" className={styles.conflict}>
                                    <Clock aria-hidden />
                                    <span>
                                        You already have a visit from{" "}
                                        {formatVisitTime(conflict.startsAt)} to{" "}
                                        {formatVisitTime(conflict.endsAt)}. Choose another time.
                                    </span>
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-4">
                            {draft.date && draft.startTime ? (
                                <VisitReminderPicker
                                    reminders={draft.reminders}
                                    date={draft.date}
                                    startTime={draft.startTime}
                                    now={now}
                                    onChange={(reminders) => patch({ reminders })}
                                    disabled={busy}
                                />
                            ) : (
                                <p className="body-sm flex items-center gap-2 text-ink-muted">
                                    <Bell
                                        aria-hidden="true"
                                        className="shrink-0 block-4 inline-4"
                                    />
                                    Add a visit date and start time to set one or more reminders.
                                </p>
                            )}
                            {submitted && errors.reminders && (
                                <p role="alert" className={styles.fieldError}>
                                    {errors.reminders}
                                </p>
                            )}
                            <label className={styles.field}>
                                Notes (optional)
                                <Textarea
                                    className={styles.notesInput}
                                    value={draft.notes}
                                    onChange={(event) => patch({ notes: event.target.value })}
                                    maxLength={2000}
                                    rows={5}
                                    placeholder="Meeting point or anything to remember"
                                />
                            </label>
                        </div>
                    </div>
                </fieldset>
            </form>
        </VisitOverlay>
    );
}
