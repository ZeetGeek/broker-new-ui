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

import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
    OWNER_LISTINGS_BAND_MENU_WIDTH_CLASS,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import { OwnerListingsBandMenuHeader } from "@/features/properties/owner-listings/owner-listings-band-menu-header";
import { OwnerListingsBandSegment } from "@/features/properties/owner-listings/owner-listings-band-segment";
import { BudgetRotaryKnob } from "@/features/properties/owner-listings/owner-listings-budget-knob";
import {
    findBudgetStepIndex,
    getBudgetSteps,
    isBudgetInSteps,
} from "@/features/properties/owner-listings/owner-listings-budget-presets";
import type { OwnerListingTransactionType } from "@/features/properties/owner-listings/types";

export type OwnerListingsBudgetMenuProps = {
    min: string;
    max: string;
    /** Looking-for mode — drives sale vs rent preset scales. */
    lookingFor: OwnerListingTransactionType | "";
    onBudgetChange: (next: { min: string; max: string }) => void;
    onOpenChange?: (open: boolean) => void;
    className?: string;
};

export function OwnerListingsBudgetMenu({
    min,
    max,
    lookingFor,
    onBudgetChange,
    onOpenChange,
    className,
}: OwnerListingsBudgetMenuProps) {
    const [open, setOpen] = useState(false);
    const steps = useMemo(() => getBudgetSteps(lookingFor), [lookingFor]);
    const syncedIndex = findBudgetStepIndex(min, max, steps);
    const [stepIndex, setStepIndex] = useState(syncedIndex);
    const [prevSyncedIndex, setPrevSyncedIndex] = useState(syncedIndex);

    if (syncedIndex !== prevSyncedIndex) {
        setPrevSyncedIndex(syncedIndex);
        setStepIndex(syncedIndex);
    }

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

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        onOpenChange?.(nextOpen);
    };

    return (
        <div className={cn("inline-full min-inline-0", className)}>
            <DropdownMenu open={open} onOpenChange={handleOpenChange}>
                <DropdownMenuTrigger
                    className="flex inline-full min-inline-0"
                    render={
                        <OwnerListingsBandSegment
                            label="Budget"
                            icon={IndianRupee}
                            value={formatBudgetLabel(min, max, lookingFor)}
                            className="inline-full"
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
                    <div className="flex flex-col gap-3 p-5">
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
                                              transition-colors duration-160 outline-none
                                              focus-visible:ring-2 focus-visible:ring-brand
                                            `,
                                            active
                                                ? "border-brand bg-brand-soft text-ink"
                                                : `
                                                  border-border-warm bg-surface text-ink-muted
                                                  hover:bg-surface-muted
                                                `,
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
