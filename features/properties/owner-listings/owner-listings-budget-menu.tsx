"use client";

import { useCallback, useEffect, useState } from "react";

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
    OWNER_LISTINGS_BUDGET_STEPS,
} from "@/features/properties/owner-listings/owner-listings-budget-presets";
import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import { OwnerListingsBandSegment } from "@/features/properties/owner-listings/owner-listings-band-segment";

export type OwnerListingsBudgetMenuProps = {
    min: string;
    max: string;
    onBudgetChange: (next: { min: string; max: string }) => void;
    className?: string;
};

export function OwnerListingsBudgetMenu({
    min,
    max,
    onBudgetChange,
    className,
}: OwnerListingsBudgetMenuProps) {
    const [open, setOpen] = useState(false);
    const [stepIndex, setStepIndex] = useState(() => findBudgetStepIndex(min, max));

    useEffect(() => {
        setStepIndex(findBudgetStepIndex(min, max));
    }, [min, max]);

    const step = OWNER_LISTINGS_BUDGET_STEPS[stepIndex] ?? OWNER_LISTINGS_BUDGET_STEPS[0];
    const maxStep = OWNER_LISTINGS_BUDGET_STEPS.length - 1;

    const handleStepChange = useCallback(
        (nextIndex: number) => {
            const clamped = Math.min(maxStep, Math.max(0, nextIndex));
            setStepIndex(clamped);
            const next = OWNER_LISTINGS_BUDGET_STEPS[clamped];
            if (!next) return;
            onBudgetChange({ min: next.min, max: next.max });
        },
        [maxStep, onBudgetChange],
    );

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                render={
                    <OwnerListingsBandSegment
                        label="Budget"
                        icon={IndianRupee}
                        value={formatBudgetLabel(min, max)}
                        className={className}
                        isOpen={open}
                    />
                }
            />
            <DropdownMenuContent
                align="start"
                sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                className={cn(
                    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
                    "min-inline-0 inline-(--anchor-width) max-inline-(--anchor-width) overflow-hidden p-0",
                )}
            >
                <div className="flex flex-col gap-3 px-5 py-5">
                    <div className="flex flex-col gap-0.5">
                        <p className="body-xs font-semibold tracking-[0.08em] text-ink-muted uppercase">
                            Budget
                        </p>
                        <p className="body-sm text-ink-muted">Turn the dial to set your range</p>
                    </div>

                    <BudgetRotaryKnob
                        stepCount={maxStep}
                        value={stepIndex}
                        onValueChange={handleStepChange}
                        displayValue={step.shortLabel}
                        displayHint={step.label}
                    />

                    <div className="flex flex-wrap justify-center gap-1.5">
                        {OWNER_LISTINGS_BUDGET_STEPS.map((option, index) => {
                            const active = index === stepIndex;
                            return (
                                <button
                                    key={option.label}
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
    );
}
