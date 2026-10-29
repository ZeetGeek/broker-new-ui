"use client";

import { useId, useMemo, useState } from "react";

import { Check, Plus, Search } from "@/components/shared/icons";

import { cn } from "@/lib/utils";

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
    emptyMessage,
}: {
    buyers: PersonSummary[];
    selected: string[];
    onChange: (ids: string[]) => void;
    onBuyerCreated?: (buyer: PersonSummary) => void;
    /** Shown in place of the list when there are no buyers to pick. */
    emptyMessage?: string;
}) {
    const [query, setQuery] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [created, setCreated] = useState<PersonSummary[]>([]);
    const allBuyers = useMemo(() => [...created, ...buyers], [buyers, created]);
    const shown = allBuyers.filter((buyer) =>
        `${buyer.name} ${buyer.requirement ?? ""}`.toLowerCase().includes(query.toLowerCase()),
    );

    const searchId = useId();
    const toggle = (id: string) => {
        if (selected.includes(id)) onChange(selected.filter((item) => item !== id));
        else onChange([id]);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <label
                    htmlFor={searchId}
                    className="
              body-sm font-bold text-ink
            "
                >
                    Buyer <span className="font-normal text-ink-muted">· one per visit</span>
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAddOpen(true)}>
                    <Plus aria-hidden /> Add new buyer
                </Button>
            </div>
            <Input
                id={searchId}
                aria-label="Search buyers"
                value={query}
                onValueChange={(value) => setQuery(value)}
                placeholder="Search buyers"
                startIcon={Search}
                clearable
            />
            <div className="space-y-1 overflow-y-auto pe-1 max-block-56">
                {allBuyers.length === 0 && emptyMessage ? (
                    <p className="body-sm rounded-inner bg-surface-muted p-3 text-ink-muted">
                        {emptyMessage}
                    </p>
                ) : null}
                {shown.map((buyer) => {
                    const checked = selected.includes(buyer.id);
                    return (
                        <button
                            key={buyer.id}
                            type="button"
                            aria-pressed={checked}
                            onClick={() => toggle(buyer.id)}
                            className={cn(
                                `
                      flex items-center gap-3 rounded-inner border px-3 py-2 text-start outline-none
                      inline-full min-block-14
                      focus-visible:ring-3 focus-visible:ring-brand/25
                    `,
                                checked
                                    ? `border-brand bg-brand-soft`
                                    : `
                      border-border-warm bg-surface
                      hover:bg-surface-muted
                    `,
                            )}
                        >
                            <UserAvatar name={buyer.name} imageUrl={buyer.avatarUrl} size="sm" />
                            <span
                                className="
                      flex-1 min-inline-0
                    "
                            >
                                <span className="body-sm block truncate font-semibold text-ink">
                                    {buyer.name}
                                </span>
                                <span
                                    className="
                      body-xs block truncate text-ink-muted
                    "
                                >
                                    {buyer.requirement ?? "Buyer contact"}
                                </span>
                            </span>
                            <span
                                className={cn(
                                    `
                      grid place-items-center rounded-full border border-border-warm block-5
                      inline-5
                    `,
                                    checked && `border-brand bg-brand text-surface`,
                                )}
                                aria-hidden
                            >
                                {checked ? (
                                    <Check
                                        className="
                      block-3 inline-3
                    "
                                    />
                                ) : null}
                            </span>
                        </button>
                    );
                })}
            </div>
            <AddBuyerModal
                open={addOpen}
                onOpenChange={setAddOpen}
                onCreated={(name, savedId) => {
                    const buyer = {
                        id: savedId ?? `buyer_${Date.now()}`,
                        name,
                        requirement: "New buyer · add requirements in Contacts",
                    };
                    if (onBuyerCreated) onBuyerCreated(buyer);
                    else setCreated((current) => [buyer, ...current]);
                    onChange([buyer.id]);
                    setAddOpen(false);
                }}
            />
        </div>
    );
}
