"use client";

import { useMemo, useState } from "react";

import { Plus } from "@/components/shared/icons";
import { mapNamedPersonToPicker } from "@/components/shared/map-to-people-picker-person";
import { PeopleInlineSelect } from "@/components/shared/people-inline-select";
import { Button } from "@/components/ui/button";

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
    const [addOpen, setAddOpen] = useState(false);
    const [created, setCreated] = useState<PersonSummary[]>([]);
    const allBuyers = useMemo(() => [...created, ...buyers], [buyers, created]);
    const people = useMemo(
        () =>
            allBuyers.map((buyer) =>
                mapNamedPersonToPicker(
                    {
                        id: buyer.id,
                        name: buyer.name,
                        phoneDigits: buyer.phoneDigits,
                        imageUrl: buyer.avatarUrl,
                    },
                    "client",
                ),
            ),
        [allBuyers],
    );

    return (
        <div className="space-y-3">
            <div className="flex items-end justify-between gap-3">
                <div className="flex-1 min-inline-0">
                    <PeopleInlineSelect
                        label="Client · one per visit"
                        lockedScope="client"
                        people={people}
                        value={selected[0] ?? null}
                        onValueChange={(id) => onChange(id ? [id] : [])}
                        placeholder="Select a client"
                        onCreate={() => setAddOpen(true)}
                        createLabel="Add new client"
                        helperText={allBuyers.length === 0 ? emptyMessage : undefined}
                        size="lg"
                    />
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mbe-0.5 shrink-0"
                    onClick={() => setAddOpen(true)}
                >
                    <Plus aria-hidden /> Add new
                </Button>
            </div>
            <AddBuyerModal
                open={addOpen}
                onOpenChange={setAddOpen}
                onCreated={(name, savedId) => {
                    const buyer = {
                        id: savedId ?? `buyer_${Date.now()}`,
                        name,
                        requirement: "New client · add requirements in Clients",
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
