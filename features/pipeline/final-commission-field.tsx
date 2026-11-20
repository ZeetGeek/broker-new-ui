"use client";

import { useId } from "react";

import { formatPrice } from "@/lib/format/price";
import {
    type FinalCommissionType,
    resolveFinalCommission,
} from "@/lib/validation/final-commission";

import { SmartPriceInput } from "@/components/shared/smart-price-input";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function FinalCommissionField({
    type,
    value,
    amount,
    isRent,
    error,
    disabled,
    onTypeChange,
    onValueChange,
}: {
    type: FinalCommissionType;
    value: string | null;
    amount: number | null;
    isRent: boolean;
    error: string | null;
    disabled: boolean;
    onTypeChange: (type: FinalCommissionType) => void;
    onValueChange: (value: string | null) => void;
}) {
    const id = useId();
    const fieldError =
        error ?? (type === "percent" ? resolveFinalCommission(type, value, 0).error : null);
    return (
        <fieldset disabled={disabled} className="flex flex-col gap-3">
            <legend className="body-sm mbe-3 font-semibold text-ink">
                Final commission <span className="font-normal text-ink-muted">(optional)</span>
            </legend>
            <RadioGroup
                value={type}
                onValueChange={(next) => onTypeChange(next as FinalCommissionType)}
                aria-label="Commission type"
                className="flex flex-wrap gap-x-5 gap-y-1"
            >
                <label className="body-sm flex cursor-pointer items-center gap-2 min-block-11">
                    <RadioGroupItem value="percent" disabled={disabled} /> Percentage
                </label>
                <label className="body-sm flex cursor-pointer items-center gap-2 min-block-11">
                    <RadioGroupItem value="amount" disabled={disabled} /> Fixed amount
                </label>
            </RadioGroup>
            <label htmlFor={id} className="sr-only">
                {type === "percent" ? "Final commission percentage" : "Final commission in rupees"}
            </label>
            {type === "amount" ? (
                <SmartPriceInput
                    id={id}
                    size="default"
                    value={value != null && value !== "" ? Number(value) : null}
                    onValueChange={(next, status) =>
                        onValueChange(next != null ? String(next) : status === "empty" ? "" : null)
                    }
                    min={0}
                    max={99_999_999_999}
                    disabled={disabled}
                    placeholder="e.g. 25k or 1 lakh"
                    errorText={error ?? undefined}
                    helperText="Total commission in rupees"
                />
            ) : (
                <Input
                    id={id}
                    inputMode="decimal"
                    value={value ?? ""}
                    onValueChange={onValueChange}
                    disabled={disabled}
                    placeholder="e.g. 2"
                    errorText={fieldError}
                    helperText={`Percentage of the final ${isRent ? "monthly rent" : "sale price"}`}
                />
            )}
            {amount != null && !fieldError ? (
                <p className="body-sm text-ink" aria-live="polite">
                    You get <span className="font-semibold">{formatPrice(amount)}</span>
                </p>
            ) : null}
        </fieldset>
    );
}
