"use client";

import { useState } from "react";

import { MAX_CHARS } from "@/lib/validation/text-limits";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { CharacterCount } from "@/components/shared/character-count";
import { StickyNote } from "@/components/shared/icons";
import { Textarea } from "@/components/ui/textarea";

import type { DealItem } from "@/features/pipeline/types";

export function DealNoteModal({
    open,
    deal,
    isSaving,
    submitError,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    deal: DealItem | null;
    isSaving: boolean;
    /** Save failure from the parent. Shown inline; the typed note stays. */
    submitError?: string | null;
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
            <div className="flex flex-col gap-2">
                <Textarea
                    aria-label="Note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    maxLength={MAX_CHARS.dealNote}
                    placeholder="What did they say?"
                    className="rounded-inner"
                    disabled={isSaving}
                    aria-describedby="deal-note-count"
                />
                <CharacterCount id="deal-note-count" value={note} maxChars={MAX_CHARS.dealNote} />
                {submitError ? (
                    <p role="alert" className="body-sm text-danger">
                        {submitError}
                    </p>
                ) : null}
            </div>
        </AppModal>
    );
}
