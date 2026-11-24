"use client";

import { Price } from "@/components/shared/price";
import { RadioGroup } from "@/components/ui/radio-group";

import { FEATURE_PLATFORM_OWNER } from "@/config";
import { ChoiceCard } from "@/features/pipeline/choice-card";
import { differenceLine } from "@/features/pipeline/final-price-field";
import {
    DEAL_LOST_REASON_DETAIL,
    DEAL_LOST_REASON_LABEL,
    OFFER_STATUS_LABEL,
} from "@/features/pipeline/stage-meta";
import type { DealItem, DealLostReason } from "@/features/pipeline/types";

/** Order a broker would scan them in: price first, it is the most common. */
const LOST_REASON_ORDER: DealLostReason[] = [
    "price",
    "bought_elsewhere",
    "not_responding",
    "changed_mind",
];

/** Error sentence when Confirm is pressed with nothing picked, else null. */
export function validateLostReason(reason: DealLostReason | null): string | null {
    return reason ? null : "Pick why this deal was lost.";
}

/**
 * "Why was this deal lost?", asked when a broker marks a deal lost.
 *
 * One quick choice, no amount: a lost deal has no final price. When the
 * reason is price and the client made an offer, the offer is shown under
 * that choice, since it is already on the deal and needs no retyping.
 * Controlled: the modal owns the state and validates on Confirm.
 */
export function LostReasonField({
    deal,
    reason,
    onReasonChange,
    error,
    disabled,
}: {
    deal: DealItem;
    reason: DealLostReason | null;
    onReasonChange: (reason: DealLostReason) => void;
    error: string | null;
    disabled: boolean;
}) {
    const { isRent } = deal.property;
    const offer =
        deal.offerAmountInr != null && deal.offerAmountInr > 0 ? deal.offerAmountInr : null;
    const offerGap = offer != null ? differenceLine(offer, deal.property.amountInr, isRent) : null;

    return (
        <fieldset
            className="flex flex-col gap-3"
            disabled={disabled}
            aria-describedby={error ? "lost-reason-error" : undefined}
        >
            <legend className="body-sm mbe-3 font-semibold text-ink">Why was it lost?</legend>

            <RadioGroup
                // `""` keeps the group controlled while nothing is picked yet.
                value={reason ?? ""}
                onValueChange={(value) => onReasonChange(value as DealLostReason)}
                aria-label="Why was it lost?"
                aria-invalid={error ? true : undefined}
                className="gap-2"
            >
                {LOST_REASON_ORDER.map((key) => (
                    <ChoiceCard
                        key={key}
                        value={key}
                        selected={reason === key}
                        disabled={disabled}
                        title={DEAL_LOST_REASON_LABEL[key]}
                        detail={
                            key === "price" && offer != null ? (
                                <>
                                    Last offer{" "}
                                    <Price
                                        amountInr={offer}
                                        isRent={isRent}
                                        className="font-semibold text-ink"
                                    />
                                    {FEATURE_PLATFORM_OWNER && deal.offerStatus
                                        ? ` · ${OFFER_STATUS_LABEL[deal.offerStatus]}`
                                        : null}
                                    {offerGap ? ` · ${offerGap}` : null}
                                </>
                            ) : (
                                DEAL_LOST_REASON_DETAIL[key]
                            )
                        }
                    />
                ))}
            </RadioGroup>

            {error ? (
                <p id="lost-reason-error" role="alert" className="body-sm text-danger">
                    {error}
                </p>
            ) : null}
        </fieldset>
    );
}
