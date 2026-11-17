"use client";

import { useId } from "react";

import type { Currency } from "@/lib/format/currency";
import { formatPrice, formatRent } from "@/lib/format/price";

import { SmartPriceInput, useAmountFormat } from "@/components/shared/smart-price-input";

export type PriceRange = { min: number | null; max: number | null };

/**
 * Budget-style min / max pair on top of `SmartPriceInput`. Typing or pasting
 * a whole range ("500k-750k", "50L to 60L") into either box fills both.
 */
export function PriceRangeInput({
    value,
    onValueChange,
    kind = "sale",
    currency: currencyOverride,
    iso2,
    disabled,
}: {
    value: PriceRange;
    onValueChange: (value: PriceRange) => void;
    kind?: "sale" | "rent";
    currency?: Currency;
    iso2?: string | null;
    disabled?: boolean;
}) {
    const id = useId();
    const { currency, format } = useAmountFormat(currencyOverride, iso2);
    const isReversed = value.min != null && value.max != null && value.min > value.max;
    const both = value.min != null && value.max != null && !isReversed;
    const show = (amount: number) =>
        kind === "rent" ? formatRent(amount, currency) : formatPrice(amount, currency);

    const fillBoth = (min: number, max: number) =>
        onValueChange({ min: Math.min(min, max), max: Math.max(min, max) });

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor={`${id}-min`} className="body-sm font-semibold text-ink">
                        Min
                    </label>
                    <SmartPriceInput
                        id={`${id}-min`}
                        value={value.min}
                        onValueChange={(min) => onValueChange({ ...value, min })}
                        onRangeInput={fillBoth}
                        kind={kind}
                        currency={currencyOverride}
                        iso2={iso2}
                        disabled={disabled}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor={`${id}-max`} className="body-sm font-semibold text-ink">
                        Max
                    </label>
                    <SmartPriceInput
                        id={`${id}-max`}
                        value={value.max}
                        onValueChange={(max) => onValueChange({ ...value, max })}
                        onRangeInput={fillBoth}
                        kind={kind}
                        currency={currencyOverride}
                        iso2={iso2}
                        disabled={disabled}
                    />
                </div>
            </div>
            <p aria-live="polite" className="body-sm tabular">
                {isReversed ? (
                    <span className="text-danger">Min is more than max. Swap them or fix one.</span>
                ) : both ? (
                    <span className="text-ink">
                        {show(value.min!)} – {show(value.max!)}
                    </span>
                ) : (
                    <span className="text-ink-subtle">
                        Tip: type a whole range like{" "}
                        {format.numbering === "indian" ? "50L-60L" : "500k-750k"}
                    </span>
                )}
            </p>
        </div>
    );
}
