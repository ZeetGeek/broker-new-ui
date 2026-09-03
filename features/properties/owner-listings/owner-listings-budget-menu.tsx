"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { IndianRupee } from "lucide-react";

import { formatBudgetLabel } from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { BudgetRotaryKnob } from "@/features/properties/owner-listings/owner-listings-budget-knob";
import {
    findBudgetStepIndex,
    getBudgetSteps,
    isBudgetInSteps,
} from "@/features/properties/owner-listings/owner-listings-budget-presets";
import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
    OWNER_LISTINGS_BAND_MENU_WIDTH_CLASS,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import { OwnerListingsBandMenuHeader } from "@/features/properties/owner-listings/owner-listings-band-menu-header";
import { OwnerListingsBandSegment } from "@/features/properties/owner-listings/owner-listings-band-segment";
import type { OwnerListingTransactionType } from "@/features/properties/owner-listings/types";

export type OwnerListingsBudgetMenuProps = {
    min: string;
    max: string;
    /** Looking-for mode — drives sale vs rent preset scales. */
    lookingFor: OwnerListingTransactionType | "";
    onBudgetChange: (next: { min: string; max: string }) => void;
    className?: string;
};

export function OwnerListingsBudgetMenu({
    min,
    max,
    lookingFor,
    onBudgetChange,
    className,
}: OwnerListingsBudgetMenuProps) {
    const [open, setOpen] = useState(false);
    const steps = useMemo(() => getBudgetSteps(lookingFor), [lookingFor]);
    const [stepIndex, setStepIndex] = useState(() => findBudgetStepIndex(min, max, steps));

    useEffect(() => {
        setStepIndex(findBudgetStepIndex(min, max, steps));
    }, [min, max, steps]);

    // Sale ↔ rent scales do not share INR ranges — clear an orphaned budget.
    useEffect(() => {
        if (!min && !max) return;
        if (isBudgetInSteps(min, max, steps)) return;
        onBudgetChange({ min: "", max: "" });
    }, [lookingFor, min, max, steps, onBudgetChange]);

    const step = steps[stepIndex] ?? steps[0];
    const maxStep = steps.length - 1;
    const hint =
        lookingFor === "rent"
            ? "Turn the dial to set monthly rent"
            : lookingFor === "sale"
              ? "Turn the dial to set purchase budget"
              : "Turn the dial to set your range";

    const handleStepChange = useCallback(
        (nextIndex: number) => {
            const clamped = Math.min(maxStep, Math.max(0, nextIndex));
            setStepIndex(clamped);
            const next = steps[clamped];
            if (!next) return;
            onBudgetChange({ min: next.min, max: next.max });
        },
        [maxStep, onBudgetChange, steps],
    );

    return (
        <div className={cn("min-w-0 w-full", className)}>
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                className="flex min-w-0 w-full"
                render={
                    <OwnerListingsBandSegment
                        label="Budget"
                        icon={IndianRupee}
                        value={formatBudgetLabel(min, max, lookingFor)}
                        className="w-full"
                        isOpen={open}
                    />
                }
            />
            <DropdownMenuContent
                align="center"
                sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                className={cn(
                    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
                    OWNER_LISTINGS_BAND_MENU_WIDTH_CLASS,
                    "overflow-hidden p-0",
                )}
            >
                <div className="flex flex-col gap-3 px-5 py-5">
                    <OwnerListingsBandMenuHeader
                        description={hint}
                        onClear={() => {
                            setStepIndex(0);
                            onBudgetChange({ min: "", max: "" });
                        }}
                    />

                    <BudgetRotaryKnob
                        stepCount={maxStep}
                        value={stepIndex}
                        onValueChange={handleStepChange}
                        displayValue={step.shortLabel}
                        displayHint={step.label}
                    />

                    <div className="flex flex-wrap justify-center gap-1.5">
                        {steps.map((option, index) => {
                            const active = index === stepIndex;
                            return (
                                <button
                                    key={`${lookingFor}-${option.label}`}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => handleStepChange(index)}
                                    className={cn(
                                        `
                                          body-xs rounded-full border px-2.5 py-1 font-medium
                                          outline-none transition-colors duration-160
                                          focus-visible:ring-2 focus-visible:ring-brand
                                        `,
                                        active
                                            ? "border-brand bg-brand-soft text-ink"
                                            : "border-border-warm bg-surface text-ink-muted hover:bg-surface-muted",
                                    )}
                                >
                                    {option.shortLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
        </div>
    );
}
