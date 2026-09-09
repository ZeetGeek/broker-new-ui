"use client";

import { useState } from "react";

import { Handshake } from "lucide-react";

import { formatPriceInr, formatRentInr } from "@/lib/format/price";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { DealItem } from "@/features/pipeline/types";

function digitsOnly(value: string): string {
    return value.replace(/\D/g, "");
}

function amountHint(raw: string, isRent: boolean): string | null {
    const digits = digitsOnly(raw);
    if (!digits) return null;
    const n = Number(digits);
    if (!Number.isFinite(n) || n < 1) return null;
    return isRent ? formatRentInr(n) : formatPriceInr(n);
}

function seedAmount(deal: DealItem): string {
    if (deal.offerAmountInr != null && deal.offerAmountInr > 0) {
        return String(deal.offerAmountInr);
    }
    if (deal.property.amountInr > 0) {
        return String(deal.property.amountInr);
    }
    return "";
}

/**
 * Submit or revise an offer on a lead. Amount is required; notes are optional.
 * Uses POST /clients/leads/:id/offer (same as the previous leads UI).
 */
export function MakeOfferModal({
    open,
    deal,
    isSaving,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    deal: DealItem | null;
    isSaving: boolean;
    onConfirm: (offerAmount: number, notes: string) => void;
    onCancel: () => void;
}) {
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Reset when the modal opens for a deal — derived on the open edge so we
    // do not setState inside an effect (cascading render lint).
    const draftKey = open && deal ? `${deal.id}:${deal.offerAmountInr ?? ""}` : null;
    const [activeKey, setActiveKey] = useState<string | null>(null);
    if (draftKey !== activeKey) {
        setActiveKey(draftKey);
        if (draftKey && deal) {
            setAmount(seedAmount(deal));
            setNotes("");
            setError(null);
        }
    }

    const isRevise = deal?.offerStatus === "rejected";
    const hint = deal ? amountHint(amount, deal.property.isRent) : null;

    const submit = () => {
        const offerAmount = Number(digitsOnly(amount));
        if (!Number.isInteger(offerAmount) || offerAmount < 1) {
            setError("Enter a valid offer amount in whole rupees.");
            return;
        }
        setError(null);
        onConfirm(offerAmount, notes);
    };

    if (!deal) return null;

    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (!next && !isSaving) onCancel();
            }}
            size="sm"
            title={isRevise ? "Revise offer" : "Make offer"}
            description={`${deal.buyer.name} on ${deal.property.title}. The owner will be notified.`}
            footer={
                <AppModalFooter
                    primaryLabel={
                        isSaving ? "Submitting…" : isRevise ? "Revise offer" : "Submit offer"
                    }
                    primaryIcon={<Handshake aria-hidden strokeWidth={1.75} />}
                    onPrimary={submit}
                    primaryDisabled={isSaving}
                    secondaryLabel="Cancel"
                    onSecondary={onCancel}
                    secondaryDisabled={isSaving}
                />
            }
        >
            <div className="flex flex-col gap-4">
                <p className="body-sm text-ink-muted">
                    List price{" "}
                    <span className="font-medium text-ink">
                        {deal.property.isRent
                            ? formatRentInr(deal.property.amountInr)
                            : formatPriceInr(deal.property.amountInr)}
                    </span>
                </p>

                <div className="flex flex-col gap-2">
                    <label htmlFor="offer-amount" className="body-sm font-medium text-ink">
                        Offer amount (INR)
                    </label>
                    <Input
                        id="offer-amount"
                        inputMode="numeric"
                        value={amount}
                        onChange={(event) => {
                            setAmount(digitsOnly(event.target.value));
                            if (error) setError(null);
                        }}
                        placeholder={deal.property.isRent ? "25000" : "7500000"}
                        autoComplete="off"
                        disabled={isSaving}
                        errorText={error ?? undefined}
                    />
                    <p className="body-xs tabular text-ink-subtle">{hint ?? "Whole rupees only"}</p>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="offer-notes" className="body-sm font-medium text-ink">
                        Notes <span className="font-normal text-ink-subtle">(optional)</span>
                    </label>
                    <Textarea
                        id="offer-notes"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="e.g. Cash buyer, ready to close in 30 days"
                        className="rounded-inner"
                        disabled={isSaving}
                    />
                </div>
            </div>
        </AppModal>
    );
}
