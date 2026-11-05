"use client";

import { type FormEvent, useState } from "react";

import { formatVisitDate, formatVisitTime, inputValueInIst } from "@/lib/visits/time";

import {
    ArrowLeft,
    Bell,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Clock,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { EMPTY_DRAFT, REMINDERS, type SiteVisit, validateDraft, type VisitDraft } from "./model";
import { PREVIEW_CLIENTS, PREVIEW_PROPERTIES } from "./preview-store";
import { DateTimePicker, ReminderPicker, VisitPicker } from "./visit-pickers";

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
    const [draft, setDraft] = useState<VisitDraft>(() =>
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
    const [picker, setPicker] = useState<"client" | "property" | "date" | "reminder" | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const patch = (value: Partial<VisitDraft>) => setDraft((d) => ({ ...d, ...value }));
    const validation = validateDraft(draft, visits, now, visit?.id);
    const { errors, times } = validation;
    const conflict = visits.find((v) => v.id === errors.conflict);
    const client = PREVIEW_CLIENTS.find((c) => c.id === draft.clientId);
    const property = PREVIEW_PROPERTIES.find((p) => p.id === draft.propertyId);
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);
        if (validation.valid) await onSave(draft);
        else {
            const form = event.currentTarget;
            requestAnimationFrame(() =>
                form
                    .querySelector<HTMLElement>('[data-invalid="true"], [aria-invalid="true"]')
                    ?.focus(),
            );
        }
    };
    const errorFor = (key: keyof VisitDraft) =>
        submitted && errors[key] ? (
            <span id={`${key}-error`} className={styles.fieldError}>
                {errors[key]}
            </span>
        ) : null;
    if (picker === "client" || picker === "property")
        return (
            <VisitPicker
                kind={picker}
                selected={picker === "client" ? draft.clientId : draft.propertyId}
                onClose={() => setPicker(null)}
                onSelect={(id) => {
                    patch(picker === "client" ? { clientId: id } : { propertyId: id });
                    setPicker(null);
                }}
            />
        );
    if (picker === "date")
        return (
            <DateTimePicker
                draft={draft}
                onClose={() => setPicker(null)}
                onApply={(next) => {
                    patch(next);
                    setPicker(null);
                }}
            />
        );
    if (picker === "reminder")
        return (
            <ReminderPicker
                value={draft.reminderMinutes}
                onClose={() => setPicker(null)}
                onSave={(minutes) => {
                    patch({ reminderMinutes: minutes });
                    setPicker(null);
                }}
            />
        );
    return (
        <>
            <Button variant="ghost" className={styles.back} onClick={onBack} disabled={busy}>
                <ArrowLeft aria-hidden />
                Back to visits
            </Button>
            <header className={styles.heading}>
                <div>
                    <h1 className="h3 text-ink">
                        {visit ? "Reschedule visit" : "Schedule a visit"}
                    </h1>
                    <p>
                        {visit
                            ? "Choose a new time. Your reminder will move with the visit."
                            : "Choose a client and property, then set the visit time."}
                    </p>
                </div>
            </header>
            <div className={styles.workGrid}>
                <form className={styles.panel} onSubmit={submit} noValidate>
                    <div className={styles.panelHeader}>
                        <h2>Visit details</h2>
                        <p>One client and one property per visit.</p>
                    </div>
                    <fieldset disabled={busy} className={styles.formFields}>
                        <div className={styles.field}>
                            <label id="client-label">Client</label>
                            <Button
                                type="button"
                                variant="outline"
                                className="justify-between text-start inline-full min-inline-0"
                                aria-labelledby="client-label client-value"
                                data-invalid={submitted && !!errors.clientId}
                                aria-describedby={
                                    submitted && errors.clientId ? "clientId-error" : undefined
                                }
                                disabled={!!visit}
                                onClick={() => setPicker("client")}
                            >
                                <span id="client-value">{client?.name ?? "Select a client"}</span>
                                <ChevronDown aria-hidden />
                            </Button>
                            {errorFor("clientId")}
                        </div>
                        <div className={styles.field}>
                            <label id="property-label">Property</label>
                            <Button
                                type="button"
                                variant="outline"
                                className="justify-between text-start inline-full min-inline-0"
                                aria-labelledby="property-label property-value"
                                data-invalid={submitted && !!errors.propertyId}
                                aria-describedby={
                                    submitted && errors.propertyId ? "propertyId-error" : undefined
                                }
                                disabled={!!visit}
                                onClick={() => setPicker("property")}
                            >
                                <span id="property-value">
                                    {property?.title ?? "Select a property"}
                                </span>
                                <ChevronDown aria-hidden />
                            </Button>
                            {errorFor("propertyId")}
                        </div>
                        <div className={styles.dateTimeFields}>
                            <div className={styles.field}>
                                <label id="date-label">Visit date</label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="justify-between text-start inline-full min-inline-0"
                                    aria-labelledby="date-label date-value"
                                    data-invalid={submitted && !!errors.date}
                                    aria-describedby={
                                        submitted && errors.date ? "date-error" : undefined
                                    }
                                    onClick={() => setPicker("date")}
                                >
                                    <span id="date-value">
                                        {draft.date
                                            ? formatVisitDate(`${draft.date}T12:00:00+05:30`)
                                            : "Select a date"}
                                    </span>
                                    <CalendarDays aria-hidden />
                                </Button>
                                {errorFor("date")}
                            </div>
                            <div className={styles.twoColumns}>
                                <label className={styles.field}>
                                    Start time
                                    <Input
                                        type="time"
                                        value={draft.startTime}
                                        aria-invalid={submitted && !!errors.startTime}
                                        aria-describedby={
                                            submitted && errors.startTime
                                                ? "startTime-error"
                                                : undefined
                                        }
                                        onChange={(e) => patch({ startTime: e.target.value })}
                                    />
                                    {errorFor("startTime")}
                                </label>
                                <label className={styles.field}>
                                    End time
                                    <Input
                                        type="time"
                                        value={draft.endTime}
                                        aria-invalid={submitted && !!errors.endTime}
                                        aria-describedby={
                                            submitted && errors.endTime
                                                ? "endTime-error"
                                                : undefined
                                        }
                                        onChange={(e) => patch({ endTime: e.target.value })}
                                    />
                                    {errorFor("endTime")}
                                </label>
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label id="reminder-label">Extra reminder</label>
                            <Button
                                type="button"
                                variant="outline"
                                className="justify-between text-start inline-full min-inline-0"
                                aria-labelledby="reminder-label reminder-value"
                                onClick={() => setPicker("reminder")}
                            >
                                <span id="reminder-value">
                                    {
                                        REMINDERS.find((r) => r.value === draft.reminderMinutes)
                                            ?.label
                                    }
                                </span>
                                <ChevronDown aria-hidden />
                            </Button>
                        </div>
                        <label className={styles.field}>
                            Notes (optional)
                            <Textarea
                                value={draft.notes}
                                maxLength={2000}
                                rows={3}
                                placeholder="Meeting point or anything to remember"
                                onChange={(e) => patch({ notes: e.target.value })}
                            />
                        </label>
                        <p className={styles.hint}>
                            <Clock aria-hidden />
                            All times in IST. Start and end notifications are included.
                        </p>
                    </fieldset>
                    {saveError && (
                        <div role="alert" className={styles.error}>
                            <strong>Visit couldn’t be saved</strong>
                            <p>{saveError} Your details are still here. Try saving again.</p>
                        </div>
                    )}
                    <div className={styles.formFooter}>
                        <Button type="button" variant="outline" disabled={busy} onClick={onBack}>
                            Cancel
                        </Button>
                        <Button
                            type={conflict ? "button" : "submit"}
                            disabled={busy || !draft.clientId || !draft.propertyId || !times}
                            onClick={conflict ? () => setPicker("date") : undefined}
                        >
                            {busy
                                ? "Saving…"
                                : conflict
                                  ? "Choose another time"
                                  : saveError
                                    ? "Try saving again"
                                    : visit
                                      ? "Save new time"
                                      : "Schedule visit"}
                        </Button>
                    </div>
                </form>
                <aside className={styles.aside}>
                    <h2>
                        {saveError
                            ? "Your details are kept"
                            : conflict
                              ? "Time conflict"
                              : "Visit summary"}
                    </h2>
                    <div
                        className={
                            saveError
                                ? styles.errorSummary
                                : conflict
                                  ? styles.warning
                                  : styles.summary
                        }
                    >
                        {saveError ? (
                            <>
                                <h3>Visit could not be saved</h3>
                                <p>
                                    Check your connection and try again. No visit or reminder has
                                    been created yet.
                                </p>
                            </>
                        ) : conflict ? (
                            <>
                                <h3>Time conflict</h3>
                                <p>
                                    You already have a visit from{" "}
                                    {formatVisitTime(conflict.startsAt)} to{" "}
                                    {formatVisitTime(conflict.endsAt)}. Choose another time.
                                </p>
                            </>
                        ) : client && property && times ? (
                            <>
                                <CheckCircle2 aria-hidden />
                                <h3>Ready to {visit ? "reschedule" : "schedule"}</h3>
                                <p>{client.name}</p>
                                <strong>{property.title}</strong>
                                <p>
                                    {formatVisitDate(times.startsAt)}
                                    <br />
                                    {formatVisitTime(times.startsAt)} –{" "}
                                    {formatVisitTime(times.endsAt)} IST
                                </p>
                            </>
                        ) : (
                            <>
                                <CalendarDays aria-hidden />
                                <h3>Ready when you are</h3>
                                <p>
                                    Choose a client, a property and a time. Your visit will appear
                                    here.
                                </p>
                            </>
                        )}
                    </div>
                    <div className={styles.asideSection}>
                        <h3>
                            <Bell aria-hidden />
                            Your visit notifications
                        </h3>
                        <ul>
                            <li>Before: optional extra reminder</li>
                            <li>At start time: visit notification</li>
                            <li>At end time: attendance prompt</li>
                        </ul>
                    </div>
                    <div className={styles.asideSection}>
                        <h3>Only you manage this visit.</h3>
                        <p>
                            This visit stays in your CRM. Notifications are for you and do not
                            message the client.
                        </p>
                    </div>
                </aside>
            </div>
        </>
    );
}
