"use client";

import { useMemo, useState } from "react";

import { Check, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { MAX_BUYERS_PER_VISIT } from "@/lib/visits/constants";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AddBuyerModal } from "@/features/contacts/add-buyer-modal";
import type { PersonSummary } from "@/features/site-visits/broker/model";

export function BuyerPicker({
    buyers,
    selected,
    onChange,
    onBuyerCreated,
}: {
    buyers: PersonSummary[];
    selected: string[];
    onChange: (ids: string[]) => void;
    onBuyerCreated?: (buyer: PersonSummary) => void;
}) {
    const [query, setQuery] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [created, setCreated] = useState<PersonSummary[]>([]);
    const allBuyers = useMemo(() => [...created, ...buyers], [buyers, created]);
    const shown = allBuyers.filter((buyer) => `${buyer.name} ${buyer.requirement ?? ""}`.toLowerCase().includes(query.toLowerCase()));

    const toggle = (id: string) => {
        if (selected.includes(id)) onChange(selected.filter((item) => item !== id));
        else if (selected.length < MAX_BUYERS_PER_VISIT) onChange([...selected, id]);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3"><label className="
              body-sm font-bold text-ink
            ">Buyer <span className="font-normal text-ink-muted">· up to 3</span></label><Button type="button" variant="ghost" size="sm" onClick={() => setAddOpen(true)}><Plus aria-hidden /> Add new buyer</Button></div>
            <Input value={query} onValueChange={(value) => setQuery(value)} placeholder="Search buyers" startIcon={Search} clearable />
            <div className="space-y-1 overflow-y-auto pe-1 max-block-56">
                {shown.map((buyer) => {
                    const checked = selected.includes(buyer.id);
                    return <button key={buyer.id} type="button" aria-pressed={checked} onClick={() => toggle(buyer.id)} className={cn(`
                      flex items-center gap-3 rounded-inner border px-3 py-2 text-start outline-none
                      inline-full min-block-14
                      focus-visible:ring-3 focus-visible:ring-brand/25
                    `, checked ? `border-brand bg-brand-soft` : `
                      border-border-warm bg-surface
                      hover:bg-surface-muted
                    `, !checked && selected.length >= MAX_BUYERS_PER_VISIT && `opacity-55`)}><UserAvatar name={buyer.name} imageUrl={buyer.avatarUrl} size="sm" fallback="character" /><span className="
                      flex-1 min-inline-0
                    "><span className="body-sm block truncate font-semibold text-ink">{buyer.name}</span><span className="
                      body-xs block truncate text-ink-muted
                    ">{buyer.requirement ?? "Buyer contact"}</span></span><span className={cn(`
                      grid place-items-center rounded-full border border-border-warm block-5
                      inline-5
                    `, checked && `border-brand bg-brand text-surface`)} aria-hidden>{checked ? <Check className="
                      block-3 inline-3
                    " /> : null}</span></button>;
                })}
            </div>
            <AddBuyerModal open={addOpen} onOpenChange={setAddOpen} onCreated={(name, savedId) => {
                const buyer = { id: savedId ?? `buyer_${Date.now()}`, name, requirement: "New buyer · add requirements in Contacts" };
                if (onBuyerCreated) onBuyerCreated(buyer);
                else setCreated((current) => [buyer, ...current]);
                onChange([...selected, buyer.id].slice(0, MAX_BUYERS_PER_VISIT));
                setAddOpen(false);
            }} />
        </div>
    );
}
