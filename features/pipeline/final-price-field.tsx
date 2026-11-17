"use client";

import type { ReactNode } from "react";

import { formatPrice, formatRent } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { CurrencyInput } from "@/components/shared/currency-input";
import { Price } from "@/components/shared/price";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { OFFER_STATUS_LABEL } from "@/features/pipeline/stage-meta";
import type { DealItem } from "@/features/pipeline/types";

export type FinalPriceChoice = "listed" | "offer" | "custom";

/** ₹9,999 crore. Anything longer is a typo, and past 2^53 Number loses digits. */
const MAX_PRICE_DIGITS = 11;
/** A final price this many times the list price is almost always an extra zero. */
const MAX_PRICE_TO_LIST_RATIO = 10;

function digitsOnly(value: string): string {
    return value.replace(/\D/g, "");
}

function money(amount: number, isRent: boolean): string {
    return isRent ? formatRent(amount) : formatPrice(amount);
}

/** The client's offer, when it is a real alternative to the listed price. */
function offerOption(deal: DealItem): number | null {
    const offer = deal.offerAmountInr;
    if (offer == null || offer <= 0) return null;
    return offer === deal.property.amountInr ? null : offer;
}

/** Which option opens selected: an accepted offer, else the listed price, else typing. */
export function defaultFinalPriceChoice(deal: DealItem): FinalPriceChoice {
    if (offerOption(deal) != null && deal.offerStatus === "accepted") return "offer";
    if (deal.property.amountInr > 0) return "listed";
    return "custom";
}

/** Starting text for the custom box: the offer if there is one, else the list price. */
export function seedCustomFinalPrice(deal: DealItem): string {
    const seed = offerOption(deal) ?? deal.property.amountInr;
    return seed > 0 ? String(seed) : "";
}

/**
 * The amount the deal closed at, or an error sentence the field can show.
 * Plain function so the modal can validate on Confirm without a ref.
 */
export function resolveFinalPrice(
    deal: DealItem,
    choice: FinalPriceChoice,
    customAmount: string,
): { amountInr: number; error: null } | { amountInr: null; error: string } {
    if (choice === "listed" && deal.property.amountInr > 0) {
        return { amountInr: deal.property.amountInr, error: null };
    }
    const offer = offerOption(deal);
    if (choice === "offer" && offer != null) return { amountInr: offer, error: null };

    const amount = Number(digitsOnly(customAmount));
    if (!Number.isInteger(amount) || amount < 1) {
        return {
            amountInr: null,
            error: deal.property.isRent
                ? "Enter the final monthly rent in whole rupees."
                : "Enter the final price in whole rupees.",
        };
    }
    const listed = deal.property.amountInr;
    if (listed > 0 && amount > listed * MAX_PRICE_TO_LIST_RATIO) {
        return {
            amountInr: null,
            error: "That is more than 10 times the listed price. Check the number of zeros.",
        };
    }
    return { amountInr: amount, error: null };
}

/** "₹2 L below the listed price (9%)", or null when equal / unknown. */
function differenceLine(amount: number, listed: number, isRent: boolean): string | null {
    if (listed <= 0 || amount <= 0 || amount === listed) return null;
    const diff = Math.abs(amount - listed);
    const percent = Math.round((diff / listed) * 100);
    const direction = amount < listed ? "below" : "above";
    return `${money(diff, isRent)} ${direction} the listed price${percent > 0 ? ` (${percent}%)` : ""}`;
}

/** Live read-back under the typed amount, in lakh/crore words. */
function customHint(amount: number, listed: number, isRent: boolean): string {
    if (amount <= 0) return "Whole rupees, e.g. 1800000 for ₹18 L";
    if (listed > 0 && amount === listed)
        return `${money(amount, isRent)}, same as the listed price`;
    const diff = differenceLine(amount, listed, isRent);
    return diff ? `${money(amount, isRent)} · ${diff}` : money(amount, isRent);
}

/**
 * One choice. The radio and its words are the label; anything passed as
 * `children` (the amount box) sits inside the same card but outside the
 * label, so tapping into the box never re-fires the radio.
 */
function ChoiceCard({
    value,
    selected,
    disabled,
    title,
    detail,
    children,
}: {
    value: FinalPriceChoice;
    selected: boolean;
    disabled: boolean;
    title: string;
    detail?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div
            className={cn(
                "rounded-card border transition-[background-color,border-color] duration-160",
                selected
                    ? "border-brand bg-brand-soft/40"
                    : "border-border-warm bg-surface hover:border-ink/20",
                disabled && "opacity-60",
            )}
        >
            <label
                className={cn(
                    "flex items-start gap-3 px-4 py-3.5 min-block-12",
                    disabled ? "cursor-not-allowed" : "cursor-pointer",
                )}
            >
                <RadioGroupItem
                    value={value}
                    disabled={disabled}
                    // The shared radio rests as a grey dot that reads as
                    // disabled; an outlined ring reads as "pick me".
                    className="mbs-0.5 shrink-0 border-ink/30 bg-surface data-checked:border-transparent"
                />
                <span className="flex flex-1 flex-col gap-0.5 min-inline-0">
                    <span className="body-sm font-semibold text-ink">{title}</span>
                    {detail ? <span className="body-xs text-ink-muted">{detail}</span> : null}
                </span>
            </label>
            {children ? <div className="px-4 pbe-4">{children}</div> : null}
        </div>
    );
}

/**
 * "What did this deal close at?", asked when a broker marks a deal sold.
 *
 * Listed price, the client's offer (when there is one and it differs), or a
 * different amount the broker types. Controlled: the modal owns the state so
 * it can validate on Confirm and keep the input if the save fails.
 */
export function FinalPriceField({
    deal,
    choice,
    onChoiceChange,
    customAmount,
    onCustomAmountChange,
    error,
    disabled,
}: {
    deal: DealItem;
    choice: FinalPriceChoice;
    onChoiceChange: (choice: FinalPriceChoice) => void;
    customAmount: string;
    onCustomAmountChange: (value: string) => void;
    error: string | null;
    disabled: boolean;
}) {
    const { isRent } = deal.property;
    const listed = deal.property.amountInr;
    const offer = offerOption(deal);
    const customValue = Number(digitsOnly(customAmount)) || 0;
    const legend = isRent ? "Final monthly rent" : "Final price";
    const offerDiff = offer != null ? differenceLine(offer, listed, isRent) : null;

    return (
        <fieldset className="flex flex-col gap-3" disabled={disabled}>
            {/* Legend and the listed price share one line: the question on the
                left, the reference amount on the right. */}
            <legend className="mbe-3 flex items-baseline justify-between gap-3 inline-full">
                <span className="body-sm font-semibold text-ink">{legend}</span>
                {listed > 0 ? (
                    <span className="body-xs text-ink-muted">
                        Listed{" "}
                        <PriceWithCommission
                            amountInr={listed}
                            isRent={isRent}
                            commissionPercent={deal.property.commissionPercent}
                            commissionAmountInr={deal.property.commissionAmountInr}
                            audience="broker"
                            size="xs"
                            className="font-semibold text-ink"
                        />
                    </span>
                ) : null}
            </legend>

            <RadioGroup
                value={choice}
                onValueChange={(value) => onChoiceChange(value as FinalPriceChoice)}
                aria-label={legend}
                className="gap-2"
            >
                {listed > 0 ? (
                    <ChoiceCard
                        value="listed"
                        selected={choice === "listed"}
                        disabled={disabled}
                        title="Same as the listed price"
                        detail="The client paid what the owner asked"
                    />
                ) : null}
                {offer != null ? (
                    <ChoiceCard
                        value="offer"
                        selected={choice === "offer"}
                        disabled={disabled}
                        title="The client's offer"
                        detail={
                            <>
                                <Price
                                    amountInr={offer}
                                    isRent={isRent}
                                    className="font-semibold text-ink"
                                />
                                {deal.offerStatus
                                    ? ` · ${OFFER_STATUS_LABEL[deal.offerStatus]}`
                                    : null}
                                {offerDiff ? ` · ${offerDiff}` : null}
                            </>
                        }
                    />
                ) : null}
                <ChoiceCard
                    value="custom"
                    selected={choice === "custom"}
                    disabled={disabled}
                    title="A different amount"
                    detail={
                        listed > 0
                            ? "Agreed on another price"
                            : "This listing has no price. Enter what the deal closed at"
                    }
                >
                    {choice === "custom" ? (
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="final-price" className="sr-only">
                                {legend} in rupees
                            </label>
                            <CurrencyInput
                                id="final-price"
                                valueDigits={digitsOnly(customAmount)}
                                onChangeDigits={onCustomAmountChange}
                                placeholder={isRent ? "18000" : "1800000"}
                                disabled={disabled}
                                errorText={error ?? undefined}
                                maxDigits={MAX_PRICE_DIGITS}
                                aria-describedby="final-price-hint"
                                autoFocus
                            />
                            {error ? null : (
                                <p
                                    id="final-price-hint"
                                    aria-live="polite"
                                    className="body-xs tabular text-ink-muted"
                                >
                                    {customHint(customValue, listed, isRent)}
                                </p>
                            )}
                        </div>
                    ) : null}
                </ChoiceCard>
            </RadioGroup>
        </fieldset>
    );
}
