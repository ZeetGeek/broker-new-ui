"use client";

import { useState } from "react";

import { StickyNote } from "lucide-react";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { Textarea } from "@/components/ui/textarea";

import type { DealItem } from "@/features/pipeline/types";

export function DealNoteModal({
    open,
    deal,
    isSaving,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    deal: DealItem | null;
    isSaving: boolean;
    onConfirm: (note: string) => void;
    onCancel: () => void;
}) {
    const [note, setNote] = useState(deal?.note ?? "");
    const draftKey = open && deal ? deal.id : null;
    const [activeKey, setActiveKey] = useState<string | null>(null);
    if (draftKey !== activeKey) {
        setActiveKey(draftKey);
        if (deal) setNote(deal.note);
    }

    if (!deal) return null;

    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (!next && !isSaving) onCancel();
            }}
            size="sm"
            title={`Note on ${deal.buyer.name}`}
            description={`${deal.property.configLabel} · ${deal.property.locality}`}
            footer={
                <AppModalFooter
                    primaryLabel={isSaving ? "Saving…" : "Save note"}
                    primaryIcon={<StickyNote aria-hidden strokeWidth={1.75} />}
                    onPrimary={() => onConfirm(note)}
                    primaryDisabled={isSaving}
                    secondaryLabel="Cancel"
                    onSecondary={onCancel}
                    secondaryDisabled={isSaving}
                />
            }
        >
            <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="What did they say?"
                className="rounded-inner"
                disabled={isSaving}
            />
        </AppModal>
    );
}
