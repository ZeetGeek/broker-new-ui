"use client";

import Link from "next/link";

import type { BrokerVisit } from "@/lib/api/site-visits";
import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import { CalendarDays, CalendarPlus, Clock, MapPin, Plus } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

import { getVisitActions, visitDurationLabel, visitState } from "./model";
import { VISIT_ACTIONS } from "./visit-actions";
import { VisitOverlay } from "./visit-overlay";
import { VisitStatusBadge } from "./visit-status";

import styles from "./visits.module.css";

export type VisitIntent = "completed" | "not_attended" | "cancelled";

const CONFIRM_COPY: Record<VisitIntent, { title: string; description: string; action: string }> = {
    completed: {
        title: "Mark visit as completed?",
        description: "The client came and saw the property. The deal stays in its stage.",
        action: "Mark completed",
    },
    not_attended: {
        title: "Mark visit as not attended?",
        description: "The visit stays in your history. You can book another when ready.",
        action: "Mark not attended",
    },
    cancelled: {
        title: "Cancel this visit?",
        description: "The time is freed for other visits. The visit stays in your history.",
        action: "Cancel visit",
    },
};

export function AttendanceConfirmation({
    visit,
    intent,
    busy,
    error,
    onClose,
    onConfirm,
}: {
    visit: BrokerVisit;
    intent: VisitIntent;
    busy: boolean;
    error: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}) {
    const copy = CONFIRM_COPY[intent];
    const correcting = visit.status === "completed" || visit.status === "no_show";
    return (
        <VisitOverlay
            compact
            title={
                correcting
                    ? `Change to ${intent === "completed" ? "Completed" : "Not attended"}?`
                    : copy.title
            }
            description={correcting ? "Correct what happened at this visit." : copy.description}
            busy={busy}
            onClose={onClose}
            error={error}
            footer={(close) => (
                <>
                    <Button variant="outline" disabled={busy} onClick={close}>
                        {intent === "cancelled" ? "Keep visit" : "Go back"}
                    </Button>
                    <Button
                        variant={intent === "cancelled" ? "destructive" : "accent"}
                        disabled={busy}
                        loading={busy}
                        onClick={() => void onConfirm()}
                    >
                        {busy ? "Saving…" : copy.action}
                    </Button>
                </>
            )}
        >
            <div className={styles.confirmSummary}>
                <strong>{visit.clientName}</strong>
                <span>
                    {visit.propertyTitle} · {visit.locality}
                </span>
                <span>
                    {formatVisitDate(visit.startsAt)} · {formatVisitTime(visit.startsAt)} –{" "}
                    {formatVisitTime(visit.endsAt)} IST
                </span>
            </div>
        </VisitOverlay>
    );
}

export function VisitDetail({
    visit,
    now,
    busy,
    onBack,
    onConfirm,
    onReschedule,
    onScheduleAnother,
}: {
    visit: BrokerVisit;
    now: number;
    busy: boolean;
    onBack: () => void;
    onConfirm: (intent: VisitIntent) => void;
    onReschedule: () => void;
    onScheduleAnother: () => void;
}) {
    const state = visitState(visit, now);
    const waitingForOwner = visit.status === "scheduled" && !visit.isExclusive;
    const primary = (action: string) => action === "completed" || action === "reschedule";
    return (
        <VisitOverlay
            title="Visit details"
            busy={busy}
            onClose={onBack}
            footer={(close) => (
                <div className={styles.detailFooter}>
                    {visit.isExclusive && (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={onScheduleAnother}
                        >
                            <CalendarPlus aria-hidden />
                            Book another visit
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        render={
                            <Link
                                href={`/broker/tasks?${new URLSearchParams({ view: "create", visitClient: visit.clientId, visitProperty: visit.propertyId, visitTitle: `Follow up with ${visit.clientName} after ${visit.propertyTitle}` })}`}
                            />
                        }
                    >
                        <Plus aria-hidden />
                        Create follow-up task
                    </Button>
                    {getVisitActions(visit, now)
                        .sort((a, b) => {
                            const rank = (action: keyof typeof VISIT_ACTIONS) =>
                                VISIT_ACTIONS[action].danger ? 0 : primary(action) ? 2 : 1;
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
                                        danger ? "ghost" : primary(action) ? "accent" : "outline"
                                    }
                                    onClick={() => {
                                        if (action === "reschedule") onReschedule();
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
                        <h2>{visit.propertyTitle}</h2>
                        <p>
                            {visit.locality}
                            {visit.city && visit.city !== visit.locality ? `, ${visit.city}` : ""}
                        </p>
                    </div>
                    <VisitStatusBadge state={state} />
                </div>
                {waitingForOwner && (
                    <p className={styles.muted}>Waiting for the owner to confirm this time.</p>
                )}
                {state === "needs_update" && (
                    <div className={styles.attendancePrompt}>
                        <Clock aria-hidden />
                        <div>
                            <strong>Did this visit happen?</strong>
                            <p>The visit time has ended. Mark what happened, or move it.</p>
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
                            <span>{visitDurationLabel(visit.durationMinutes)} · IST</span>
                            <p>
                                {formatVisitTime(visit.startsAt)} – {formatVisitTime(visit.endsAt)}
                            </p>
                        </div>
                    </div>
                </section>
                <section className={styles.detailGroup} aria-label="Client and place">
                    <div className={styles.detailLine}>
                        <UserAvatar name={visit.clientName} size="sm" />
                        <div>
                            <span>Client</span>
                            <strong>{visit.clientName}</strong>
                        </div>
                    </div>
                    <div className={`${styles.detailLine} ${styles.detailMeetingPoint}`}>
                        <span className={styles.meetingPointIcon} aria-hidden>
                            <MapPin />
                        </span>
                        <div>
                            <span>Place</span>
                            <strong>
                                {visit.locality}
                                {visit.city && visit.city !== visit.locality
                                    ? `, ${visit.city}`
                                    : ""}
                            </strong>
                        </div>
                    </div>
                </section>
                {visit.notes && (
                    <section className={styles.detailNotes} aria-label="Visit notes">
                        <div>
                            <h3>Notes</h3>
                            <p className={styles.note}>{visit.notes}</p>
                        </div>
                    </section>
                )}
            </div>
        </VisitOverlay>
    );
}
