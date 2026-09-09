"use client";

import { useState } from "react";

import { StickyNote } from "lucide-react";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { Textarea } from "@/components/ui/textarea";

import { DEAL_OUTCOME_META, DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealItem, DealStatus } from "@/features/pipeline/types";
import { isLiveStage } from "@/features/pipeline/types";

export type StageMoveRequest = {
    dealId: string;
    status: DealStatus;
    /** Short line for the toast after save. */
    successMessage: string;
};

function moveTitle(status: DealStatus): string {
    if (isLiveStage(status)) {
        return `Move to ${DEAL_STAGE_META[status].label.toLowerCase()}`;
    }
    return status === "closed" ? DEAL_OUTCOME_META.closed.label : DEAL_OUTCOME_META.lost.label;
}

function moveDescription(deal: DealItem | null, status: DealStatus): string {
    const who = deal ? `${deal.buyer.name} on ${deal.property.title}` : "This lead";
    if (isLiveStage(status)) {
        return `${who}. Add a note if you want — optional.`;
    }
    if (status === "closed") {
        return `${who}. Mark as sold. A note is optional.`;
    }
    return `${who}. Mark as lost. A note is optional.`;
}

/**
 * Asked whenever a lead moves stage (advance, drag, sold, lost, reopen).
 * Note is optional — Confirm with an empty field still moves the lead.
 */
export function StageNoteModal({
    open,
    deal,
    request,
    isSaving,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    deal: DealItem | null;
    request: StageMoveRequest | null;
    isSaving: boolean;
    onConfirm: (note: string) => void;
    onCancel: () => void;
}) {
    const [note, setNote] = useState("");

    // Clear the note when a new move opens — derived on the open edge so we
    // do not setState inside an effect (cascading render lint).
    const draftKey = open && request ? `${request.dealId}:${request.status}` : null;
    const [activeKey, setActiveKey] = useState<string | null>(null);
    if (draftKey !== activeKey) {
        setActiveKey(draftKey);
        if (draftKey) setNote("");
    }

    if (!request) return null;

    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (!next && !isSaving) onCancel();
            }}
            size="sm"
            title={moveTitle(request.status)}
            description={moveDescription(deal, request.status)}
            footer={
                <AppModalFooter
                    primaryLabel={isSaving ? "Saving…" : "Confirm"}
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
                <label htmlFor="stage-note" className="body-sm font-medium text-ink">
                    Note <span className="font-normal text-ink-subtle">(optional)</span>
                </label>
                <Textarea
                    id="stage-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="e.g. Buyer liked the balcony, wants a second visit"
                    className="rounded-inner"
                    disabled={isSaving}
                />
                <p className="body-xs tabular text-ink-subtle">{note.length} of 500</p>
            </div>
        </AppModal>
    );
}
