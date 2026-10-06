"use client";

import { useMemo } from "react";

import { Sparkles, UserRoundSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import type { PersonSummary } from "@/features/site-visits/broker/model";

export function BuyerMatchBar({
    buyers,
    value,
    onChange,
}: {
    buyers: PersonSummary[];
    value?: string;
    onChange: (id?: string) => void;
}) {
    const selected = buyers.find((buyer) => buyer.id === value);

    // Base UI's Select.Value shows the raw value until the popup mounts, so
    // without this map the trigger reads "all" (or a buyer id) instead of a name.
    const buyerItems = useMemo(
        () => [
            { value: "all", label: "No buyer selected" },
            ...buyers.map((buyer) => ({ value: buyer.id, label: buyer.name })),
        ],
        [buyers],
    );

    return (
        <section className="grid gap-3 rounded-card border border-border-warm bg-surface p-3 shadow-sm md:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] md:items-center md:p-4">
            <div className="flex items-center gap-3 min-inline-0">
                <span className="grid shrink-0 place-items-center rounded-control bg-brand-soft text-brand-text block-11 inline-11">
                    <UserRoundSearch aria-hidden strokeWidth={1.75} />
                </span>
                <div className="min-inline-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="h6 text-ink">Plan for a buyer</h2>
                        {selected ? (
                            <Badge variant="brand">
                                <Sparkles aria-hidden /> Match mode on
                            </Badge>
                        ) : null}
                    </div>
                    <p className="body-sm truncate text-ink-muted">
                        {selected?.requirement ??
                            "Choose a buyer to rank properties and check their schedule."}
                    </p>
                </div>
            </div>

            <Select
                items={buyerItems}
                value={value ?? "all"}
                onValueChange={(next) => onChange(next && next !== "all" ? next : undefined)}
            >
                <SelectTrigger size="md" startIcon={UserRoundSearch} aria-label="Choose a buyer">
                    <SelectValue placeholder="Choose a buyer" />
                </SelectTrigger>
                <SelectContent align="end">
                    <SelectItem value="all">No buyer selected</SelectItem>
                    {buyers.map((buyer) => (
                        <SelectItem key={buyer.id} value={buyer.id}>
                            <span className="flex flex-col min-inline-0">
                                <span className="truncate font-semibold">{buyer.name}</span>
                                {buyer.requirement ? (
                                    <span className="body-xs truncate text-ink-muted">
                                        {buyer.requirement}
                                    </span>
                                ) : null}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </section>
    );
}
