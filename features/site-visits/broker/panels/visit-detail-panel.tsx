"use client";

import { VISIT_STATUS } from "@/lib/visits/status";
import { formatVisitDate, formatVisitDayHeading, formatVisitTime } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { AppModalHeader } from "@/components/shared/app-modal-header";
import { CalendarCheck, CallIcon, MapPin, Trash2, WhatsAppIcon } from "@/components/shared/icons";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogPopup } from "@/components/ui/dialog";

import { APP_NAME } from "@/config";
import type { BrokerSiteVisit } from "@/features/site-visits/broker/model";
import { USE_MOCK_VISITS } from "@/mocks/visits";
import { useAppSelector } from "@/store/hooks";

function ContactBlock({
    label,
    person,
    message,
}: {
    label: string;
    person: BrokerSiteVisit["owner"];
    message: string;
}) {
    const whatsapp = person.phoneDigits
        ? `https://wa.me/91${person.phoneDigits}?text=${encodeURIComponent(message)}`
        : undefined;
    return (
        <div className="flex items-center gap-3 rounded-inner bg-surface-muted p-3">
            <UserAvatar name={person.name} imageUrl={person.avatarUrl} size="md" />
            <div className="flex-1 min-inline-0">
                <p className="text-[10px] text-ink-subtle">{label}</p>
                <p className="body-sm truncate font-bold text-ink">{person.name}</p>
                {person.requirement ? (
                    <p className="body-xs truncate text-ink-muted">{person.requirement}</p>
                ) : null}
            </div>
            {person.phoneDigits ? (
                <div className="flex gap-1">
                    <Button
                        nativeButton={false}
                        render={<a href={`tel:+91${person.phoneDigits}`} />}
                        variant="surface"
                        size="md"
                        aria-label={`Call ${person.name}`}
                    >
                        <CallIcon aria-hidden />
                    </Button>
                    <Button
                        nativeButton={false}
                        render={<a href={whatsapp} target="_blank" rel="noreferrer" />}
                        variant="surface"
                        size="md"
                        aria-label={`WhatsApp ${person.name}`}
                    >
                        <WhatsAppIcon aria-hidden />
                    </Button>
                </div>
            ) : null}
        </div>
    );
}

export function VisitDetailPanel({
    open,
    visit,
    onClose,
    onLogOutcome,
    onReschedule,
    onCancel,
}: {
    open: boolean;
    visit?: BrokerSiteVisit;
    onClose: () => void;
    onLogOutcome: () => void;
    onReschedule: () => void;
    onCancel: () => void;
}) {
    const broker = useAppSelector((state) => state.auth.user);
    if (!visit) return null;
    const brokerName = broker?.fullName?.trim() || broker?.email || "Your broker";
    const dayAndTime = `${formatVisitDayHeading(visit.startsAt)} at ${formatVisitTime(visit.startsAt)}`;
    const buyerMessage = `Hi ${visit.buyers[0].name}, your site visit for ${visit.property.title}, ${visit.property.locality} is ${visit.status === "confirmed" ? "confirmed" : "scheduled"} for ${dayAndTime}. Address: ${visit.property.address}. I’ll meet you there. — ${brokerName}, ${APP_NAME}`;
    const ownerMessage = `Hi ${visit.owner.name}, I’m bringing ${visit.buyers[0].name} to ${visit.property.title} on ${dayAndTime}. — ${brokerName}, ${APP_NAME}`;
    const status = VISIT_STATUS[visit.status];
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
        >
            <DialogPopup
                showCloseButton={false}
                className="
                  inset-s-0! inset-bs-auto! inset-be-0! flex translate-0! flex-col gap-0
                  overflow-hidden rounded-b-none p-0 inline-full max-block-[94dvh] max-inline-none
                  sm:inset-s-auto! sm:inset-e-0! sm:inset-bs-0! sm:rounded-none sm:block-full
                  sm:inline-[520px] sm:max-block-none sm:max-inline-[520px]
                "
            >
                <AppModalHeader title={status.label} />
                <div className={`shrink-0 px-5 py-4 ${status.tone}`}>
                    <p className="body-sm text-ink-muted">
                        {formatVisitDate(visit.startsAt)} · {formatVisitTime(visit.startsAt)}–
                        {formatVisitTime(visit.endsAt)}
                    </p>
                </div>
                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                    <section className="flex gap-3">
                        <div
                            className="
                              relative shrink-0 overflow-hidden rounded-[8px] bg-surface-muted block-20 inline-24
                            "
                        >
                            <AppImage
                                src={
                                    visit.property.coverUrl ??
                                    "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                                }
                                alt=""
                                fill
                                sizes="96px"
                            />
                        </div>
                        <div className="min-inline-0">
                            <h2 className="h5 truncate text-ink">{visit.property.title}</h2>
                            <p className="body-xs mbs-1 text-ink-muted">
                                {visit.property.configLabel} ·{" "}
                                {visit.property.areaSqft.toLocaleString("en-IN")} sqft
                            </p>
                            <PriceWithCommission
                                amountInr={visit.property.amountInr}
                                isRent={visit.property.purpose === "rent"}
                                commissionPercent={visit.property.commissionPercent}
                                commissionAmountInr={visit.property.commissionAmountInr}
                                audience="broker"
                                size="sm"
                                className="mbs-2"
                            />
                            <p className="body-xs mbs-2 flex items-start gap-1.5 text-ink-muted">
                                <MapPin
                                    aria-hidden
                                    className="mbs-0.5 shrink-0 block-3.5 inline-3.5"
                                />
                                {visit.property.address}
                            </p>
                        </div>
                    </section>
                    <section className="grid gap-2">
                        <ContactBlock
                            label={
                                visit.buyers.length > 1
                                    ? `Clients · ${visit.buyers.length}`
                                    : "Client"
                            }
                            person={visit.buyers[0]}
                            message={buyerMessage}
                        />
                        <ContactBlock label="Owner" person={visit.owner} message={ownerMessage} />
                    </section>
                    {visit.ownerNote || visit.brokerNote ? (
                        <section>
                            <h3 className="body-sm font-bold text-ink">Visit notes</h3>
                            <div className="mbs-2 space-y-2">
                                {visit.ownerNote ? (
                                    <p
                                        className="
                                          body-xs rounded-inner bg-surface-muted p-3 text-ink
                                        "
                                    >
                                        <span className="font-bold">Owner:</span> {visit.ownerNote}
                                    </p>
                                ) : null}
                                {visit.brokerNote ? (
                                    <p
                                        className="
                                          body-xs rounded-inner bg-surface-muted p-3 text-ink
                                        "
                                    >
                                        <span className="font-bold">Your note:</span>{" "}
                                        {visit.brokerNote}
                                    </p>
                                ) : null}
                            </div>
                        </section>
                    ) : null}
                    {USE_MOCK_VISITS || visit.outcome ? (
                        <section className="rounded-inner border border-border-warm p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="body-sm font-bold text-ink">Outcome</h3>
                                    <p className="body-xs text-ink-muted">
                                        {visit.outcome
                                            ? `${visit.outcome.interest} · ${visit.outcome.nextStep.replaceAll("_", " ")}`
                                            : USE_MOCK_VISITS
                                              ? "Not logged yet"
                                              : "Saving outcomes is not available yet. Manage client notes and stages in Pipeline."}
                                    </p>
                                </div>
                                {!visit.outcome && USE_MOCK_VISITS ? (
                                    <Button onClick={onLogOutcome}>
                                        <CalendarCheck aria-hidden /> Log outcome
                                    </Button>
                                ) : null}
                            </div>
                            {visit.outcome?.feedback ? (
                                <p className="body-xs mbs-3 text-ink-muted">
                                    {visit.outcome.feedback}
                                </p>
                            ) : null}
                        </section>
                    ) : null}
                    {![
                        "cancelled_by_broker",
                        "cancelled_by_owner",
                        "completed",
                        "no_show",
                        "expired",
                    ].includes(visit.status) ? (
                        <section className="flex flex-wrap gap-2 border-bs border-danger/15 pbs-4">
                            {USE_MOCK_VISITS ? (
                                <Button variant="surface" onClick={onReschedule}>
                                    Reschedule
                                </Button>
                            ) : (
                                <p className="body-xs text-ink-muted">
                                    To change the time, cancel this visit and book another open
                                    slot. Check availability before cancelling.
                                </p>
                            )}
                            <Button variant="destructive" onClick={onCancel}>
                                <Trash2 aria-hidden /> Cancel visit
                            </Button>
                        </section>
                    ) : null}
                </div>
            </DialogPopup>
        </Dialog>
    );
}
