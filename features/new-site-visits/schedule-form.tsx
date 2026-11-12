"use client";

import { type FormEvent, useId, useState } from "react";

import { formatVisitTime, inputValueInIst } from "@/lib/visits/time";
import { istDateKey } from "@/lib/visits/time";

import { AppDateTimePicker } from "@/components/shared/app-date-time-picker";
import { AppTimePicker } from "@/components/shared/app-time-picker";
import { Bell, Clock } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
    FORM_SECTIONS_CLASS,
    FORM_STACK_CLASS,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

import { EMPTY_DRAFT, REMINDERS, type SiteVisit, validateDraft, type VisitDraft } from "./model";
import { VisitOverlay } from "./visit-overlay";
import { VisitEntityCombobox } from "./visit-pickers";
import { VisitSelect } from "./visit-select";

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
                  reminderMinutes: visit.reminderMinutes,
                  notes: visit.notes,
              }
            : { ...EMPTY_DRAFT, ...prefill },
    );
    const [draft, setDraft] = useState(initial);
    const [submitted, setSubmitted] = useState(false);
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
                    <div className={FORM_SECTIONS_CLASS}>
                        <WizardSection title="Client & property">
                            <div className={FORM_STACK_CLASS}>
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
                        </WizardSection>
                        <WizardSection title="Date & time (IST)">
                            <div className={FORM_STACK_CLASS}>
                                <div className={styles.field}>
                                    <label htmlFor={`${formId}-date`}>
                                        Visit date & start time{" "}
                                        <span className={styles.required}>*</span>
                                    </label>
                                    <AppDateTimePicker
                                        id={`${formId}-date`}
                                        aria-label="Visit date and start time (IST)"
                                        value={`${draft.date}T${draft.startTime}`}
                                        onChange={(value) => {
                                            const [date = "", startTime = ""] = value.split("T");
                                            patch({ date, startTime });
                                        }}
                                        min={
                                            visit?.status === "completed" ||
                                            visit?.status === "not_attended"
                                                ? undefined
                                                : `${istDateKey(new Date(now))}T00:00`
                                        }
                                        max={
                                            visit?.status === "completed" ||
                                            visit?.status === "not_attended"
                                                ? `${istDateKey(new Date(now))}T23:59`
                                                : undefined
                                        }
                                        disabled={busy}
                                        error={
                                            submitted ? errors.date || errors.startTime : undefined
                                        }
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label htmlFor={`${formId}-end`}>
                                        End time <span className={styles.required}>*</span>
                                    </label>
                                    <AppTimePicker
                                        id={`${formId}-end`}
                                        aria-label="Visit end time (IST)"
                                        value={draft.endTime}
                                        onChange={(endTime) => patch({ endTime })}
                                        error={submitted ? errors.endTime : undefined}
                                        disabled={busy}
                                        required
                                    />
                                </div>
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
                        </WizardSection>
                        <WizardSection title="Reminder & notes">
                            <div className={FORM_STACK_CLASS}>
                                <VisitSelect
                                    label="Extra reminder"
                                    size="lg"
                                    startIcon={Bell}
                                    value={String(draft.reminderMinutes)}
                                    options={REMINDERS.map((reminder) => ({
                                        value: String(reminder.value),
                                        label: reminder.label,
                                    }))}
                                    onChange={(value) => patch({ reminderMinutes: Number(value) })}
                                />
                                <label className={styles.field}>
                                    Notes (optional)
                                    <Textarea
                                        className={styles.notesInput}
                                        value={draft.notes}
                                        onChange={(event) => patch({ notes: event.target.value })}
                                        maxLength={2000}
                                        rows={3}
                                        placeholder="Meeting point or anything to remember"
                                    />
                                </label>
                            </div>
                        </WizardSection>
                    </div>
                </fieldset>
            </form>
        </VisitOverlay>
    );
}
