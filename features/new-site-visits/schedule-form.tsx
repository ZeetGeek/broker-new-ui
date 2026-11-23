"use client";

import { type FormEvent, useEffect, useId, useMemo, useState } from "react";
import toast from "react-hot-toast";

import type { BookableLead, BrokerVisit } from "@/lib/api/site-visits";
import { formatPersonName } from "@/lib/format/person-name";
import { MAX_CHARS } from "@/lib/validation/text-limits";
import { formatVisitDate, formatVisitTime, inputValueInIst } from "@/lib/visits/time";

import { CharacterCount } from "@/components/shared/character-count";
import { revealDrawerSections } from "@/components/shared/drawer-section";
import { Bell, Building2, UserRound } from "@/components/shared/icons";
import { mapFilterPersonToPicker } from "@/components/shared/map-to-people-picker-person";
import { mapVisitLeadPropertyToPicker } from "@/components/shared/map-to-property-picker-property";
import { PeopleInlineSelect } from "@/components/shared/people-inline-select";
import { PropertyInlineSelect } from "@/components/shared/property-inline-select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
    FORM_SECTIONS_CLASS,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

import {
    bookableDates,
    draftForLead,
    DURATION_CHIPS,
    isTimeTaken,
    rescheduleDraft,
    validateVisitDraft,
    type VisitDraft,
    visitErrorMessage,
} from "./model";
import { TimeChips } from "./time-chips";
import { useBookableLeads, useFreeTimes, useVisitMutations } from "./use-visits";
import { VisitOverlay } from "./visit-overlay";
import { VisitDatePicker } from "./visit-pickers";
import { VisitReminderPicker } from "./visit-reminder-picker";

import styles from "./visits.module.css";

/**
 * Book a visit, or move one (`visit`). Client → property → length → date →
 * a free start time from the server, so a time shown is a time that books.
 */
export function ScheduleForm({
    visit,
    intent,
    intentMissed = false,
    onDone,
    onBack,
}: {
    visit?: BrokerVisit;
    intent?: BookableLead | null;
    intentMissed?: boolean;
    onDone: () => void;
    onBack: () => void;
}) {
    const formId = useId();
    const [openedAt] = useState(() => Date.now());
    const [now, setNow] = useState(openedAt);
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 15_000);
        return () => window.clearInterval(timer);
    }, []);
    const dates = useMemo(() => bookableDates(openedAt), [openedAt]);
    const [initial] = useState<VisitDraft>(() => {
        if (visit) return rescheduleDraft(visit, openedAt);
        return { ...draftForLead(intent), date: dates[0] };
    });
    const [draft, setDraft] = useState(initial);
    const [submitted, setSubmitted] = useState(false);
    const [saveError, setSaveError] = useState("");
    const leadsQuery = useBookableLeads();
    const { book, reschedule, updateReminders } = useVisitMutations();
    const busy = book.isPending || reschedule.isPending || updateReminders.isPending;
    const leads = useMemo(() => leadsQuery.data ?? [], [leadsQuery.data]);

    const clientPeople = useMemo(
        () =>
            [...new Map(leads.map((lead) => [lead.clientId, lead])).values()]
                .map((lead) =>
                    mapFilterPersonToPicker({ id: lead.clientId, name: lead.clientName }, "client"),
                )
                .sort((a, b) => a.name.localeCompare(b.name)),
        [leads],
    );
    const clientLeads = leads.filter((lead) => lead.clientId === draft.clientId);
    const propertyPickerRows = useMemo(
        () =>
            clientLeads.map((lead) =>
                mapVisitLeadPropertyToPicker({
                    propertyId: lead.propertyId,
                    propertyTitle: lead.propertyTitle,
                }),
            ),
        [clientLeads],
    );

    const free = useFreeTimes(
        draft.propertyId && draft.leadId && draft.durationMinutes && draft.date
            ? {
                  propertyId: draft.propertyId,
                  leadId: draft.leadId,
                  date: draft.date,
                  durationMinutes: draft.durationMinutes,
                  excludeShowingId: visit?.id,
              }
            : null,
    );

    const patch = (next: Partial<VisitDraft>) => {
        setSaveError("");
        setDraft((current) => ({ ...current, ...next }));
    };
    const chooseClient = (clientId: string) => {
        const own = leads.filter((lead) => lead.clientId === clientId);
        const only = own.length === 1 ? own[0] : undefined;
        patch({
            clientId,
            propertyId: only?.propertyId ?? "",
            leadId: only?.leadId ?? "",
            startAt: "",
        });
    };
    const chooseProperty = (propertyId: string) => {
        const lead = clientLeads.find((item) => item.propertyId === propertyId);
        patch({ propertyId, leadId: lead?.leadId ?? "", startAt: "" });
    };

    const errors = validateVisitDraft(draft, now);
    const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy) return;
        setSubmitted(true);
        // Check against the clock at submit, not the last tick.
        const valid = Object.keys(validateVisitDraft(draft, Date.now())).length === 0;
        if (!valid || !draft.durationMinutes) {
            revealDrawerSections(event.currentTarget);
            const form = event.currentTarget;
            requestAnimationFrame(() =>
                form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
            );
            return;
        }
        const notes = draft.notes.trim();
        try {
            const onlyReminders =
                !!visit &&
                draft.startAt === visit.startsAt &&
                draft.durationMinutes === visit.durationMinutes &&
                notes === visit.notes.trim();
            if (visit && onlyReminders) {
                await updateReminders.mutateAsync({ id: visit.id, reminders: draft.reminders });
                toast.success("Reminders updated");
            } else if (visit) {
                await reschedule.mutateAsync({
                    id: visit.id,
                    startAt: draft.startAt,
                    durationMinutes: draft.durationMinutes,
                    notes,
                    reminders: draft.reminders,
                });
                toast.success("Visit moved");
            } else {
                await book.mutateAsync({
                    propertyId: draft.propertyId,
                    leadId: draft.leadId,
                    startAt: draft.startAt,
                    durationMinutes: draft.durationMinutes,
                    ...(notes ? { notes } : {}),
                    reminders: draft.reminders,
                });
                toast.success("Visit scheduled");
            }
            onDone();
        } catch (error) {
            setSaveError(visitErrorMessage(error));
            // Keep what was entered; drop the time only if someone took it meanwhile.
            if (isTimeTaken(error)) setDraft((current) => ({ ...current, startAt: "" }));
            void free.refetch();
        }
    };

    const show = (key: keyof VisitDraft) => (submitted ? errors[key] : undefined);
    const noLeads = !visit && leadsQuery.isSuccess && leads.length === 0;

    return (
        <VisitOverlay
            title={visit ? "Reschedule visit" : "Schedule a visit"}
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
                        disabled={busy || noLeads}
                        loading={busy}
                    >
                        {busy ? "Saving…" : visit ? "Save new time" : "Schedule visit"}
                    </Button>
                </>
            )}
        >
            <form id={formId} onSubmit={submit} noValidate>
                <fieldset disabled={busy} className="m-0 border-0 p-0 min-inline-0">
                    <div className={FORM_SECTIONS_CLASS}>
                        {intentMissed && (
                            <p role="alert" className={styles.conflict}>
                                This deal can&apos;t be booked here. Visits can be booked for open
                                deals on your own listings. Choose a client below.
                            </p>
                        )}
                        <WizardSection
                            title="Client and property"
                            description={
                                visit
                                    ? "The client and property for this visit."
                                    : "Choose who is visiting and the property they want to see."
                            }
                        >
                            {noLeads ? (
                                <p className="body-sm text-ink-muted">
                                    No clients to book for yet. A visit can be booked once a client
                                    has an open deal on one of your own listings.
                                </p>
                            ) : visit ? (
                                <div className="flex flex-col gap-2">
                                    <p className="body-sm flex items-center gap-2 text-ink">
                                        <UserRound
                                            aria-hidden
                                            className="shrink-0 block-4 inline-4"
                                        />
                                        {formatPersonName(visit.clientName)}
                                    </p>
                                    <p className="body-sm flex items-center gap-2 text-ink">
                                        <Building2
                                            aria-hidden
                                            className="shrink-0 block-4 inline-4"
                                        />
                                        {visit.propertyTitle}, {visit.locality}
                                    </p>
                                    <p className="body-xs text-ink-muted">
                                        Now {formatVisitDate(visit.startsAt)},{" "}
                                        {formatVisitTime(visit.startsAt)} IST
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className={styles.field}>
                                        <label
                                            htmlFor={`${formId}-client`}
                                            className="text-sm font-semibold text-ink"
                                        >
                                            Client
                                            <span
                                                aria-label="required"
                                                className="ms-1 text-danger"
                                            >
                                                *
                                            </span>
                                        </label>
                                        <PeopleInlineSelect
                                            id={`${formId}-client`}
                                            lockedScope="client"
                                            people={clientPeople}
                                            value={draft.clientId || null}
                                            onValueChange={(id) => chooseClient(id ?? "")}
                                            disabled={busy || leadsQuery.isPending}
                                            errorText={show("clientId")}
                                            placeholder="Select a client"
                                            size="md"
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label
                                            htmlFor={`${formId}-property`}
                                            className="text-sm font-semibold text-ink"
                                        >
                                            Property
                                            <span
                                                aria-label="required"
                                                className="ms-1 text-danger"
                                            >
                                                *
                                            </span>
                                        </label>
                                        <PropertyInlineSelect
                                            id={`${formId}-property`}
                                            properties={propertyPickerRows}
                                            value={draft.propertyId || null}
                                            onValueChange={(id) => chooseProperty(id ?? "")}
                                            disabled={busy || !draft.clientId}
                                            errorText={show("propertyId")}
                                            helperText={
                                                !draft.clientId
                                                    ? "Choose a client first."
                                                    : undefined
                                            }
                                            placeholder="Select a property"
                                            size="md"
                                        />
                                    </div>
                                </div>
                            )}
                        </WizardSection>

                        {!noLeads && (
                            <WizardSection
                                title="Visit date and time"
                                description="Choose how long, the date and a free start time. All times are in India time (IST)."
                            >
                                <div className="flex flex-col gap-4">
                                    <div className={styles.field}>
                                        <span
                                            id={`${formId}-length`}
                                            className="text-sm font-semibold text-ink"
                                        >
                                            How long
                                            <span
                                                aria-label="required"
                                                className="ms-1 text-danger"
                                            >
                                                *
                                            </span>
                                        </span>
                                        <div
                                            role="group"
                                            aria-labelledby={`${formId}-length`}
                                            className="flex flex-wrap gap-2"
                                        >
                                            {DURATION_CHIPS.map((chip) => (
                                                <Button
                                                    key={chip.value}
                                                    type="button"
                                                    size="md"
                                                    variant={
                                                        draft.durationMinutes === chip.value
                                                            ? "accent"
                                                            : "outline"
                                                    }
                                                    aria-pressed={
                                                        draft.durationMinutes === chip.value
                                                    }
                                                    aria-invalid={
                                                        Boolean(show("durationMinutes")) ||
                                                        undefined
                                                    }
                                                    onClick={() =>
                                                        patch({
                                                            durationMinutes: chip.value,
                                                            startAt: "",
                                                        })
                                                    }
                                                >
                                                    {chip.label}
                                                </Button>
                                            ))}
                                        </div>
                                        {show("durationMinutes") && (
                                            <p role="alert" className={styles.fieldError}>
                                                {show("durationMinutes")}
                                            </p>
                                        )}
                                    </div>
                                    <div className={styles.field}>
                                        <label
                                            htmlFor={`${formId}-date`}
                                            className="text-sm font-semibold text-ink"
                                        >
                                            Visit date
                                            <span
                                                aria-label="required"
                                                className="ms-1 text-danger"
                                            >
                                                *
                                            </span>
                                        </label>
                                        <VisitDatePicker
                                            id={`${formId}-date`}
                                            value={draft.date}
                                            minDate={dates[0]}
                                            maxDate={dates[dates.length - 1]}
                                            onChange={(date) => patch({ date, startAt: "" })}
                                            disabled={busy}
                                            error={show("date")}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <span
                                            id={`${formId}-start`}
                                            className="text-sm font-semibold text-ink"
                                        >
                                            Start time (IST)
                                            <span
                                                aria-label="required"
                                                className="ms-1 text-danger"
                                            >
                                                *
                                            </span>
                                        </span>
                                        <TimeChips
                                            labelledBy={`${formId}-start`}
                                            ready={Boolean(
                                                draft.leadId && draft.durationMinutes && draft.date,
                                            )}
                                            loading={free.isFetching}
                                            failed={free.isError}
                                            starts={free.data ?? []}
                                            value={draft.startAt}
                                            onChange={(startAt) => patch({ startAt })}
                                            invalid={Boolean(show("startAt"))}
                                        />
                                        {show("startAt") && (
                                            <p role="alert" className={styles.fieldError}>
                                                {show("startAt")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </WizardSection>
                        )}

                        {!noLeads && (
                            <WizardSection
                                title="Reminders"
                                description="Choose when you want to be reminded before the visit starts."
                            >
                                <div className="flex flex-col gap-4">
                                    {draft.date && draft.startAt ? (
                                        <VisitReminderPicker
                                            reminders={draft.reminders}
                                            date={draft.date}
                                            startTime={inputValueInIst(draft.startAt).slice(11)}
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
                                            Pick a start time to set reminders.
                                        </p>
                                    )}
                                    {draft.date && draft.startAt && show("reminders") && (
                                        <p role="alert" className={styles.fieldError}>
                                            {show("reminders")}
                                        </p>
                                    )}
                                </div>
                            </WizardSection>
                        )}

                        {!noLeads && (
                            <WizardSection
                                title="Visit notes"
                                description="Add a meeting point or anything to remember for this visit."
                            >
                                <div className={styles.field}>
                                    <label
                                        htmlFor={`${formId}-notes`}
                                        className="text-sm font-semibold text-ink"
                                    >
                                        Notes (optional)
                                    </label>
                                    <Textarea
                                        id={`${formId}-notes`}
                                        className={styles.notesInput}
                                        value={draft.notes}
                                        onChange={(event) => patch({ notes: event.target.value })}
                                        maxLength={MAX_CHARS.visitNote}
                                        rows={4}
                                        placeholder="Meeting point or anything to remember"
                                        aria-invalid={Boolean(show("notes")) || undefined}
                                        aria-describedby={`${formId}-notes-count`}
                                    />
                                    <CharacterCount
                                        id={`${formId}-notes-count`}
                                        value={draft.notes}
                                        maxChars={MAX_CHARS.visitNote}
                                    />
                                    {show("notes") && (
                                        <p role="alert" className={styles.fieldError}>
                                            {show("notes")}
                                        </p>
                                    )}
                                </div>
                            </WizardSection>
                        )}
                    </div>
                </fieldset>
            </form>
        </VisitOverlay>
    );
}
