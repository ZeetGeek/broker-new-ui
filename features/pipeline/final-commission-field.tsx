"use client";

import { useId } from "react";

import { formatPrice } from "@/lib/format/price";
import type { FinalCommissionType } from "@/lib/validation/final-commission";

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
    value: string;
    amount: number | null;
    isRent: boolean;
    error: string | null;
    disabled: boolean;
    onTypeChange: (type: FinalCommissionType) => void;
    onValueChange: (value: string) => void;
}) {
    const id = useId();
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
            <Input
                id={id}
                inputMode={type === "percent" ? "decimal" : "numeric"}
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                placeholder={type === "percent" ? "e.g. 2" : "e.g. 25000"}
                errorText={error}
                helperText={
                    type === "percent"
                        ? `Percentage of the final ${isRent ? "monthly rent" : "sale price"}`
                        : "Total commission in rupees"
                }
            />
            {amount != null && !error ? (
                <p className="body-sm text-ink" aria-live="polite">
                    You get <span className="font-semibold">{formatPrice(amount)}</span>
                </p>
            ) : null}
        </fieldset>
    );
}
