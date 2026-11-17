"use client";

import { useState } from "react";

import { formatMoneyInput, parseMoney } from "@/lib/format/money";
import { useMarketCurrency } from "@/hooks/use-market";

import { currencyIcon } from "@/components/shared/icons";
import { Input } from "@/components/ui/input";

/**
 * Money input: currency icon in front, grouped digits at rest, and the raw
 * text while focused so the caret never jumps. Accepts shorthand a broker
 * would type ("20L", "1.2 cr", "45k") when the keyboard allows letters; the parent only ever sees whole-rupee
 * digits, or "" when the text is not a number yet.
 *
 * Same behaviour as the Add property price field and the contact budget
 * field, which can move onto this when next touched.
 */
export function CurrencyInput({
    id,
    valueDigits,
    onChangeDigits,
    errorText,
    placeholder,
    disabled,
    autoFocus,
    maxDigits = 11,
    "aria-describedby": describedBy,
}: {
    id: string;
    /** Whole rupees as a digit string, "" when empty. */
    valueDigits: string;
    onChangeDigits: (digits: string) => void;
    errorText?: string;
    placeholder?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    /** ₹9,999 crore by default. Past 2^53 a Number silently loses digits. */
    maxDigits?: number;
    "aria-describedby"?: string;
}) {
    const CurrencyIcon = currencyIcon(useMarketCurrency().code);
    const numericValue =
        valueDigits && Number.isFinite(Number(valueDigits)) && Number(valueDigits) > 0
            ? Number(valueDigits)
            : null;
    const [display, setDisplay] = useState(() => formatMoneyInput(numericValue));
    const [focused, setFocused] = useState(false);

    return (
        <Input
            id={id}
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            value={focused ? display : formatMoneyInput(numericValue)}
            placeholder={placeholder}
            startIcon={CurrencyIcon}
            errorText={errorText}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-describedby={describedBy}
            onFocus={() => {
                setDisplay(formatMoneyInput(numericValue));
                setFocused(true);
            }}
            onValueChange={(next) => {
                setDisplay(next);
                const parsed = parseMoney(next);
                const digits = parsed != null && parsed > 0 ? String(parsed) : "";
                onChangeDigits(digits.length > maxDigits ? digits.slice(0, maxDigits) : digits);
            }}
            onBlur={() => {
                setFocused(false);
                setDisplay(formatMoneyInput(numericValue));
            }}
        />
    );
}
