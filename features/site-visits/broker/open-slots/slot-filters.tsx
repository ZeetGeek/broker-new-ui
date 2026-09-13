"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { TIME_BUCKETS } from "@/lib/visits/constants";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export type SlotFilterState = {
    range: "today" | "tomorrow" | "week" | "custom";
    timeBuckets: string[];
    localities: string[];
    purpose: "" | "sale" | "rent";
    propertyType: string;
    bhk: string;
    budget: string;
    owner: string;
    onlyAccepted: boolean;
    hideFull: boolean;
};

export const DEFAULT_SLOT_FILTERS: SlotFilterState = { range: "week", timeBuckets: [], localities: [], purpose: "", propertyType: "", bhk: "", budget: "", owner: "", onlyAccepted: true, hideFull: true };

function ToggleButton({ selected, children, onClick }: { selected: boolean; children: React.ReactNode; onClick: () => void }) {
    return <button type="button" aria-pressed={selected} onClick={onClick} className={cn(`
      body-xs rounded-control border border-border-warm bg-surface px-3 font-semibold text-ink-muted
      min-block-9
    `, selected && `border-brand-ink bg-brand-ink text-surface`)}>{children}</button>;
}

export function SlotFilters({ value, onChange }: { value: SlotFilterState; onChange: (next: SlotFilterState) => void }) {
    const toggleArray = (key: "timeBuckets" | "localities", item: string) => onChange({ ...value, [key]: value[key].includes(item) ? value[key].filter((entry) => entry !== item) : [...value[key], item] });
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between"><h2 className="h6 text-ink">Filters</h2><Button variant="ghost" size="xs" onClick={() => onChange(DEFAULT_SLOT_FILTERS)}><X aria-hidden /> Clear</Button></div>
            <fieldset><legend className="body-xs mbe-2 font-bold text-ink">Date range</legend><div className="
              grid grid-cols-2 gap-2
            ">{(["today", "tomorrow", "week", "custom"] as const).map((range) => <ToggleButton key={range} selected={value.range === range} onClick={() => onChange({ ...value, range })}>{range === "week" ? "This week" : range[0].toUpperCase() + range.slice(1)}</ToggleButton>)}</div></fieldset>
            <fieldset><legend className="body-xs mbe-2 font-bold text-ink">Time</legend><div className="
              space-y-2
            ">{TIME_BUCKETS.map((bucket) => <label key={bucket.id} className="
              flex cursor-pointer items-center justify-between gap-3 min-block-9
            "><span className="body-xs text-ink">{bucket.label} <span className="text-ink-muted">{bucket.detail}</span></span><input type="checkbox" checked={value.timeBuckets.includes(bucket.id)} onChange={() => toggleArray("timeBuckets", bucket.id)} className="
              accent-brand block-4 inline-4
            " /></label>)}</div></fieldset>
            <fieldset><legend className="body-xs mbe-2 font-bold text-ink">Locality</legend><div className="
              flex flex-wrap gap-2
            ">{["Vesu", "Adajan", "Piplod", "Pal", "City Light"].map((locality) => <ToggleButton key={locality} selected={value.localities.includes(locality)} onClick={() => toggleArray("localities", locality)}>{locality}</ToggleButton>)}</div></fieldset>
            <div className="grid grid-cols-2 gap-2">
                <label className="body-xs font-bold text-ink">Purpose<select value={value.purpose} onChange={(event) => onChange({ ...value, purpose: event.target.value as SlotFilterState["purpose"] })} className="
                  mbs-1 rounded-control border border-border-warm bg-surface px-2 font-medium
                  inline-full min-block-10
                "><option value="">Any</option><option value="sale">Sale</option><option value="rent">Rent</option></select></label>
                <label className="body-xs font-bold text-ink">Type<select value={value.propertyType} onChange={(event) => onChange({ ...value, propertyType: event.target.value })} className="
                  mbs-1 rounded-control border border-border-warm bg-surface px-2 font-medium
                  inline-full min-block-10
                "><option value="">Any</option><option>Apartment</option><option>Villa</option><option>Commercial</option></select></label>
                <label className="body-xs font-bold text-ink">BHK<select value={value.bhk} onChange={(event) => onChange({ ...value, bhk: event.target.value })} className="
                  mbs-1 rounded-control border border-border-warm bg-surface px-2 font-medium
                  inline-full min-block-10
                "><option value="">Any</option><option value="2">2 BHK</option><option value="3">3 BHK</option><option value="4">4 BHK</option></select></label>
                <label className="body-xs font-bold text-ink">Budget<select value={value.budget} onChange={(event) => onChange({ ...value, budget: event.target.value })} className="
                  mbs-1 rounded-control border border-border-warm bg-surface px-2 font-medium
                  inline-full min-block-10
                "><option value="">Any</option><option value="10000000">Under ₹1 Cr</option><option value="20000000">Under ₹2 Cr</option><option value="40000000">Under ₹4 Cr</option></select></label>
            </div>
            <label className="body-xs font-bold text-ink">Owner<select value={value.owner} onChange={(event) => onChange({ ...value, owner: event.target.value })} className="
              mbs-1 rounded-control border border-border-warm bg-surface px-2 font-medium
              inline-full min-block-10
            "><option value="">All owners</option><option value="o_1">Zeet Patel</option><option value="o_2">Ramesh Shah</option><option value="o_3">Bhavna Desai</option><option value="o_4">Manish Vora</option></select></label>
            <div className="space-y-4 border-bs border-border-warm pbs-4">
                <label className="flex items-center justify-between gap-3 min-block-9"><span className="
                  body-xs font-semibold text-ink
                ">Only my accepted properties</span><Switch checked={value.onlyAccepted} onCheckedChange={(checked) => onChange({ ...value, onlyAccepted: checked })} /></label>
                <label className="flex items-center justify-between gap-3 min-block-9"><span className="
                  body-xs font-semibold text-ink
                ">Hide full slots</span><Switch checked={value.hideFull} onCheckedChange={(checked) => onChange({ ...value, hideFull: checked })} /></label>
            </div>
        </div>
    );
}

