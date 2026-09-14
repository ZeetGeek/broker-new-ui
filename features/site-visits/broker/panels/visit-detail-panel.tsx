"use client";

import dynamic from "next/dynamic";

import { CalendarCheck, Check, Circle, FileText, KeyRound, MapPin, MessageCircle, Phone, Route, SquareParking, Trash2 } from "lucide-react";

import { formatInrCompact } from "@/lib/format/inr";
import { VISIT_STATUS } from "@/lib/visits/status";
import { formatVisitDate, formatVisitDayHeading, formatVisitTime } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogPopup, DialogTitle } from "@/components/ui/dialog";

import { APP_NAME } from "@/config";
import type { BrokerSiteVisit } from "@/features/site-visits/broker/model";
import { useAppSelector } from "@/store/hooks";

const VisitDetailMap = dynamic(() => import("@/features/site-visits/broker/panels/visit-detail-map"), { ssr: false, loading: () => <div className="
  animate-pulse rounded-inner bg-surface-muted block-56 inline-full
" /> });

function ContactBlock({ label, person, message }: { label: string; person: BrokerSiteVisit["owner"]; message: string }) {
    const whatsapp = person.phoneDigits ? `https://wa.me/91${person.phoneDigits}?text=${encodeURIComponent(message)}` : undefined;
    return <div className="flex items-center gap-3 rounded-inner bg-surface-muted p-3"><UserAvatar name={person.name} imageUrl={person.avatarUrl} size="md" fallback="character" /><div className="
      flex-1 min-inline-0
    "><p className="text-[10px] text-ink-subtle">{label}</p><p className="
      body-sm truncate font-bold text-ink
    ">{person.name}</p>{person.requirement ? <p className="body-xs truncate text-ink-muted">{person.requirement}</p> : null}</div>{person.phoneDigits ? <div className="
      flex gap-1
    "><Button nativeButton={false} render={<a href={`tel:+91${person.phoneDigits}`} />} variant="surface" size="md" aria-label={`Call ${person.name}`}><Phone aria-hidden /></Button><Button nativeButton={false} render={<a href={whatsapp} target="_blank" rel="noreferrer" />} variant="surface" size="md" aria-label={`WhatsApp ${person.name}`}><MessageCircle aria-hidden /></Button></div> : null}</div>;
}

export function VisitDetailPanel({ open, visit, onClose, onLogOutcome, onReschedule, onCancel, onChecklist }: { open: boolean; visit?: BrokerSiteVisit; onClose: () => void; onLogOutcome: () => void; onReschedule: () => void; onCancel: () => void; onChecklist: (value: NonNullable<BrokerSiteVisit["checklist"]>) => void }) {
    const broker = useAppSelector((state) => state.auth.user);
    if (!visit) return null;
    const brokerName = broker?.fullName?.trim() || broker?.email || "Your broker";
    const dayAndTime = `${formatVisitDayHeading(visit.startsAt)} at ${formatVisitTime(visit.startsAt)}`;
    const buyerMessage = `Hi ${visit.buyers[0].name}, your site visit for ${visit.property.title}, ${visit.property.locality} is confirmed for ${dayAndTime}. Address: ${visit.property.address}. I’ll meet you there. — ${brokerName}, ${APP_NAME}`;
    const ownerMessage = `Hi ${visit.owner.name}, I’m bringing ${visit.buyers[0].name} to ${visit.property.title} on ${dayAndTime}. — ${brokerName}, ${APP_NAME}`;
    const status = VISIT_STATUS[visit.status];
    const checklist = visit.checklist ?? { documents: false, keys: false, parking: false };
    const mapHref = visit.property.latitude && visit.property.longitude ? `https://www.openstreetmap.org/directions?to=${visit.property.latitude},${visit.property.longitude}` : `https://www.openstreetmap.org/search?query=${encodeURIComponent(visit.property.address)}`;
    return <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}><DialogPopup className="
      inset-s-0! inset-bs-auto! inset-be-0! flex translate-0! flex-col gap-0 overflow-hidden
      rounded-b-none p-0 inline-full max-block-[94dvh] max-inline-none
      sm:inset-s-auto! sm:inset-e-0! sm:inset-bs-0! sm:rounded-none sm:block-full sm:inline-[520px]
      sm:max-block-none sm:max-inline-[520px]
    ">
        <div className="mx-auto mbs-2 rounded-full bg-border-warm block-1 inline-12 sm:hidden" aria-hidden />
        <div className={`shrink-0 px-5 py-4 pe-14 ${status.tone}`}><DialogHeader className="
          pe-0 text-start
        "><DialogTitle className="h3 font-bold text-current">{status.label}</DialogTitle><DialogDescription className="
          text-current/70
        ">{formatVisitDate(visit.startsAt)} · {formatVisitTime(visit.startsAt)}–{formatVisitTime(visit.endsAt)}</DialogDescription></DialogHeader><div className="
          mbs-3 flex items-center gap-1 text-[10px] font-semibold
        "><span className="flex items-center gap-1"><Check aria-hidden className="block-3 inline-3" /> Booked</span><span className="
          flex-1 bg-current/20 block-px
        " /><span className="flex items-center gap-1"><Check aria-hidden className="
          block-3 inline-3
        " /> Confirmed</span><span className="flex-1 bg-current/20 block-px" /><span className="
          flex items-center gap-1
        "><Circle aria-hidden className="block-3 inline-3" /> Reminded</span><span className="
          flex-1 bg-current/20 block-px
        " /><span className="flex items-center gap-1"><Circle aria-hidden className="
          block-3 inline-3
        " /> Completed</span></div></div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <section className="flex gap-3"><div className="
              relative shrink-0 overflow-hidden rounded-inner block-20 inline-24
            "><AppImage src={visit.property.coverUrl ?? "/properties/1.jpg"} alt="" fill sizes="96px" /></div><div className="
              min-inline-0
            "><h2 className="h5 truncate text-ink">{visit.property.title}</h2><p className="
              body-xs mbs-1 text-ink-muted
            ">{visit.property.configLabel} · {visit.property.areaSqft.toLocaleString("en-IN")} sqft · {formatInrCompact(visit.property.amountInr)}</p><p className="
              body-xs mbs-2 flex items-start gap-1.5 text-ink-muted
            "><MapPin aria-hidden className="mbs-0.5 shrink-0 block-3.5 inline-3.5" />{visit.property.address}</p></div></section>
            {visit.property.latitude && visit.property.longitude ? <section className="space-y-2"><VisitDetailMap latitude={visit.property.latitude} longitude={visit.property.longitude} title={visit.property.title} /><div className="
              flex items-center justify-between gap-3
            "><p className="body-xs text-ink-muted">{visit.distanceKm?.toFixed(1)} km · about {visit.driveMinutes} min from you</p><Button render={<a href={mapHref} target="_blank" rel="noreferrer" />} variant="surface" size="sm"><Route aria-hidden /> Navigate</Button></div></section> : null}
            <section className="grid gap-2"><ContactBlock label={visit.buyers.length > 1 ? `Buyers · ${visit.buyers.length}` : "Buyer"} person={visit.buyers[0]} message={buyerMessage} /><ContactBlock label="Owner" person={visit.owner} message={ownerMessage} /></section>
            {(visit.ownerNote || visit.brokerNote) ? <section><h3 className="
              body-sm font-bold text-ink
            ">Visit notes</h3><div className="mbs-2 space-y-2">{visit.ownerNote ? <p className="
              body-xs rounded-inner bg-surface-muted p-3 text-ink
            "><span className="font-bold">Owner:</span> {visit.ownerNote}</p> : null}{visit.brokerNote ? <p className="
              body-xs rounded-inner bg-surface-muted p-3 text-ink
            "><span className="font-bold">Your note:</span> {visit.brokerNote}</p> : null}</div></section> : null}
            <section><h3 className="body-sm font-bold text-ink">Before you leave</h3><div className="
              mbs-2 grid grid-cols-3 gap-2
            ">{([{ key: "documents", label: "Documents", icon: FileText }, { key: "keys", label: "Keys arranged", icon: KeyRound }, { key: "parking", label: "Parking", icon: SquareParking }] as const).map((item) => <button key={item.key} type="button" aria-pressed={checklist[item.key]} onClick={() => onChecklist({ ...checklist, [item.key]: !checklist[item.key] })} className={`
              rounded-inner border p-2 text-xs font-semibold min-block-16
              ${checklist[item.key] ? `border-brand bg-brand-soft text-brand-text` : `
                border-border-warm bg-surface text-ink-muted
              `}`}><item.icon aria-hidden className="mx-auto mbe-1 block-4 inline-4" />{item.label}</button>)}</div></section>
            <section className="rounded-inner border border-border-warm p-4"><div className="
              flex items-center justify-between gap-3
            "><div><h3 className="body-sm font-bold text-ink">Outcome</h3><p className="
              body-xs text-ink-muted
            ">{visit.outcome ? `${visit.outcome.interest} · ${visit.outcome.nextStep.replaceAll("_", " ")}` : "Not logged yet"}</p></div>{!visit.outcome ? <Button onClick={onLogOutcome}><CalendarCheck aria-hidden /> Log outcome</Button> : null}</div>{visit.outcome?.feedback ? <p className="
              body-xs mbs-3 text-ink-muted
            ">{visit.outcome.feedback}</p> : null}</section>
            <section className="flex flex-wrap gap-2 border-bs border-danger/15 pbs-4"><Button variant="surface" onClick={onReschedule}>Reschedule</Button><Button variant="destructive" onClick={onCancel}><Trash2 aria-hidden /> Cancel visit</Button></section>
        </div>
    </DialogPopup></Dialog>;
}

