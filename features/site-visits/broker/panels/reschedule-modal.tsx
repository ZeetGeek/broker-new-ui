"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { formatVisitDate, formatVisitTime, inputValueInIst, inputValueToUtc } from "@/lib/visits/time";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";

import type { BrokerSiteVisit, PropertyWithSlots } from "@/features/site-visits/broker/model";

export function RescheduleModal({ open, visit, propertySlots, onClose, onSave }: { open: boolean; visit?: BrokerSiteVisit; propertySlots?: PropertyWithSlots; onClose: () => void; onSave: (startsAt: string, endsAt: string) => Promise<void> }) {
    const [selected, setSelected] = useState("");
    const [custom, setCustom] = useState(() => visit ? inputValueInIst(visit.startsAt) : "");
    const [saveError, setSaveError] = useState<string>();
    if (!visit) return null;
    const save = async () => {
        const slot = propertySlots?.slots.find((item) => item.id === selected);
        const startsAt = slot?.startsAt ?? inputValueToUtc(custom);
        const endsAt = slot?.endsAt ?? new Date(new Date(startsAt).getTime() + 45 * 60_000).toISOString();
        setSaveError(undefined);
        try {
            await onSave(startsAt, endsAt);
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : "Could not reschedule this visit. Check your connection and try again.");
        }
    };
    return <AppModal open={open} onOpenChange={(next) => { if (!next) onClose(); }} title="Reschedule visit" description={`${visit.property.title} · the owner will be asked to confirm the new time.`} footer={<><Button variant="surface" onClick={onClose}>Keep current time</Button><Button onClick={() => void save()}>Ask to reschedule</Button></>}>
        <div className="space-y-4">{saveError ? <p role="alert" className="
          body-sm rounded-inner bg-danger-soft px-3 py-2 font-semibold text-danger
        ">{saveError}</p> : null}<div><p className="body-sm font-bold text-ink">Owner’s open slots</p><div className="
          mbs-2 flex flex-wrap gap-2
        ">{propertySlots?.slots.filter((slot) => new Date(slot.startsAt) > new Date() && slot.status === "open").slice(0, 8).map((slot) => <button key={slot.id} type="button" aria-pressed={selected === slot.id} onClick={() => setSelected(slot.id)} className={cn(`
          body-xs tabular rounded-control border border-border-warm bg-surface px-3 font-bold
          text-ink min-block-11
        `, selected === slot.id && `border-brand-ink bg-brand-ink text-surface`)}>{formatVisitDate(slot.startsAt)} · {formatVisitTime(slot.startsAt)}</button>)}</div></div><div className="
          flex items-center gap-3
        "><span className="flex-1 bg-border-warm block-px" /><span className="
          body-xs text-ink-muted
        ">or choose another time</span><span className="flex-1 bg-border-warm block-px" /></div><input type="datetime-local" step={900} value={custom} onChange={(event) => { setCustom(event.target.value); setSelected(""); }} className="
          body-sm rounded-control border border-border-warm bg-surface px-3 text-ink inline-full
          min-block-11
        " /></div>
    </AppModal>;
}
