"use client";

import { useState } from "react";

import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import {
    ArrowLeft,
    Bell,
    CalendarDays,
    CheckCircle2,
    Clock,
    MapPin,
    User,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { FlowStep } from "./flow-step";
import { REMINDERS, type SiteVisit, visitState } from "./model";
import { PREVIEW_CLIENTS, PREVIEW_PROPERTIES } from "./preview-store";
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
    const [note, setNote] = useState("");
    const client = PREVIEW_CLIENTS.find((c) => c.id === visit.clientId);
    const property = PREVIEW_PROPERTIES.find((p) => p.id === visit.propertyId);
    const copy = {
        completed: {
            title: "Complete this visit",
            description: "Record that the visit happened and keep any useful follow-up notes.",
            action: "Mark completed",
        },
        not_attended: {
            title: "Mark visit as not attended?",
            description: "Keep this result separate from completed visits.",
            action: "Mark not attended",
        },
        cancelled: {
            title: "Cancel this visit?",
            description: "Stop the upcoming visit and its reminders.",
            action: "Cancel visit",
        },
    }[intent];
    return (
        <FlowStep
            title={copy.title}
            description={copy.description}
            backLabel="Back to visit"
            onBack={busy ? () => {} : onClose}
            aside={
                <>
                    <div className={styles.asideSection}>
                        <h3>
                            {intent === "completed" ? "After completion" : "Your visit history"}
                        </h3>
                        <p>
                            {intent === "completed"
                                ? "Your note stays with this visit. Completing it does not change the client’s pipeline stage."
                                : "The original visit is kept. You can schedule another visit later without losing this record."}
                        </p>
                    </div>
                    <div className={intent === "completed" ? styles.summary : styles.warning}>
                        <h3>
                            {intent === "completed"
                                ? "No more visit reminders"
                                : "This changes the visit status"}
                        </h3>
                        <p>
                            {intent === "completed"
                                ? "The completed visit has no upcoming reminder."
                                : "The client and property records are kept."}
                        </p>
                    </div>
                </>
            }
        >
            <div className={styles.confirmSummary}>
                <strong>{client?.name}</strong>
                <span>
                    {property?.title} · {property?.configLabel} · {property?.locality},{" "}
                    {property?.city}
                </span>
                <span>
                    {formatVisitDate(visit.startsAt)} · {formatVisitTime(visit.startsAt)} –{" "}
                    {formatVisitTime(visit.endsAt)} · IST
                </span>
            </div>
            <label className={styles.field}>
                {intent === "completed" ? "Visit note (optional)" : "Reason (optional)"}
                <Textarea
                    rows={4}
                    maxLength={2000}
                    value={note}
                    disabled={busy}
                    placeholder={
                        intent === "completed"
                            ? "Anything useful for your follow-up"
                            : "Why didn’t this visit happen?"
                    }
                    onChange={(e) => setNote(e.target.value)}
                />
            </label>
            <p className={styles.muted}>
                {intent === "cancelled"
                    ? "This visit is kept in history with a Cancelled status."
                    : `This visit will appear under ${intent === "completed" ? "Completed" : "Not attended"}.`}
            </p>
            {error && (
                <p role="alert" className={styles.error}>
                    {error} Try again; your note is still here.
                </p>
            )}
            <div className={styles.actions}>
                <Button variant="outline" disabled={busy} onClick={onClose}>
                    {intent === "cancelled"
                        ? "Keep visit"
                        : intent === "completed"
                          ? "Back to attendance"
                          : "Go back"}
                </Button>
                <Button
                    variant={intent === "cancelled" ? "destructive" : "default"}
                    disabled={busy}
                    onClick={() => void onConfirm(note)}
                >
                    {busy ? "Saving…" : copy.action}
                </Button>
            </div>
        </FlowStep>
    );
}

export function VisitDetail({
    visit,
    now,
    result,
    busy,
    onBack,
    onReschedule,
    onConfirm,
    onEditReminder,
    onNewVisit,
    onViewStatus,
}: {
    visit: SiteVisit;
    now: number;
    result: string;
    busy: boolean;
    onBack: () => void;
    onReschedule: () => void;
    onConfirm: (intent: VisitIntent) => void;
    onEditReminder: () => void;
    onNewVisit: () => void;
    onViewStatus: () => void;
}) {
    const state = visitState(visit, now);
    const client = PREVIEW_CLIENTS.find((c) => c.id === visit.clientId);
    const property = PREVIEW_PROPERTIES.find((p) => p.id === visit.propertyId);
    const live = visit.status === "scheduled";
    const ended = state === "needs_update";
    const minutes = Math.round((Date.parse(visit.endsAt) - Date.parse(visit.startsAt)) / 60_000);
    const reminder =
        REMINDERS.find((r) => r.value === visit.reminderMinutes)?.label ?? "No extra reminder";
    const title =
        result ||
        (ended
            ? "Did you attend this visit?"
            : state === "running"
              ? "Your site visit starts now"
              : state === "completed"
                ? "Visit completed"
                : state === "not_attended"
                  ? "Visit not attended"
                  : state === "cancelled"
                    ? "Visit cancelled"
                    : "Visit details");
    const description = ended
        ? "Your scheduled time has ended. Record attendance or choose another time."
        : state === "running"
          ? `${formatVisitTime(visit.startsAt)} · Your visit is now in Running until ${formatVisitTime(visit.endsAt)}.`
          : state === "completed"
            ? "Attendance is recorded. This visit is saved under Completed."
            : state === "not_attended"
              ? "This result stays in your history. Schedule a new visit when ready."
              : state === "cancelled"
                ? "The visit is cancelled and its reminder has been stopped."
                : result === "Visit rescheduled"
                  ? "The new time is saved. Your old reminder has been replaced."
                  : "Manage the visit time, reminder and meeting details.";
    return (
        <>
            <Button variant="ghost" className={styles.back} onClick={onBack}>
                <ArrowLeft aria-hidden />
                Back to visits
            </Button>
            <header className={styles.heading}>
                <div>
                    <h1 className="h3 text-ink">{title}</h1>
                    <p>{description}</p>
                </div>
            </header>
            {result && (
                <p role="status" className={styles.success}>
                    <CheckCircle2 aria-hidden />
                    {result}
                </p>
            )}
            <div className={styles.workGrid}>
                <section className={styles.panel} aria-label="Visit details">
                    <div className={styles.panelHeader}>
                        <VisitStatusBadge state={state} />
                        <h2 className={styles.propertyHeading}>{property?.title}</h2>
                        <p>
                            {property?.configLabel} · {property?.locality}, {property?.city}
                        </p>
                    </div>
                    <div className={styles.detailBody}>
                        <div className={styles.detailSection}>
                            <h3>
                                <CalendarDays aria-hidden />
                                {formatVisitDate(visit.startsAt)}
                            </h3>
                            <strong>
                                {formatVisitTime(visit.startsAt)} – {formatVisitTime(visit.endsAt)}{" "}
                                · {minutes} minutes · IST
                            </strong>
                        </div>
                        <div className={styles.detailSection}>
                            <div className={styles.person}>
                                <User aria-hidden />
                                <div>
                                    <strong>{client?.name}</strong>
                                    <p>Client · {client?.type}</p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.detailSection}>
                            <h3>
                                <MapPin aria-hidden />
                                Meeting point
                            </h3>
                            <p>{property?.address}</p>
                        </div>
                        <div className={styles.detailSection}>
                            <h3>
                                {live
                                    ? "Visit note"
                                    : visit.status === "completed"
                                      ? "Visit outcome note"
                                      : visit.status === "cancelled"
                                        ? "Cancellation reason"
                                        : "Reason"}
                            </h3>
                            <p className={styles.note}>
                                {live
                                    ? visit.notes || "No note added."
                                    : visit.attendanceNote || "No note added."}
                            </p>
                        </div>
                        <div className={styles.detailSection}>
                            <p className={styles.iconText}>
                                <Bell aria-hidden />
                                {live
                                    ? ended
                                        ? "Visit ended · Attendance not yet recorded"
                                        : state === "running"
                                          ? `Start notification · ${formatVisitTime(visit.startsAt)}`
                                          : visit.reminderMinutes
                                            ? `Extra reminder: ${reminder} · ${formatVisitTime(new Date(Date.parse(visit.startsAt) - visit.reminderMinutes * 60_000).toISOString())}`
                                            : "No extra reminder"
                                    : "No upcoming reminder"}
                            </p>
                        </div>
                    </div>
                </section>
                <aside className={styles.aside}>
                    <section className={styles.visitActions}>
                        <h2>{ended ? "Record attendance" : "Visit actions"}</h2>
                        <div className={styles.stackedActions}>
                            {ended ? (
                                <>
                                    <Button disabled={busy} onClick={() => onConfirm("completed")}>
                                        Attended
                                    </Button>
                                    <Button
                                        variant="outline"
                                        disabled={busy}
                                        onClick={() => onConfirm("not_attended")}
                                    >
                                        Not attended
                                    </Button>
                                    <Button
                                        variant="outline"
                                        disabled={busy}
                                        onClick={onReschedule}
                                    >
                                        Reschedule visit
                                    </Button>
                                </>
                            ) : live ? (
                                <>
                                    <Button disabled={busy} onClick={onReschedule}>
                                        Reschedule visit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        disabled={busy}
                                        onClick={onEditReminder}
                                    >
                                        Edit extra reminder
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        disabled={busy}
                                        onClick={() => onConfirm("cancelled")}
                                    >
                                        Cancel visit
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button disabled={busy} onClick={onViewStatus}>
                                        View{" "}
                                        {state === "completed"
                                            ? "completed"
                                            : state === "not_attended"
                                              ? "not attended"
                                              : "upcoming"}{" "}
                                        visits
                                    </Button>
                                    <Button variant="outline" disabled={busy} onClick={onNewVisit}>
                                        Schedule a new visit
                                    </Button>
                                </>
                            )}
                        </div>
                    </section>
                    <div className={ended ? styles.warning : styles.summary}>
                        <h3>
                            {ended
                                ? "Time passing is not attendance"
                                : live
                                  ? state === "running"
                                      ? `What happens at ${formatVisitTime(visit.endsAt)}?`
                                      : "Attendance after the visit"
                                  : "Your record is kept"}
                        </h3>
                        <p>
                            {ended
                                ? "Your visit stays in Needs update until you record what happened."
                                : live
                                  ? "At the end time, choose Attended, Not attended, or Reschedule."
                                  : "Scheduling another visit keeps this result in your history."}
                        </p>
                    </div>
                    <div className={styles.asideSection}>
                        <h3>
                            <Clock aria-hidden />
                            Activity
                        </h3>
                        <ol className={styles.history}>
                            {visit.history.map((event, i) => (
                                <li key={`${event.at}-${i}`}>
                                    <span>{event.label}</span>
                                    <time dateTime={event.at}>
                                        {formatVisitDate(event.at)} · {formatVisitTime(event.at)}
                                    </time>
                                </li>
                            ))}
                        </ol>
                    </div>
                </aside>
            </div>
        </>
    );
}
