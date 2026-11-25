"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { clientsApi } from "@/lib/api/clients";
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
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

import { ChoiceCard } from "@/features/pipeline/choice-card";
import { type ClosedAs, dealAsClosed } from "@/features/pipeline/closed-as";
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
import { useAppSelector } from "@/store/hooks";

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
    /** How a Sale & Rent listing closed. */
    closedAs?: ClosedAs;
};

const CLOSED_AS_REQUIRED = "Choose Sold or Rented.";

function moveTitle(status: DealStatus, isRent: boolean, dual: boolean): string {
    if (isLiveStage(status)) {
        return `Move to ${DEAL_STAGE_META[status].label.toLowerCase()}`;
    }
    return status === "closed"
        ? dual
            ? "Close deal"
            : isRent
              ? "Mark as rented"
              : "Mark as sold"
        : "Mark as lost";
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
        return "The owner confirms the deal. Once they do, the property closes for every other client.";
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
    otherClientCount,
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
    const accountId = useAppSelector((state) => state.auth.user?.id);
    const needsClientCheck =
        open && request?.status === "closed" && deal != null && otherClientCount == null;
    const clients = useQuery({
        queryKey: ["pipeline-close-clients", accountId, deal?.property.id],
        queryFn: () => clientsApi.listOpenLeadClientIds(deal!.property.id),
        enabled: needsClientCheck,
        staleTime: 0,
        retry: 1,
    });
    const checkingClients = needsClientCheck && (clients.isPending || clients.isFetching);
    const clientCheckFailed = needsClientCheck && clients.isError;
    const affectedClients =
        otherClientCount ?? clients.data?.filter((id) => id !== deal?.buyer.id).length ?? 0;
    const [note, setNote] = useState("");
    const [priceChoice, setPriceChoice] = useState<FinalPriceChoice>("listed");
    const [customPrice, setCustomPrice] = useState("");
    const [priceError, setPriceError] = useState<string | null>(null);
    const [lostReason, setLostReason] = useState<DealLostReason | null>(null);
    const [lostError, setLostError] = useState<string | null>(null);
    const [closedAs, setClosedAs] = useState<ClosedAs | null>(null);
    const [closedAsError, setClosedAsError] = useState<string | null>(null);
    const [commissionType, setCommissionType] = useState<FinalCommissionType>("percent");
    const [commissionValue, setCommissionValue] = useState<string | null>("");
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
            // No preselection either: sold vs rented changes the money.
            setClosedAs(null);
            setClosedAsError(null);
            if (deal) {
                setPriceChoice(defaultFinalPriceChoice(deal));
                setCustomPrice(seedCustomFinalPrice(deal));
            }
        }
    }

    if (!request) return null;

    const asksFinalPrice = request.status === "closed" && deal != null;
    const asksLostReason = request.status === "lost" && deal != null;
    // A Sale & Rent listing says how it closed first; the price follows from it.
    // Owner-confirmed sales go to the owner as an offer on the sale price.
    const asksClosedAs =
        asksFinalPrice && deal.property.saleAndRent != null && saleMode !== "owner";
    const priceDeal = !asksFinalPrice
        ? null
        : asksClosedAs
          ? closedAs
              ? dealAsClosed(deal, closedAs)
              : null
          : deal;

    const chooseClosedAs = (next: ClosedAs) => {
        setClosedAs(next);
        setClosedAsError(null);
        setPriceError(null);
        if (deal) {
            const closing = dealAsClosed(deal, next);
            setPriceChoice(defaultFinalPriceChoice(closing));
            setCustomPrice(seedCustomFinalPrice(closing));
            setCommissionType(closing.property.isRent ? "amount" : "percent");
            setCommissionValue("");
            setCommissionError(null);
        }
    };

    const finalPrice = priceDeal ? resolveFinalPrice(priceDeal, priceChoice, customPrice) : null;
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
        if (checkingClients || clientCheckFailed) return;
        if (asksFinalPrice) {
            if (asksClosedAs && !closedAs) {
                setClosedAsError(CLOSED_AS_REQUIRED);
                return;
            }
            const result = resolveFinalPrice(priceDeal ?? deal, priceChoice, customPrice);
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
                ...(asksClosedAs && closedAs ? { closedAs } : {}),
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
    const consequence =
        asksFinalPrice && !checkingClients && !clientCheckFailed
            ? saleConsequence(saleMode, affectedClients)
            : null;
    const primaryLabel = isSaving
        ? sendsToOwner
            ? "Sending…"
            : "Saving…"
        : asksFinalPrice
          ? sendsToOwner
              ? "Send to owner"
              : closedAs === "rent" || (!asksClosedAs && deal?.property.isRent)
                ? "Mark as rented"
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
            title={moveTitle(
                request.status,
                Boolean(deal?.property.isRent),
                Boolean(deal?.property.saleAndRent),
            )}
            description={moveDescription(deal)}
            footer={
                <AppModalFooter
                    primaryLabel={primaryLabel}
                    primaryIcon={<PrimaryIcon aria-hidden strokeWidth={1.75} />}
                    onPrimary={confirm}
                    primaryDisabled={
                        isSaving ||
                        checkingClients ||
                        clientCheckFailed ||
                        (asksFinalPrice && commission.error != null)
                    }
                    secondaryLabel="Cancel"
                    onSecondary={onCancel}
                    secondaryDisabled={isSaving}
                />
            }
        >
            <div className="flex flex-col gap-5">
                {checkingClients ? (
                    <p role="status" className="body-sm text-ink-muted">
                        Checking other clients on this property…
                    </p>
                ) : null}
                {clientCheckFailed ? (
                    <div
                        role="alert"
                        className="body-sm flex flex-col items-start gap-2 text-danger"
                    >
                        <p>
                            Could not check the other clients. Try again before closing this deal.
                        </p>
                        <Button variant="outline" onClick={() => void clients.refetch()}>
                            Try again
                        </Button>
                    </div>
                ) : null}
                {asksClosedAs ? (
                    <fieldset className="flex flex-col gap-3" disabled={isSaving}>
                        <legend className="body-sm mbe-3 font-semibold text-ink">
                            Did it sell or rent?
                        </legend>
                        <RadioGroup
                            value={closedAs ?? ""}
                            onValueChange={(value) => chooseClosedAs(value as ClosedAs)}
                            aria-label="Did it sell or rent?"
                            aria-invalid={closedAsError ? true : undefined}
                            className="grid grid-cols-2 gap-2"
                        >
                            <ChoiceCard
                                value="sale"
                                selected={closedAs === "sale"}
                                disabled={isSaving}
                                title="Sold"
                                detail="The client bought it"
                            />
                            <ChoiceCard
                                value="rent"
                                selected={closedAs === "rent"}
                                disabled={isSaving}
                                title="Rented"
                                detail="The client is renting it"
                            />
                        </RadioGroup>
                        {closedAsError ? (
                            <p role="alert" className="body-sm text-danger">
                                {closedAsError}
                            </p>
                        ) : null}
                    </fieldset>
                ) : null}

                {priceDeal ? (
                    <FinalPriceField
                        deal={priceDeal}
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

                {priceDeal ? (
                    <FinalCommissionField
                        type={commissionType}
                        value={commissionValue}
                        amount={finalPrice?.amountInr != null ? commission.amount : null}
                        isRent={priceDeal.property.isRent}
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
