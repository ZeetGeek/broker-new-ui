"use client";

import { useState } from "react";

import { amountFormatFor, formatAmountWithSymbol } from "@/lib/format/amount-input";
import { getActiveCurrency } from "@/lib/format/currency";
import {
    type FinalCommissionType,
    resolveFinalCommission,
} from "@/lib/validation/final-commission";
import { MAX_CHARS } from "@/lib/validation/text-limits";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { CharacterCount } from "@/components/shared/character-count";
import { BadgeCheck, Info, LostIcon, StickyNote } from "@/components/shared/icons";
import { Textarea } from "@/components/ui/textarea";

import { FinalCommissionField } from "@/features/pipeline/final-commission-field";
import {
    defaultFinalPriceChoice,
    type FinalPriceChoice,
    FinalPriceField,
    resolveFinalPrice,
    seedCustomFinalPrice,
} from "@/features/pipeline/final-price-field";
import { LostReasonField, validateLostReason } from "@/features/pipeline/lost-reason-field";
import type { SaleConfirmMode } from "@/features/pipeline/sale-mode";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealItem, DealLostReason, DealStatus } from "@/features/pipeline/types";
import { isLiveStage } from "@/features/pipeline/types";

export type StageMoveRequest = {
    dealId: string;
    status: DealStatus;
    /** Short line for the toast after save. */
    successMessage: string;
    /**
     * The deal as it was when the move was asked for. Kept because a deal
     * opened from a link may not be on the loaded board.
     */
    deal?: DealItem;
};

/**
 * Extra details some moves collect. Marking sold asks for the final price;
 * marking lost asks why.
 */
export type StageMoveDetails = {
    closedAmountInr?: number;
    lostReason?: DealLostReason;
};

function moveTitle(status: DealStatus): string {
    if (isLiveStage(status)) {
        return `Move to ${DEAL_STAGE_META[status].label.toLowerCase()}`;
    }
    return status === "closed" ? "Mark as sold" : "Mark as lost";
}

/**
 * Which deal this is, nothing more. The fields below carry their own labels
 * ("Final price", "Why was it lost?", "Note (optional)").
 */
function moveDescription(deal: DealItem | null): string {
    return deal ? `${deal.buyer.name} on ${deal.property.title}` : "This client";
}

/** What else happens when this sale goes through, in one line. */
function saleConsequence(mode: SaleConfirmMode, otherClientCount: number): string | null {
    if (mode === "owner") {
        return "The owner confirms the sale. Once they do, the property closes for every other client.";
    }
    if (otherClientCount <= 0) return null;
    return otherClientCount === 1
        ? "Your 1 other client on this property will be marked as lost."
        : `Your ${otherClientCount} other clients on this property will be marked as lost.`;
}

function notePlaceholder(status: DealStatus): string {
    if (status === "closed") return "e.g. Registry on 12 March, token paid";
    if (status === "lost") return "e.g. Owner would not go below ₹22 L";
    return "e.g. Client liked the balcony, wants a second visit";
}

/**
 * Asked whenever a deal moves stage (advance, drag, sold, lost, reopen).
 * The note is always optional. Marking sold also asks for the final price
 * (listed, offer, or typed); marking lost asks for one quick reason.
 */
export function StageNoteModal({
    open,
    deal,
    saleMode = "immediate",
    otherClientCount = 0,
    request,
    isSaving,
    submitError,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    deal: DealItem | null;
    /** How marking sold completes: now, or after the owner confirms. */
    saleMode?: SaleConfirmMode;
    /** Other live clients on the same property, closed if this sale goes through. */
    otherClientCount?: number;
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
    const [lostReason, setLostReason] = useState<DealLostReason | null>(null);
    const [lostError, setLostError] = useState<string | null>(null);
    const [commissionType, setCommissionType] = useState<FinalCommissionType>("percent");
    const [commissionValue, setCommissionValue] = useState("");
    const [commissionError, setCommissionError] = useState<string | null>(null);

    // Reset the draft when a new move opens, derived on the open edge so we
    // do not setState inside an effect (cascading render lint).
    const draftKey = open && request ? `${request.dealId}:${request.status}` : null;
    const [activeKey, setActiveKey] = useState<string | null>(null);
    if (draftKey !== activeKey) {
        setActiveKey(draftKey);
        if (draftKey) {
            setNote("");
            setPriceError(null);
            setCommissionType(deal?.property.isRent ? "amount" : "percent");
            setCommissionValue("");
            setCommissionError(null);
            // No reason preselected: a default would quietly bias the data.
            setLostReason(null);
            setLostError(null);
            if (deal) {
                setPriceChoice(defaultFinalPriceChoice(deal));
                setCustomPrice(seedCustomFinalPrice(deal));
            }
        }
    }

    if (!request) return null;

    const asksFinalPrice = request.status === "closed" && deal != null;
    const asksLostReason = request.status === "lost" && deal != null;
    const finalPrice = deal ? resolveFinalPrice(deal, priceChoice, customPrice) : null;
    const commission = resolveFinalCommission(
        commissionType,
        commissionValue,
        finalPrice?.amountInr ?? 0,
    );
    const currency = getActiveCurrency();
    // Keep commission durable through the existing status-note and offer-notes API.
    const commissionLine =
        asksFinalPrice && commission.amount != null && finalPrice?.amountInr != null
            ? `Final commission: ${commissionType === "percent" ? `${Number(commissionValue)}% (${formatAmountWithSymbol(commission.amount, currency, amountFormatFor(currency))})` : formatAmountWithSymbol(commission.amount, currency, amountFormatFor(currency))}`
            : "";
    const noteMax = MAX_CHARS.pipelineStageNote - (commissionLine ? commissionLine.length + 2 : 0);

    const confirm = () => {
        if (asksFinalPrice) {
            const result = resolveFinalPrice(deal, priceChoice, customPrice);
            if (result.error != null) {
                setPriceError(result.error);
                return;
            }
            setPriceError(null);
            if (commission.error) {
                setCommissionError(commission.error);
                return;
            }
            if (note.length > noteMax) {
                setCommissionError(
                    `Shorten the note to ${noteMax} characters to include the commission.`,
                );
                return;
            }
            setCommissionError(null);
            onConfirm([commissionLine, note.trim()].filter(Boolean).join("\n\n"), {
                closedAmountInr: result.amountInr,
            });
            return;
        }
        if (asksLostReason) {
            const error = validateLostReason(lostReason);
            if (error != null || lostReason == null) {
                setLostError(error);
                return;
            }
            setLostError(null);
            onConfirm(note, { lostReason });
            return;
        }
        onConfirm(note, {});
    };

    const sendsToOwner = asksFinalPrice && saleMode === "owner";
    const consequence = asksFinalPrice ? saleConsequence(saleMode, otherClientCount) : null;
    const primaryLabel = isSaving
        ? sendsToOwner
            ? "Sending…"
            : "Saving…"
        : asksFinalPrice
          ? sendsToOwner
              ? "Send to owner"
              : "Mark as sold"
          : asksLostReason
            ? "Mark as lost"
            : "Confirm";
    const PrimaryIcon = asksFinalPrice ? BadgeCheck : asksLostReason ? LostIcon : StickyNote;

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
                    primaryLabel={primaryLabel}
                    primaryIcon={<PrimaryIcon aria-hidden strokeWidth={1.75} />}
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

                {asksFinalPrice ? (
                    <FinalCommissionField
                        type={commissionType}
                        value={commissionValue}
                        amount={finalPrice?.amountInr != null ? commission.amount : null}
                        isRent={deal.property.isRent}
                        error={commissionError}
                        disabled={isSaving}
                        onTypeChange={(next) => {
                            setCommissionType(next);
                            setCommissionValue("");
                            setCommissionError(null);
                        }}
                        onValueChange={(next) => {
                            setCommissionValue(next);
                            setCommissionError(null);
                        }}
                    />
                ) : null}

                {consequence ? (
                    <p className="body-sm flex items-start gap-2 text-ink-muted">
                        <Info
                            aria-hidden
                            strokeWidth={1.75}
                            className="mbs-0.5 shrink-0 block-4 inline-4"
                        />
                        <span>{consequence}</span>
                    </p>
                ) : null}

                {asksLostReason ? (
                    <LostReasonField
                        deal={deal}
                        reason={lostReason}
                        onReasonChange={(next) => {
                            setLostReason(next);
                            setLostError(null);
                        }}
                        error={lostError}
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
                        rows={asksFinalPrice || asksLostReason ? 3 : 4}
                        maxLength={noteMax}
                        placeholder={notePlaceholder(request.status)}
                        className="rounded-inner"
                        disabled={isSaving}
                        aria-describedby="stage-note-count"
                    />
                    <CharacterCount id="stage-note-count" value={note} maxChars={noteMax} />
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
