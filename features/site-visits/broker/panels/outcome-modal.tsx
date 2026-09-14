"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { formatInrInput, inrWordHint, parseInr } from "@/lib/format/inr";
import { cn } from "@/lib/utils";
import { dateAtIstOffset, inputValueInIst } from "@/lib/visits/time";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import type { BrokerSiteVisit, VisitOutcome } from "@/features/site-visits/broker/model";
import { type OutcomeFormValues,outcomeSchema } from "@/schemas/visits";

const OBJECTIONS = ["Price", "Size", "Floor", "Parking", "Location", "Condition", "Vastu", "Other"];

function Choice<T extends string>({ value, current, label, onChange }: { value: T; current: T; label: string; onChange: (value: T) => void }) {
    return <button type="button" aria-pressed={current === value} onClick={() => onChange(value)} className={cn(`
      rounded-control border border-border-warm bg-surface px-3 text-sm font-bold text-ink
      min-block-12
    `, current === value && `border-brand-ink bg-brand-ink text-surface`)}>{label}</button>;
}

export default function OutcomeModal({ open, visit, onClose, onSave }: { open: boolean; visit?: BrokerSiteVisit; onClose: () => void; onSave: (outcome: VisitOutcome) => Promise<void> }) {
    const [saveError, setSaveError] = useState<string>();
    const form = useForm<OutcomeFormValues>({ resolver: zodResolver(outcomeSchema), defaultValues: { attended: "buyer_and_owner", interest: "warm", objections: [], feedback: "", nextStep: "schedule_followup", followUpAt: inputValueInIst(dateAtIstOffset(2, 11)) } });
    const attended = useWatch({ control: form.control, name: "attended" });
    const interest = useWatch({ control: form.control, name: "interest" });
    const nextStep = useWatch({ control: form.control, name: "nextStep" });
    const objections = useWatch({ control: form.control, name: "objections" });
    const offerAmount = useWatch({ control: form.control, name: "offerAmount" });
    useEffect(() => { if (open) form.reset({ attended: "buyer_and_owner", interest: "warm", objections: [], feedback: "", nextStep: "schedule_followup", followUpAt: inputValueInIst(dateAtIstOffset(2, 11)) }); }, [form, open, visit?.id]);
    if (!visit) return null;
    return <AppModal open={open} onOpenChange={(next) => { if (!next) { setSaveError(undefined); onClose(); } }} title="Log outcome" description={`${visit.property.title} · ${visit.buyers[0].name}`} size="md" footer={<div className="flex flex-row flex-wrap items-center justify-between gap-2 inline-full"><p className="
      body-xs text-ink-muted
    ">Saves the visit, pipeline step, and follow-up together.</p><Button type="submit" form="outcome-form" variant="default" size="default" loading={form.formState.isSubmitting} className="inline-auto">Save outcome</Button></div>}>
        <form id="outcome-form" onSubmit={form.handleSubmit(async (values) => { setSaveError(undefined); try { await onSave(values as VisitOutcome); } catch (error) { setSaveError(error instanceof Error ? error.message : "Could not save this outcome. Check your connection and try again."); } })} className="
          space-y-5
        ">
            {saveError ? <p role="alert" className="
              body-sm rounded-inner bg-danger-soft px-3 py-2 font-semibold text-danger
            ">{saveError}</p> : null}
            <fieldset><legend className="body-sm mbe-2 font-bold text-ink">Did it happen?</legend><div className="
              grid grid-cols-3 gap-2
            "><Choice value="buyer_and_owner" current={attended} label="Both came" onChange={(value) => form.setValue("attended", value)} /><Choice value="buyer_only" current={attended} label="Only buyer came" onChange={(value) => form.setValue("attended", value)} /><Choice value="nobody" current={attended} label="Nobody came" onChange={(value) => form.setValue("attended", value)} /></div></fieldset>
            <fieldset><legend className="body-sm mbe-2 font-bold text-ink">Interest</legend><div className="
              grid grid-cols-3 gap-2
            "><Choice value="hot" current={interest} label="Hot" onChange={(value) => form.setValue("interest", value)} /><Choice value="warm" current={interest} label="Warm" onChange={(value) => form.setValue("interest", value)} /><Choice value="cold" current={interest} label="Cold" onChange={(value) => form.setValue("interest", value)} /></div></fieldset>
            {interest !== "hot" ? <fieldset><legend className="body-sm mbe-2 font-bold text-ink">What held them back?</legend><div className="
              flex flex-wrap gap-2
            ">{OBJECTIONS.map((item) => <label key={item} className={cn(`
              body-xs flex cursor-pointer items-center gap-2 rounded-control border px-3
              font-semibold min-block-12
            `, objections.includes(item) ? `border-brand bg-brand-soft text-brand-text` : `
              border-border-warm bg-surface text-ink-muted
            `)}><Checkbox checked={objections.includes(item)} onCheckedChange={(checked) => form.setValue("objections", checked ? [...objections, item] : objections.filter((value) => value !== item))} />{item}</label>)}</div></fieldset> : null}
            {interest === "hot" ? <label className="block"><span className="
              body-sm font-bold text-ink
            ">Offer amount <span className="font-normal text-ink-muted">· optional</span></span><input inputMode="numeric" value={formatInrInput(offerAmount)} onChange={(event) => form.setValue("offerAmount", parseInr(event.target.value) ?? undefined)} className="
              body-sm tabular mbs-2 rounded-control border border-border-warm bg-surface px-3
              text-ink inline-full min-block-11
            " placeholder="₹0" />{offerAmount ? <span className="
              body-xs mbs-1 block text-brand-text
            ">{inrWordHint(offerAmount)}</span> : null}</label> : null}
            <label className="block"><span className="body-sm font-bold text-ink">Feedback</span><textarea {...form.register("feedback")} rows={2} className="
              body-sm mbs-2 resize-none rounded-control border border-border-warm bg-surface px-3
              py-2.5 text-ink inline-full
            " placeholder="What the buyer said while it is fresh" /></label>
            <fieldset><legend className="body-sm mbe-2 font-bold text-ink">Next step</legend><div className="
              grid gap-2
              sm:grid-cols-2
            "><Choice value="move_to_negotiation" current={nextStep} label="Move to Negotiation" onChange={(value) => form.setValue("nextStep", value)} /><Choice value="schedule_followup" current={nextStep} label="Schedule follow-up" onChange={(value) => form.setValue("nextStep", value)} /><Choice value="show_other_property" current={nextStep} label="Show another property" onChange={(value) => form.setValue("nextStep", value)} /><Choice value="drop" current={nextStep} label="Drop this buyer" onChange={(value) => form.setValue("nextStep", value)} /></div>{nextStep === "schedule_followup" ? <input type="datetime-local" step={900} {...form.register("followUpAt")} className="
              body-sm mbs-3 rounded-control border border-border-warm bg-surface px-3 text-ink
              inline-full min-block-11
            " /> : null}</fieldset>
        </form>
    </AppModal>;
}

