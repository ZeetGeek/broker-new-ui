"use client";

import { useId, useState } from "react";

import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import { CalendarDays, Clock, MapPin } from "@/components/shared/icons";
import { PropertyPhotoGallery } from "@/components/shared/property-photo-gallery";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
    getVisitActions,
    type SiteVisit,
    visitReminderLabel,
    visitReminders,
    visitState,
} from "./model";
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
    const reminders = visitReminders(visit);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    return (
        <VisitOverlay
            title="Visit details"
            lightboxOpen={lightboxOpen}
            busy={busy}
            onClose={onBack}
            footer={(close) => (
                <div className={styles.detailFooter}>
                    {getVisitActions(visit, now)
                        .sort((a, b) => {
                            const rank = (action: string) =>
                                VISIT_ACTIONS[action as keyof typeof VISIT_ACTIONS].danger
                                    ? 0
                                    : action === "completed" || action === "edit"
                                      ? 2
                                      : 1;
                            return rank(a) - rank(b);
                        })
                        .map((action) => {
                            const { label, icon: Icon, danger } = VISIT_ACTIONS[action];
                            return (
                                <Button
                                    key={action}
                                    size="sm"
                                    className={danger ? styles.detailFooterDanger : undefined}
                                    disabled={busy}
                                    variant={
                                        danger
                                            ? "ghost"
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
                </div>
            )}
        >
            <div className={styles.detailLayout}>
                <div className={styles.detailProperty}>
                    <div>
                        <h2>{property?.title ?? "Property not available"}</h2>
                        <p>
                            {property?.configLabel} · {property?.locality}, {property?.city}
                        </p>
                    </div>
                    <VisitStatusBadge state={state} />
                </div>
                <PropertyPhotoGallery
                    key={visit.propertyId}
                    thumbnailPosition="right"
                    property={{
                        title: property?.title ?? "Property",
                        imageSrc: property?.imageUrl ?? "",
                        imageSrcs: property?.imageUrls,
                    }}
                    onLightboxChange={setLightboxOpen}
                />
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
                <section className={styles.detailSchedule} aria-label="Visit date and time">
                    <div>
                        <CalendarDays aria-hidden />
                        <div>
                            <span>Visit date</span>
                            <time dateTime={visit.startsAt}>{formatVisitDate(visit.startsAt)}</time>
                        </div>
                    </div>
                    <div>
                        <Clock aria-hidden />
                        <div>
                            <span>{minutes} minutes · IST</span>
                            <p>
                                {formatVisitTime(visit.startsAt)} – {formatVisitTime(visit.endsAt)}
                            </p>
                        </div>
                    </div>
                </section>
                <section
                    className={styles.detailGroup}
                    aria-label="Client, owner and meeting point"
                >
                    <div className={styles.detailLine}>
                        <UserAvatar name={client?.name ?? "Client"} size="sm" />
                        <div>
                            <span>Client</span>
                            <strong>{client?.name ?? "Client not available"}</strong>
                        </div>
                    </div>
                    <div className={styles.detailLine}>
                        <UserAvatar
                            name={property?.owner?.name ?? "Owner"}
                            imageUrl={property?.owner?.imageUrl}
                            size="sm"
                        />
                        <div>
                            <span>Owner</span>
                            <strong>{property?.owner?.name ?? "Not added"}</strong>
                        </div>
                    </div>
                    <div className={`${styles.detailLine} ${styles.detailMeetingPoint}`}>
                        <span className={styles.meetingPointIcon} aria-hidden>
                            <MapPin />
                        </span>
                        <div>
                            <span>Meeting point</span>
                            <strong>{property?.address || "No meeting point added"}</strong>
                        </div>
                    </div>
                </section>
                <section
                    className={styles.detailReminders}
                    aria-labelledby="visit-reminders-heading"
                >
                    <div className={styles.detailSectionHeading}>
                        <h3 id="visit-reminders-heading">Reminders</h3>
                        {!live && reminders.length > 0 && <span>Reminders stopped</span>}
                    </div>
                    {reminders.length > 0 ? (
                        <TooltipProvider>
                            <ul className={styles.detailReminderList} aria-label="Visit reminders">
                                {reminders.map((reminder) => (
                                    <li key={reminder.key}>
                                        <Tooltip>
                                            <TooltipTrigger
                                                render={
                                                    <span
                                                        tabIndex={0}
                                                        className={styles.detailReminderChip}
                                                    />
                                                }
                                            >
                                                {visitReminderLabel(reminder.minutes).replace(
                                                    /\bminutes?\b/g,
                                                    "min",
                                                )}
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <time dateTime={reminder.at}>
                                                    {formatVisitDate(reminder.at)} ·{" "}
                                                    {formatVisitTime(reminder.at)} IST
                                                </time>
                                                {" · "}
                                                {!live
                                                    ? "Stopped"
                                                    : Date.parse(reminder.at) <= now
                                                      ? "Time passed"
                                                      : "Upcoming"}
                                            </TooltipContent>
                                        </Tooltip>
                                    </li>
                                ))}
                            </ul>
                        </TooltipProvider>
                    ) : (
                        <p className={styles.muted}>No reminders set for this visit.</p>
                    )}
                </section>
                {(visit.notes || visit.attendanceNote) && (
                    <section className={styles.detailNotes} aria-label="Visit notes">
                        {visit.notes && (
                            <div>
                                <h3>Notes</h3>
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
