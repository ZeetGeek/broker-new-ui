"use client";

import { Sparkles, UserRoundSearch } from "lucide-react";

import type { PersonSummary } from "@/features/site-visits/broker/model";

export function BuyerMatchBar({ buyers, value, onChange }: { buyers: PersonSummary[]; value?: string; onChange: (id?: string) => void }) {
    return (
        <section className="
          flex flex-col gap-3 rounded-card bg-brand-ink p-4 text-surface
          md:flex-row md:items-center md:justify-between
        ">
            <div className="flex items-center gap-3"><span className="
              grid place-items-center rounded-inner bg-surface/10 block-10 inline-10
            "><UserRoundSearch aria-hidden /></span><div><p className="
              body-sm font-semibold text-surface
            ">Booking for</p><p className="body-xs text-surface/65">Choose a buyer to rank properties by fit and keep their schedule clear.</p></div></div>
            <label className="relative min-inline-[230px]"><span className="sr-only">Pick a buyer</span><select value={value ?? ""} onChange={(event) => onChange(event.target.value || undefined)} className="
              body-sm appearance-none rounded-control border border-surface/20 bg-surface px-3 pe-10
              font-semibold text-ink outline-none inline-full min-block-11
              focus:ring-3 focus:ring-highlight/30
            "><option value="">Pick a buyer</option>{buyers.map((buyer) => <option key={buyer.id} value={buyer.id}>{buyer.name} · {buyer.requirement}</option>)}</select><Sparkles aria-hidden className="
              pointer-events-none absolute inset-e-3 inset-bs-1/2 -translate-y-1/2 text-brand-text
              block-4 inline-4
            " /></label>
        </section>
    );
}

