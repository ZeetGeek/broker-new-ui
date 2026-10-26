"use client";

import { cva, type VariantProps } from "class-variance-authority";

import { offersBoth, offersRent, offersSale } from "@/lib/format/listing-availability";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** Who is looking. Brokers earn the cut; owners see what they offered a broker. */
export type CommissionAudience = "broker" | "owner";

/** Type-scale sizes for listing ask prices. Prefer `size` over one-off `className`. */
export type PriceWithCommissionSize = NonNullable<
    VariantProps<typeof priceWithCommissionSize>["size"]
>;

const NO_COMMISSION_TIP_BROKER = "Owner hasn't added a commission";
const NO_COMMISSION_TIP_OWNER = "You haven't added a commission";

const priceWithCommissionSize = cva("tabular text-brand", {
    variants: {
        size: {
            /** Dense rows — attach lists, compact meta. */
            xs: "body-xs font-semibold",
            /** Dashboard strips, request rows. */
            sm: "body-sm font-semibold",
            /** Inline next to titles. */
            md: "body font-semibold",
            /** Default card price (browse, deals, pipeline). */
            lg: "h5 font-semibold tracking-wide",
            /** Emphasized card / modal header. */
            xl: "h4 font-semibold tracking-wide",
            /** Property detail hero. */
            "2xl": "display-3",
        },
    },
    defaultVariants: {
        size: "lg",
    },
});

type TipInput = {
    amountInr: number;
    isRent?: boolean;
    commissionPercent?: number | null;
    commissionAmountInr?: number | null;
    audience?: CommissionAudience;
    /** When commission is unset, still show a hover tip. Defaults on. */
    showEmptyTip?: boolean;
};

export type PriceWithCommissionProps = TipInput & {
    /**
     * Type step for the price. Prefer this over raw type classes in `className`.
     * @default "lg"
     */
    size?: PriceWithCommissionSize;
    /**
     * Broker: "You get ₹…". Owner: "Broker gets ₹…".
     * @default "broker"
     */
    audience?: CommissionAudience;
    /**
     * When commission is unset, still show a hover tip. The price is not underlined.
     * @default true
     */
    showEmptyTip?: boolean;
    /**
     * @deprecated Use `showEmptyTip`. Kept so existing call sites keep working.
     */
    showNoRentCommission?: boolean;
    /**
     * `auto` — underline only when a commission is set.
     * `never` — tip may still open on hover, but price is not underlined.
     * @default "auto"
     */
    underline?: "auto" | "never";
    /** Tooltip placement. @default "top" */
    tooltipSide?: "top" | "bottom" | "left" | "right";
    /** Extra classes merged after `size` (colour, truncate, etc.). */
    className?: string;
};

type CommissionTip = {
    /** "You get ₹15,000" — rent cut is a fixed fee, never `/mo` */
    headline: string;
    /** "Fixed amount" or "2% of ₹85 L". Empty for the no-commission tip. */
    detail: string;
    /** When true, tip is the empty-commission message. */
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

function noCommissionTip(audience: CommissionAudience): CommissionTip {
    return {
        headline: audience === "owner" ? NO_COMMISSION_TIP_OWNER : NO_COMMISSION_TIP_BROKER,
        detail: "",
        plain: true,
    };
}

function resolveShowEmptyTip({
    showEmptyTip,
    showNoRentCommission,
}: Pick<PriceWithCommissionProps, "showEmptyTip" | "showNoRentCommission">): boolean {
    if (showEmptyTip != null) return showEmptyTip;
    if (showNoRentCommission != null) return showNoRentCommission;
    return true;
}

/**
 * Commission the owner actually set for this price.
 * Rent is a fixed fee (no `/mo`). Sale is a percent of the ask.
 * Returns null when that side was left blank — unless `showEmptyTip`.
 */
export function listingCommissionTip({
    amountInr,
    isRent = false,
    commissionPercent,
    commissionAmountInr,
    audience = "broker",
    showEmptyTip = true,
}: TipInput): CommissionTip | null {
    const lead = audience === "owner" ? "Broker gets" : "You get";

    if (isRent) {
        const brokerageInr = positive(commissionAmountInr);
        if (brokerageInr <= 0) {
            return showEmptyTip ? noCommissionTip(audience) : null;
        }
        return {
            headline: `${lead} ${formatPriceInr(brokerageInr)}`,
            detail: "Fixed amount",
        };
    }

    const percent = positive(commissionPercent);
    const priceInr = positive(amountInr);
    if (percent <= 0) {
        return showEmptyTip ? noCommissionTip(audience) : null;
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
 * Shared listing-ask price. Hover shows brokerage (or empty-commission copy).
 *
 * Use this for sale / monthly rent on a property. Prefer `size` for type scale;
 * keep `<Price>` for offers, budgets, and totals.
 */
export function PriceWithCommission({
    amountInr,
    isRent = false,
    commissionPercent,
    commissionAmountInr,
    audience = "broker",
    showEmptyTip,
    showNoRentCommission,
    size = "lg",
    underline = "auto",
    tooltipSide = "top",
    className,
}: PriceWithCommissionProps) {
    const emptyTip = resolveShowEmptyTip({ showEmptyTip, showNoRentCommission });
    const priceLabel = isRent ? formatRentInr(amountInr) : formatPriceInr(amountInr);
    const tip = listingCommissionTip({
        amountInr,
        isRent,
        commissionPercent,
        commissionAmountInr,
        audience,
        showEmptyTip: emptyTip,
    });

    const showUnderline = Boolean(tip && !tip.plain) && underline === "auto";
    const priceClass = cn(
        priceWithCommissionSize({ size }),
        className,
        showUnderline &&
            "cursor-help underline decoration-brand/40 decoration-from-font underline-offset-2",
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
                            onClick={(event) => {
                                // Pipeline / deal cards open on article click — keep the tip control local.
                                event.stopPropagation();
                            }}
                            onPointerDown={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            <span className={priceClass}>{priceLabel}</span>
                        </button>
                    }
                />
                <TooltipContent
                    side={tooltipSide}
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

export type ListingAskPricesListing = {
    saleAmountInr: number | null;
    rentAmountInr: number | null;
    commissionPercent?: number | null;
    commissionAmount?: number | null;
};

/**
 * Card price line for a listing that may be for sale, rent, or both.
 * Both: sale ask first, then "/ Also ₹…/mo" — each with its own commission tip.
 */
export function ListingAskPrices({
    listing,
    audience = "broker",
    showEmptyTip = true,
}: {
    listing: ListingAskPricesListing;
    audience?: CommissionAudience;
    showEmptyTip?: boolean;
}) {
    const isRentOnly = offersRent(listing) && !offersSale(listing);

    if (isRentOnly) {
        return (
            <PriceWithCommission
                amountInr={listing.rentAmountInr ?? 0}
                isRent
                commissionAmountInr={listing.commissionAmount}
                audience={audience}
                showEmptyTip={showEmptyTip}
                size="lg"
            />
        );
    }

    if (offersBoth(listing)) {
        return (
            <p
                className="
                  flex flex-wrap items-baseline gap-x-1.5 text-brand tabular-nums min-inline-0
                "
            >
                <PriceWithCommission
                    amountInr={listing.saleAmountInr ?? 0}
                    commissionPercent={listing.commissionPercent}
                    audience={audience}
                    showEmptyTip={showEmptyTip}
                    size="lg"
                />
                <span className="font-medium text-ink-subtle" aria-hidden>
                    /
                </span>
                <span className="body-sm font-medium tracking-wide text-ink-muted">
                    Also{" "}
                    <PriceWithCommission
                        amountInr={listing.rentAmountInr ?? 0}
                        isRent
                        commissionAmountInr={listing.commissionAmount}
                        audience={audience}
                        showEmptyTip={showEmptyTip}
                        size="sm"
                        className="text-ink"
                    />
                </span>
            </p>
        );
    }

    return (
        <PriceWithCommission
            amountInr={listing.saleAmountInr ?? 0}
            commissionPercent={listing.commissionPercent}
            audience={audience}
            showEmptyTip={showEmptyTip}
            size="lg"
        />
    );
}
