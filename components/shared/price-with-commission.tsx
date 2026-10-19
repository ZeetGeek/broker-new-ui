"use client";

import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** Who is looking. Brokers earn the cut; owners see what they offered a broker. */
export type CommissionAudience = "broker" | "owner";

const NO_COMMISSION_TIP = "Owner hasn't added a commission";

export type PriceWithCommissionProps = {
    amountInr: number;
    isRent?: boolean;
    /** Sale commission percent. Hidden when unset or 0. */
    commissionPercent?: number | null;
    /** Fixed rent brokerage in INR. Hidden when unset or 0. */
    commissionAmountInr?: number | null;
    /**
     * Broker: "You get ₹…". Owner: "Broker gets ₹…".
     * Defaults to broker — marketplace and pipeline cards.
     */
    audience?: CommissionAudience;
    /**
     * When commission is unset, still show a hover tip (no underline).
     * Works for rent, sale, and both. Only a set fee underlines the price.
     */
    showNoRentCommission?: boolean;
    className?: string;
};

type CommissionTip = {
    /** "You get ₹15,000" — rent cut is a fixed fee, never `/mo` */
    headline: string;
    /** "Fixed amount" or "2% of ₹85 L". Empty for the no-commission tip. */
    detail: string;
    /** When true, tip is informational only — do not underline the price. */
    plain?: boolean;
};

function positive(value: number | null | undefined): number {
    if (value == null || !Number.isFinite(value) || value <= 0) return 0;
    return value;
}

/** API money fields arrive as strings. Returns null when unset. */
export function toCommissionNumber(value: string | number | null | undefined): number | null {
    if (value == null || value === "") return null;
    const amount = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return amount;
}

function formatPercent(percent: number): string {
    const rounded = Math.round(percent * 100) / 100;
    return `${rounded}%`;
}

function noCommissionTip(): CommissionTip {
    return { headline: NO_COMMISSION_TIP, detail: "", plain: true };
}

/**
 * Commission the owner actually set for this price.
 * Rent is a fixed fee (no `/mo`). Sale is a percent of the ask.
 * Returns null when that side was left blank — unless `showNoRentCommission`.
 */
export function listingCommissionTip({
    amountInr,
    isRent = false,
    commissionPercent,
    commissionAmountInr,
    audience = "broker",
    showNoRentCommission = false,
}: PriceWithCommissionProps): CommissionTip | null {
    const lead = audience === "owner" ? "Broker gets" : "You get";

    if (isRent) {
        const brokerageInr = positive(commissionAmountInr);
        if (brokerageInr <= 0) {
            return showNoRentCommission ? noCommissionTip() : null;
        }
        return {
            headline: `${lead} ${formatPriceInr(brokerageInr)}`,
            detail: "Fixed amount",
        };
    }

    const percent = positive(commissionPercent);
    const priceInr = positive(amountInr);
    if (percent <= 0) {
        return showNoRentCommission ? noCommissionTip() : null;
    }
    if (priceInr <= 0) return null;

    const cutInr = Math.round((priceInr * percent) / 100);
    if (cutInr <= 0) return null;

    return {
        headline: `${lead} ${formatPriceInr(cutInr)}`,
        detail: `${formatPercent(percent)} of ${formatPriceInr(priceInr)}`,
    };
}

/**
 * Listing price. Hover shows the brokerage when a commission was set.
 * Unset commission can still tip (no underline) when `showNoRentCommission`.
 */
export function PriceWithCommission({
    amountInr,
    isRent = false,
    commissionPercent,
    commissionAmountInr,
    audience = "broker",
    showNoRentCommission = false,
    className,
}: PriceWithCommissionProps) {
    const priceLabel = isRent ? formatRentInr(amountInr) : formatPriceInr(amountInr);
    const tip = listingCommissionTip({
        amountInr,
        isRent,
        commissionPercent,
        commissionAmountInr,
        audience,
        showNoRentCommission,
    });

    const underline = Boolean(tip && !tip.plain);
    const priceClass = cn(
        "tabular text-brand",
        className,
        underline &&
            "cursor-help underline decoration-brand/30 decoration-from-font underline-offset-2",
    );

    if (!tip) {
        return <span className={priceClass}>{priceLabel}</span>;
    }

    const ariaLabel = tip.plain
        ? `${priceLabel}. ${tip.headline}`
        : `${priceLabel}. ${tip.headline}. ${tip.detail}`;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger
                    delay={200}
                    render={
                        <button
                            type="button"
                            className={cn(
                                "inline border-0 bg-transparent p-0 text-start text-inherit",
                                tip.plain ? "cursor-default" : "cursor-help",
                            )}
                            aria-label={ariaLabel}
                        >
                            <span className={priceClass}>{priceLabel}</span>
                        </button>
                    }
                />
                <TooltipContent
                    side="top"
                    className={cn(
                        "text-center",
                        tip.plain ? "whitespace-nowrap max-inline-none" : "max-inline-xs",
                    )}
                >
                    {tip.plain ? (
                        <span className="font-medium">{tip.headline}</span>
                    ) : (
                        <>
                            <span className="font-semibold tabular-nums">{tip.headline}</span>
                            <span className="opacity-80">{tip.detail}</span>
                        </>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
