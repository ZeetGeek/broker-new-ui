"use client";

import { useId, useState } from "react";

import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { Bell, Building2, CalendarDays, Clock, MapPin } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { getVisitActions, type SiteVisit, visitReminderLabel, visitState } from "./model";
import { PREVIEW_CLIENTS, PREVIEW_PROPERTIES } from "./preview-store";
import { VISIT_ACTIONS } from "./visit-actions";
import { VisitOverlay } from "./visit-overlay";
import { VisitStatusBadge } from "./visit-status";

import styles from "./visits.module.css";

export type VisitIntent = "completed" | "not_attended" | "cancelled";

export function AttendanceConfirmation({
    visit,
    intent,
    busy,
    error,
    onClose,
    onConfirm,
}: {
    visit: SiteVisit;
    intent: VisitIntent;
    busy: boolean;
    error: string;
    onClose: () => void;
    onConfirm: (note: string) => Promise<void>;
}) {
    const formId = useId();
    const originalNote = visit.status === "scheduled" ? "" : visit.attendanceNote;
    const [note, setNote] = useState(originalNote);
    const client = PREVIEW_CLIENTS.find((item) => item.id === visit.clientId);
    const property = PREVIEW_PROPERTIES.find((item) => item.id === visit.propertyId);
    const copy = {
        completed: {
            title: "Mark visit as attended?",
            description: "Save the visit outcome and any notes for your follow-up.",
            action: "Mark attended",
        },
        not_attended: {
            title: "Mark visit as not attended?",
            description: "Keep this visit in your history. You can schedule another when ready.",
            action: "Mark not attended",
        },
        cancelled: {
            title: "Cancel this visit?",
            description: "The visit will stay in your history. Its reminders will stop.",
            action: "Cancel visit",
        },
    }[intent];
    return (
        <VisitOverlay
            compact
            title={
                visit.status === "scheduled"
                    ? copy.title
                    : `Change outcome to ${intent === "completed" ? "Completed" : "Not attended"}?`
            }
            description={
                visit.status === "scheduled"
                    ? copy.description
                    : "Correct the attendance result. The change is recorded in this visit's activity history."
            }
            busy={busy}
            dirty={note !== originalNote}
            onClose={onClose}
            error={error}
            footer={(close) => (
                <>
                    <Button variant="outline" disabled={busy} onClick={close}>
                        {intent === "cancelled" ? "Keep visit" : "Go back"}
                    </Button>
                    <Button
                        variant={intent === "cancelled" ? "destructive" : "accent"}
                        type="submit"
                        form={formId}
                        disabled={busy}
                        loading={busy}
                    >
                        {copy.action}
                    </Button>
                </>
            )}
        >
            <form
                id={formId}
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!busy) void onConfirm(note);
                }}
                className={styles.visitFields}
            >
                <div className={styles.confirmSummary}>
                    <strong>{client?.name}</strong>
                    <span>
                        {property?.title} · {property?.locality}, {property?.city}
                    </span>
                    <span>
                        {formatVisitDate(visit.startsAt)} · {formatVisitTime(visit.startsAt)} –{" "}
                        {formatVisitTime(visit.endsAt)} IST
                    </span>
                </div>
                <label className={styles.field}>
                    {intent === "completed" ? "Visit note (optional)" : "Reason (optional)"}
                    <Textarea
                        className={styles.notesInput}
                        rows={3}
                        maxLength={2000}
                        value={note}
                        disabled={busy}
                        placeholder={
                            intent === "completed"
                                ? "Anything useful for your follow-up"
                                : "Why didn't this visit happen?"
                        }
                        onChange={(event) => setNote(event.target.value)}
                    />
                </label>
                {intent === "completed" && (
                    <p className={styles.muted}>
                        This records attendance. The client’s pipeline stage stays the same.
                    </p>
                )}
            </form>
        </VisitOverlay>
    );
}

export function VisitDetail({
    visit,
    now,
    busy,
    onBack,
    onConfirm,
    onEdit,
    onDelete,
}: {
    visit: SiteVisit;
    now: number;
    busy: boolean;
    onBack: () => void;
    onConfirm: (intent: VisitIntent) => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const state = visitState(visit, now);
    const client = PREVIEW_CLIENTS.find((item) => item.id === visit.clientId);
    const property = PREVIEW_PROPERTIES.find((item) => item.id === visit.propertyId);
    const live = visit.status === "scheduled";
    const ended = state === "needs_update";
    const minutes = Math.round((Date.parse(visit.endsAt) - Date.parse(visit.startsAt)) / 60_000);
    return (
        <VisitOverlay
            title="Visit details"
            busy={busy}
            onClose={onBack}
            footer={(close) => (
                <>
                    {getVisitActions(visit, now).map((action) => {
                        const { label, icon: Icon, danger } = VISIT_ACTIONS[action];
                        return (
                            <Button
                                key={action}
                                disabled={busy}
                                variant={
                                    danger
                                        ? "destructive"
                                        : action === "completed" || action === "edit"
                                          ? "accent"
                                          : "outline"
                                }
                                onClick={() => {
                                    if (action === "edit") onEdit();
                                    else if (action === "delete") onDelete();
                                    else if (action === "view") close();
                                    else onConfirm(action);
                                }}
                            >
                                <Icon aria-hidden />
                                {action === "view" ? "Close" : label}
                            </Button>
                        );
                    })}
                </>
            )}
        >
            <div className={styles.visitFields}>
                <div className={styles.detailProperty}>
                    <div className={styles.detailCover}>
                        <Building2 aria-hidden />
                        {property?.imageUrl && (
                            <AppImage src={property.imageUrl} alt="" fill sizes="88px" />
                        )}
                    </div>
                    <div>
                        <VisitStatusBadge state={state} />
                        <h2>{property?.title}</h2>
                        <p>
                            {property?.configLabel} · {property?.locality}, {property?.city}
                        </p>
                    </div>
                </div>
                {ended && (
                    <div className={styles.attendancePrompt}>
                        <Clock aria-hidden />
                        <div>
                            <strong>Did this visit happen?</strong>
                            <p>
                                The scheduled time has ended. Record attendance or choose a new
                                time.
                            </p>
                        </div>
                    </div>
                )}
                <section className={styles.detailGroup} aria-label="Visit information">
                    <div className={styles.detailLine}>
                        <CalendarDays aria-hidden />
                        <div>
                            <span>Date & time</span>
                            <strong>{formatVisitDate(visit.startsAt)}</strong>
                            <p>
                                {formatVisitTime(visit.startsAt)} – {formatVisitTime(visit.endsAt)}{" "}
                                · {minutes} minutes · IST
                            </p>
                        </div>
                    </div>
                    <div className={styles.detailLine}>
                        <UserAvatar name={client?.name ?? "Client"} size="sm" />
                        <div>
                            <span>Client</span>
                            <strong>{client?.name}</strong>
                            <p>
                                {client?.type} · {client?.requirement}
                            </p>
                        </div>
                    </div>
                    <div className={styles.detailLine}>
                        <MapPin aria-hidden />
                        <div>
                            <span>Meeting point</span>
                            <strong>{property?.address}</strong>
                        </div>
                    </div>
                    <div className={styles.detailLine}>
                        <Bell aria-hidden />
                        <div>
                            <span>Reminders</span>
                            {live && !ended && visit.reminders.length ? (
                                <ul className="flex list-none flex-col gap-1 p-0 text-sm font-semibold">
                                    {[...visit.reminders]
                                        .sort((a, b) => b - a)
                                        .map((minutes) => (
                                            <li key={minutes}>{visitReminderLabel(minutes)}</li>
                                        ))}
                                </ul>
                            ) : (
                                <strong>
                                    {live && !ended ? "No reminders" : "No upcoming reminders"}
                                </strong>
                            )}
                        </div>
                    </div>
                </section>
                {(visit.notes || visit.attendanceNote) && (
                    <section className={styles.detailNotes} aria-label="Visit notes">
                        {visit.notes && (
                            <div>
                                <h3>Visit note</h3>
                                <p className={styles.note}>{visit.notes}</p>
                            </div>
                        )}
                        {visit.attendanceNote && (
                            <div>
                                <h3>
                                    {visit.status === "completed"
                                        ? "Outcome note"
                                        : visit.status === "cancelled"
                                          ? "Cancellation reason"
                                          : "Reason"}
                                </h3>
                                <p className={styles.note}>{visit.attendanceNote}</p>
                            </div>
                        )}
                    </section>
                )}
                <section className={styles.activitySection} aria-label="Activity">
                    <h3>Activity</h3>
                    <ol className={styles.activityList}>
                        {[...visit.history].reverse().map((event, index) => (
                            <li key={`${event.at}-${index}`}>
                                <span className={styles.activityDot} aria-hidden />
                                <div>
                                    <p>{event.label}</p>
                                    <time dateTime={event.at}>
                                        {formatVisitDate(event.at)} · {formatVisitTime(event.at)}{" "}
                                        IST
                                    </time>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>
            </div>
        </VisitOverlay>
    );
}
