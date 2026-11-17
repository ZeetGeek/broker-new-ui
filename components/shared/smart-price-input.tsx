"use client";

import { useId, useMemo, useState } from "react";

import {
    type AmountFormat,
    amountFormatFor,
    formatAmountGrouped,
    formatAmountWithSymbol,
    isAmountSum,
    MAX_AMOUNT,
    parseAmount,
    splitAmountRange,
} from "@/lib/format/amount-input";
import type { Currency } from "@/lib/format/currency";
import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils";
import { useMarket } from "@/hooks/use-market";

import { currencyIcon, TriangleAlert } from "@/components/shared/icons";
import { Input } from "@/components/ui/input";

export type PriceInputStatus = "empty" | "valid" | "invalid" | "too-large" | "too-small";

export type PriceReference = {
    /** Whole major units, same currency as the field. */
    amount: number;
    /** Lower-case noun phrase: "listed price", "client's budget". */
    label: string;
};

export type PricePerArea = {
    size: number;
    unit: "sqft" | "sqm";
};

export type SmartPriceInputProps = {
    id?: string;
    /** Whole major units (dollars, euros, rupees). Null when empty or invalid. */
    value: number | null;
    /** Only ever a safe integer or null — exactly what the API stores. */
    onValueChange: (value: number | null, status: PriceInputStatus) => void;
    /** Sale price or monthly rent. Changes the read-back and sanity checks. */
    kind?: "sale" | "rent";
    /** Overrides the signed-in market. Mostly for demos and public pages. */
    currency?: Currency;
    iso2?: string | null;
    /** What the amount is compared against ("$20K below listed price"). */
    reference?: PriceReference;
    /** The other kind's amount (sale price for a rent field, rent for a sale field). */
    pairedAmount?: number | null;
    /** Shows "≈ $250 per sq ft" when the property size is known. */
    perArea?: PricePerArea | null;
    min?: number;
    max?: number;
    /** Fires when the user types or pastes a range ("500k-750k"). */
    onRangeInput?: (min: number, max: number) => void;
    placeholder?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    /** Same steps as `Input`. Match the fields around it. */
    size?: "xs" | "sm" | "default" | "md" | "lg";
    /** Error from the form (zod, server). The field's own parse errors win. */
    errorText?: string;
    /** Shown under the field when there is no error. */
    helperText?: string;
    onBlur?: () => void;
    name?: string;
    className?: string;
    "aria-label"?: string;
    "aria-describedby"?: string;
};

/** A ratio past which the amount is almost always an extra or missing zero. */
const ZERO_SLIP_RATIO = 10;
/** Monthly rent above this share of the sale price is very likely a sale price. */
const RENT_TO_SALE_MAX = 0.05;

export function useAmountFormat(currencyOverride?: Currency, iso2Override?: string | null) {
    const market = useMarket();
    const currency = currencyOverride ?? market?.currency ?? null;
    const iso2 = iso2Override ?? market?.iso2 ?? null;
    return useMemo(() => {
        const resolved: Currency = currency ?? { code: "INR", symbol: "₹" };
        return { currency: resolved, format: amountFormatFor(resolved, iso2) };
    }, [currency, iso2]);
}

function resolve(
    text: string,
    currency: Currency,
    format: AmountFormat,
    min: number,
    max: number,
): { value: number | null; status: PriceInputStatus } {
    const parsed = parseAmount(text, currency, format, max);
    if (parsed.status !== "valid") return { value: null, status: parsed.status };
    if (parsed.value < min) return { value: null, status: "too-small" };
    return { value: parsed.value, status: "valid" };
}

type Note = { tone: "info" | "warn"; text: string };

function readBackNotes({
    value,
    kind,
    currency,
    reference,
    pairedAmount,
    perArea,
}: {
    value: number;
    kind: "sale" | "rent";
    currency: Currency;
    reference?: PriceReference;
    pairedAmount?: number | null;
    perArea?: PricePerArea | null;
}): Note[] {
    const notes: Note[] = [];

    if (reference && reference.amount > 0) {
        const listed = reference.amount;
        if (value === listed) {
            notes.push({ tone: "info", text: `Same as the ${reference.label}` });
        } else {
            const ratio = value / listed;
            if (ratio >= ZERO_SLIP_RATIO || ratio <= 1 / ZERO_SLIP_RATIO) {
                const times = ratio >= 1 ? `${Math.round(ratio)}×` : `1/${Math.round(1 / ratio)}`;
                notes.push({
                    tone: "warn",
                    text: `That is ${times} the ${reference.label}. Check the number of zeros.`,
                });
            } else {
                const diff = Math.abs(value - listed);
                const percent = Math.round((diff / listed) * 100);
                notes.push({
                    tone: "info",
                    text: `${formatPrice(diff, currency)} ${value < listed ? "below" : "above"} the ${reference.label}${percent > 0 ? ` (${percent}%)` : ""}`,
                });
            }
        }
    }

    if (pairedAmount && pairedAmount > 0) {
        if (kind === "rent" && value > pairedAmount * RENT_TO_SALE_MAX) {
            notes.push({
                tone: "warn",
                text: `This rent is ${Math.round((value / pairedAmount) * 100)}% of the sale price every month. Is this the sale price?`,
            });
        }
        if (kind === "sale" && value < pairedAmount * 12) {
            notes.push({
                tone: "warn",
                text: "This is less than one year of rent. Did you mean the monthly rent?",
            });
        }
    }

    if (perArea && perArea.size > 0) {
        const unitLabel = perArea.unit === "sqft" ? "sq ft" : "m²";
        notes.push({
            tone: "info",
            text: `≈ ${formatPrice(Math.round(value / perArea.size), currency)} per ${unitLabel}`,
        });
    }

    return notes;
}

/**
 * Smart money field. Understands shorthand ("29k", "21.5k", "1.5M",
 * "1M 200k", and "1.5L" / "1cr 20L" on Indian-numbering markets), the
 * market's own separators, pasted symbols and codes. Under the field it
 * shows only errors and smart-check notes (vs reference, slipped zero).
 *
 * The parent only ever receives a whole-unit integer or null.
 */
export function SmartPriceInput({
    id,
    value,
    onValueChange,
    kind = "sale",
    currency: currencyOverride,
    iso2,
    reference,
    pairedAmount,
    perArea,
    min = 1,
    max = MAX_AMOUNT,
    onRangeInput,
    placeholder,
    disabled,
    autoFocus,
    size = "md",
    errorText: externalError,
    helperText,
    onBlur,
    name,
    className,
    "aria-label": ariaLabel,
    "aria-describedby": describedBy,
}: SmartPriceInputProps) {
    const { currency, format } = useAmountFormat(currencyOverride, iso2);
    const fallbackId = useId();
    const inputId = id ?? fallbackId;
    const readBackId = `${inputId}-readback`;

    const [text, setText] = useState(() => formatAmountGrouped(value, format));
    const [status, setStatus] = useState<PriceInputStatus>(value == null ? "empty" : "valid");
    const [focused, setFocused] = useState(false);
    const [touched, setTouched] = useState(false);

    // A new value from the parent (reset, another control) replaces the text.
    const [lastValue, setLastValue] = useState(value);
    if (value !== lastValue) {
        setLastValue(value);
        const current = resolve(text, currency, format, min, max).value;
        if (value !== current) {
            setText(formatAmountGrouped(value, format));
            setStatus(value == null ? "empty" : "valid");
        }
    }

    function commit(nextText: string) {
        const range = onRangeInput ? splitAmountRange(nextText) : null;
        if (range && onRangeInput) {
            const low = resolve(range[0], currency, format, min, max);
            const high = resolve(range[1], currency, format, min, max);
            if (low.value != null && high.value != null) {
                setText(formatAmountGrouped(low.value, format));
                setStatus("valid");
                setLastValue(low.value);
                onRangeInput(low.value, high.value);
                return;
            }
        }
        const next = resolve(nextText, currency, format, min, max);
        setText(nextText);
        setStatus(next.status);
        setLastValue(next.value);
        onValueChange(next.value, next.status);
    }

    const isBroken = status === "invalid" || status === "too-large" || status === "too-small";
    const display = focused || isBroken ? text : formatAmountGrouped(value, format);

    const example = `2.5k ${format.decimal === "," ? "or 2.500" : "or 2,500"}`;
    let errorText: string | undefined = externalError || undefined;
    if (status === "too-large") {
        errorText = `Too large. The most you can enter is ${formatAmountWithSymbol(max, currency, format)}.`;
    } else if (status === "invalid" && (touched || !focused)) {
        errorText = `Can't read "${text.trim()}". Try ${example}.`;
    } else if (status === "too-small" && (touched || !focused)) {
        errorText =
            min <= 1
                ? "Enter an amount above zero."
                : `Must be at least ${formatAmountWithSymbol(min, currency, format)}.`;
    }

    const notes =
        value != null && status === "valid"
            ? readBackNotes({ value, kind, currency, reference, pairedAmount, perArea })
            : [];
    const Icon = currencyIcon(currency.code);

    return (
        <div className="flex flex-col gap-2">
            <Input
                id={inputId}
                name={name}
                className={className}
                // Text keyboard so phones can type the k / M / L / Cr shorthand.
                inputMode="text"
                enterKeyHint="done"
                autoComplete="off"
                spellCheck={false}
                size={size}
                value={display}
                placeholder={
                    placeholder ??
                    (format.numbering === "indian" ? "e.g. 25L or 1.2Cr" : "e.g. 250k or 1.2M")
                }
                startIcon={format.symbolPosition === "start" ? Icon : undefined}
                endIcon={format.symbolPosition === "end" ? Icon : undefined}
                errorText={errorText}
                helperText={errorText ? undefined : helperText}
                disabled={disabled}
                autoFocus={autoFocus}
                aria-label={ariaLabel}
                aria-describedby={cn(readBackId, describedBy) || undefined}
                onFocus={() => {
                    setFocused(true);
                    if (!isBroken) setText(formatAmountGrouped(value, format));
                }}
                onValueChange={commit}
                onBlur={() => {
                    setFocused(false);
                    setTouched(true);
                    onBlur?.();
                }}
            />

            <div id={readBackId} aria-live="polite" className="flex flex-col gap-0.5 empty:hidden">
                {value != null && status === "valid" ? (
                    <>
                        {/* "10k+20k": show what it adds up to while typing. On blur the
                            field itself switches to the total. */}
                        {focused && isAmountSum(text) ? (
                            <p className="body-sm tabular text-ink">
                                ={" "}
                                <span className="font-semibold">
                                    {formatAmountWithSymbol(value, currency, format)}
                                </span>
                            </p>
                        ) : null}
                        {notes.map((note) => (
                            <p
                                key={note.text}
                                className={cn(
                                    "body-xs flex items-start gap-1",
                                    note.tone === "warn"
                                        ? "font-medium text-ink"
                                        : "text-ink-muted",
                                )}
                            >
                                {note.tone === "warn" ? (
                                    <TriangleAlert
                                        aria-hidden
                                        className="mbs-0.5 shrink-0 block-3.5 inline-3.5"
                                    />
                                ) : null}
                                {note.text}
                            </p>
                        ))}
                    </>
                ) : null}
            </div>
        </div>
    );
}
