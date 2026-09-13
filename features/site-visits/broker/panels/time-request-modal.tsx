"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock3, Plus, Trash2 } from "lucide-react";

import { dateAtIstOffset, formatVisitTime, inputValueInIst, inputValueToUtc, istDateKey } from "@/lib/visits/time";
import { useCreateTimeRequest } from "@/hooks/use-time-requests";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";

import type { PersonSummary, PropertyWithSlots } from "@/features/site-visits/broker/model";
import { BuyerPicker } from "@/features/site-visits/broker/panels/buyer-picker";
import { type TimeRequestFormValues,timeRequestSchema } from "@/schemas/visits";

const PRESETS = [
    "Buyer works till 5, evening suits better",
    "Buyer is visiting Surat only tomorrow",
    "Buyer wants to see it in daylight",
];

export function TimeRequestModal({
    open,
    propertyId,
    buyerId,
    properties,
    buyers,
    onClose,
    onCreated,
}: {
    open: boolean;
    propertyId?: string;
    buyerId?: string;
    properties: PropertyWithSlots[];
    buyers: PersonSummary[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const mutation = useCreateTimeRequest();
    const form = useForm<TimeRequestFormValues>({ resolver: zodResolver(timeRequestSchema), defaultValues: { propertyId: propertyId ?? "", buyerIds: buyerId ? [buyerId] : [], preferredStartsAt: inputValueInIst(dateAtIstOffset(1, 17)), alternates: [], message: "" } });
    const selectedPropertyId = form.watch("propertyId");
    const preferred = form.watch("preferredStartsAt");
    const alternates = form.watch("alternates");
    const selected = properties.find((item) => item.property.id === selectedPropertyId);
    const published = useMemo(() => selected?.slots.filter((slot) => istDateKey(slot.startsAt) === preferred.slice(0, 10)) ?? [], [preferred, selected]);

    useEffect(() => {
        if (open) form.reset({ propertyId: propertyId ?? "", buyerIds: buyerId ? [buyerId] : [], preferredStartsAt: inputValueInIst(dateAtIstOffset(1, 17)), alternates: [], message: "" });
    }, [buyerId, form, open, propertyId]);

    const submit = form.handleSubmit(async (values) => {
        const startsAt = inputValueToUtc(values.preferredStartsAt);
        const starts = new Date(startsAt).getTime();
        if (starts - Date.now() < 60 * 60_000) { form.setError("preferredStartsAt", { message: "Choose a time at least 60 minutes from now." }); return; }
        if (starts - Date.now() > 30 * 86_400_000) { form.setError("preferredStartsAt", { message: "Choose a time within the next 30 days." }); return; }
        const item = properties.find((property) => property.property.id === values.propertyId);
        if (!item) return;
        const selectedBuyers = buyers.filter((buyer) => values.buyerIds.includes(buyer.id));
        await mutation.mutateAsync({ item, buyers: selectedBuyers, preferredStartsAt: startsAt, preferredEndsAt: new Date(starts + 45 * 60_000).toISOString(), alternates: values.alternates.filter(Boolean).map((value) => { const start = inputValueToUtc(value); return { startsAt: start, endsAt: new Date(new Date(start).getTime() + 45 * 60_000).toISOString() }; }), message: values.message || undefined });
        toast.success("Time request sent");
        onCreated();
    });

    return (
        <AppModal open={open} onOpenChange={(next) => { if (!next) onClose(); }} title="Request another time" description="Give the owner one preferred time and up to two backups." size="lg" footer={<><p className="
          body-xs text-ink-muted
        ">Requests expire when the preferred time passes.</p><Button type="submit" form="time-request-form" size="lg" loading={mutation.isPending}>Send time request</Button></>}>
            <form id="time-request-form" onSubmit={submit} className="space-y-5">
                <label className="block"><span className="body-sm font-bold text-ink">Property</span><select {...form.register("propertyId")} className="
                  body-sm mbs-2 rounded-control border border-border-warm bg-surface px-3 text-ink
                  outline-none inline-full min-block-11
                  focus:border-brand focus:ring-3 focus:ring-brand/15
                "><option value="">Choose a property</option>{properties.map((item) => <option key={item.property.id} value={item.property.id}>{item.property.title} · {item.property.locality}</option>)}</select>{form.formState.errors.propertyId ? <span className="
                  body-xs mbs-1 block text-danger
                ">{form.formState.errors.propertyId.message}</span> : null}</label>
                <BuyerPicker buyers={buyers} selected={form.watch("buyerIds")} onChange={(ids) => form.setValue("buyerIds", ids, { shouldValidate: true })} />
                {form.formState.errors.buyerIds ? <p className="body-xs text-danger">{form.formState.errors.buyerIds.message}</p> : null}
                <div><label className="body-sm font-bold text-ink">Preferred time<input type="datetime-local" step={900} {...form.register("preferredStartsAt")} className="
                  body-sm mbs-2 block rounded-control border border-border-warm bg-surface px-3
                  text-ink outline-none inline-full min-block-11
                  focus:border-brand focus:ring-3 focus:ring-brand/15
                " /></label>{form.formState.errors.preferredStartsAt ? <p className="
                  body-xs mbs-1 text-danger
                ">{form.formState.errors.preferredStartsAt.message}</p> : null}{selected ? <p className="
                  body-xs mbs-2 flex items-center gap-1.5 text-ink-muted
                "><Clock3 aria-hidden className="block-3.5 inline-3.5" />This owner usually allows 10 AM–7 PM.</p> : null}</div>
                {published.length ? <div className="rounded-inner bg-surface-muted p-3"><p className="
                  body-xs font-semibold text-ink-muted
                ">Published times that day</p><div className="mbs-2 flex flex-wrap gap-2">{published.map((slot) => <span key={slot.id} className="
                  body-xs tabular rounded-md border border-border-warm bg-surface px-2 py-1
                  text-ink-muted
                ">{formatVisitTime(slot.startsAt)}</span>)}</div></div> : null}
                <fieldset className="space-y-3"><div className="
                  flex items-start justify-between gap-3
                "><legend className="body-sm font-bold text-ink">Backup times</legend>{alternates.length < 2 ? <Button type="button" variant="surface" size="sm" onClick={() => form.setValue("alternates", [...alternates, inputValueInIst(dateAtIstOffset(alternates.length + 1, 18))])}><Plus aria-hidden /> Add backup</Button> : null}</div><p className="
                  body-xs text-ink-muted
                ">Owners accept faster when you give options.</p>{alternates.map((value, index) => <div key={index} className="
                  flex items-center gap-2
                "><input type="datetime-local" step={900} value={value} onChange={(event) => form.setValue("alternates", alternates.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="
                  body-sm flex-1 rounded-control border border-border-warm bg-surface px-3 text-ink
                  min-block-11
                " /><Button type="button" variant="ghost" size="md" aria-label="Remove backup time" onClick={() => form.setValue("alternates", alternates.filter((_, itemIndex) => itemIndex !== index))}><Trash2 aria-hidden /></Button></div>)}</fieldset>
                <div><label className="body-sm font-bold text-ink">Message <span className="
                  font-normal text-ink-muted
                ">· optional</span><textarea {...form.register("message")} maxLength={240} rows={3} className="
                  body-sm mbs-2 resize-none rounded-control border border-border-warm bg-surface
                  px-3 py-2.5 text-ink inline-full
                " placeholder="Why this time works better" /></label><div className="
                  mbs-2 flex flex-wrap gap-2
                ">{PRESETS.map((preset) => <button type="button" key={preset} onClick={() => form.setValue("message", preset)} className="
                  body-xs rounded-control border border-border-warm bg-surface px-3 text-start
                  font-semibold text-ink-muted min-block-9
                  hover:bg-brand-soft hover:text-brand-text
                ">{preset}</button>)}</div><p className="
                  body-xs tabular mbs-1 text-end text-ink-subtle
                ">{form.watch("message").length}/240</p></div>
            </form>
        </AppModal>
    );
}

