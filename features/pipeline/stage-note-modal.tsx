"use client";

import { useState } from "react";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { BadgeCheck, StickyNote } from "@/components/shared/icons";
import { Textarea } from "@/components/ui/textarea";

import {
    defaultFinalPriceChoice,
    type FinalPriceChoice,
    FinalPriceField,
    resolveFinalPrice,
    seedCustomFinalPrice,
} from "@/features/pipeline/final-price-field";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealItem, DealStatus } from "@/features/pipeline/types";
import { isLiveStage } from "@/features/pipeline/types";

const NOTE_MAX_LENGTH = 500;
const NOTE_COUNTER_FROM = 400;

export type StageMoveRequest = {
    dealId: string;
    status: DealStatus;
    /** Short line for the toast after save. */
    successMessage: string;
};

/** Extra details some moves collect. Marking sold asks for the final price. */
export type StageMoveDetails = {
    closedAmountInr?: number;
};

function moveTitle(status: DealStatus): string {
    if (isLiveStage(status)) {
        return `Move to ${DEAL_STAGE_META[status].label.toLowerCase()}`;
    }
    return status === "closed" ? "Mark as sold" : "Mark as lost";
}

/**
 * Which deal this is, nothing more. The fields below carry their own labels
 * ("Final price", "Note (optional)"), so repeating them here is noise.
 */
function moveDescription(deal: DealItem | null): string {
    return deal ? `${deal.buyer.name} on ${deal.property.title}` : "This client";
}

/**
 * Asked whenever a deal moves stage (advance, drag, sold, lost, reopen).
 * Note is optional — Confirm with an empty field still moves the deal.
 * Marking sold also asks for the final price (listed, offer, or typed).
 */
export function StageNoteModal({
    open,
    deal,
    request,
    isSaving,
    submitError,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    deal: DealItem | null;
    request: StageMoveRequest | null;
    isSaving: boolean;
    /** Save failure from the parent. Shown inline; the typed note stays. */
    submitError?: string | null;
    onConfirm: (note: string, details: StageMoveDetails) => void;
    onCancel: () => void;
}) {
    const [note, setNote] = useState("");
    const [priceChoice, setPriceChoice] = useState<FinalPriceChoice>("listed");
    const [customPrice, setCustomPrice] = useState("");
    const [priceError, setPriceError] = useState<string | null>(null);

    // Reset the draft when a new move opens — derived on the open edge so we
    // do not setState inside an effect (cascading render lint).
    const draftKey = open && request ? `${request.dealId}:${request.status}` : null;
    const [activeKey, setActiveKey] = useState<string | null>(null);
    if (draftKey !== activeKey) {
        setActiveKey(draftKey);
        if (draftKey) {
            setNote("");
            setPriceError(null);
            if (deal) {
                setPriceChoice(defaultFinalPriceChoice(deal));
                setCustomPrice(seedCustomFinalPrice(deal));
            }
        }
    }

    if (!request) return null;

    const asksFinalPrice = request.status === "closed" && deal != null;

    const confirm = () => {
        if (!asksFinalPrice) {
            onConfirm(note, {});
            return;
        }
        const result = resolveFinalPrice(deal, priceChoice, customPrice);
        if (result.error != null) {
            setPriceError(result.error);
            return;
        }
        setPriceError(null);
        onConfirm(note, { closedAmountInr: result.amountInr });
    };

    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (!next && !isSaving) onCancel();
            }}
            size="sm"
            title={moveTitle(request.status)}
            description={moveDescription(deal)}
            footer={
                <AppModalFooter
                    primaryLabel={
                        isSaving ? "Saving…" : asksFinalPrice ? "Mark as sold" : "Confirm"
                    }
                    primaryIcon={
                        asksFinalPrice ? (
                            <BadgeCheck aria-hidden strokeWidth={1.75} />
                        ) : (
                            <StickyNote aria-hidden strokeWidth={1.75} />
                        )
                    }
                    onPrimary={confirm}
                    primaryDisabled={isSaving}
                    secondaryLabel="Cancel"
                    onSecondary={onCancel}
                    secondaryDisabled={isSaving}
                />
            }
        >
            <div className="flex flex-col gap-5">
                {asksFinalPrice ? (
                    <FinalPriceField
                        deal={deal}
                        choice={priceChoice}
                        onChoiceChange={(next) => {
                            setPriceChoice(next);
                            setPriceError(null);
                        }}
                        customAmount={customPrice}
                        onCustomAmountChange={(next) => {
                            setCustomPrice(next);
                            if (priceError) setPriceError(null);
                        }}
                        error={priceError}
                        disabled={isSaving}
                    />
                ) : null}

                <div className="flex flex-col gap-2">
                    <label htmlFor="stage-note" className="body-sm font-medium text-ink">
                        Note <span className="font-normal text-ink-subtle">(optional)</span>
                    </label>
                    <Textarea
                        id="stage-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={asksFinalPrice ? 3 : 4}
                        maxLength={NOTE_MAX_LENGTH}
                        placeholder={
                            asksFinalPrice
                                ? "e.g. Registry on 12 March, token paid"
                                : "e.g. Client liked the balcony, wants a second visit"
                        }
                        className="rounded-inner"
                        disabled={isSaving}
                    />
                    {/* Counter only once the limit is in sight; "0 of 500" is noise. */}
                    {note.length >= NOTE_COUNTER_FROM ? (
                        <p className="body-xs tabular text-ink-muted" aria-live="polite">
                            {note.length} of {NOTE_MAX_LENGTH}
                        </p>
                    ) : null}
                    {submitError ? (
                        <p role="alert" className="body-sm text-danger">
                            {submitError}
                        </p>
                    ) : null}
                </div>
            </div>
        </AppModal>
    );
}
