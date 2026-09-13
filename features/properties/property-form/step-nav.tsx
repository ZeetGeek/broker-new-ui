"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { Button } from "@/components/ui/button";

import { FORM_STEPS, type PropertyFormStep } from "@/constants/property";

export function StepNav({
    steps,
    activeStep,
    highestUnlocked,
    completedSteps,
    onStepChange,
}: {
    steps: readonly (typeof FORM_STEPS)[number][];
    activeStep: PropertyFormStep;
    highestUnlocked: number;
    completedSteps: Set<PropertyFormStep>;
    onStepChange: (step: PropertyFormStep) => void;
}) {
    const { requiredLeftInStep } = useFieldRules();
    return (
        <nav aria-label="Property form steps" className="xl:block-full">
            <ol
                className="
                  flex gap-2 overflow-x-auto px-4 py-3
                  xl:block xl:space-y-1 xl:overflow-visible xl:p-0
                "
            >
                {steps.map((step, index) => {
                    const active = step.id === activeStep;
                    const originalIndex = FORM_STEPS.findIndex((item) => item.id === step.id);
                    const unlocked = originalIndex <= highestUnlocked;
                    const requiredLeft = requiredLeftInStep(step.id).length;
                    const complete = completedSteps.has(step.id) || requiredLeft === 0;
                    return (
                        <li key={step.id} className="shrink-0 xl:inline-full">
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={!unlocked}
                                aria-current={active ? "step" : undefined}
                                onClick={() => onStepChange(step.id)}
                                className={cn(
                                    `
                                      group flex items-center gap-3 rounded-control px-3 text-start
                                      transition-[background-color,color] duration-160 min-block-12
                                      focus-visible:ring-3 focus-visible:ring-ring/30
                                      xl:inline-full
                                    `,
                                    active
                                        ? "bg-brand-ink text-surface"
                                        : `text-ink-muted hover:bg-surface-muted hover:text-ink`,
                                    !unlocked && "cursor-not-allowed opacity-40",
                                )}
                            >
                                <span
                                    className={cn(
                                        `
                                          tabular flex shrink-0 items-center justify-center
                                          rounded-full border text-xs font-bold block-7 inline-7
                                        `,
                                        active
                                            ? "border-brand bg-highlight text-highlight-ink"
                                            : complete
                                              ? `border-brand bg-brand-soft text-brand-text`
                                              : `border-border-warm bg-surface text-ink-muted`,
                                    )}
                                >
                                    {complete ? (
                                        <Check
                                            className="block-3.5 inline-3.5"
                                            strokeWidth={3}
                                            aria-hidden
                                        />
                                    ) : (
                                        index + 1
                                    )}
                                </span>
                                <span className="hidden min-inline-0 xl:block">
                                    <span className="block text-sm/5 font-semibold whitespace-normal">
                                        {step.label}
                                    </span>
                                    <span
                                        className={cn(
                                            "mbs-0.5 block text-xs",
                                            active ? `text-surface/60` : `text-ink-subtle`,
                                        )}
                                    >
                                        {complete
                                            ? "Complete"
                                            : active
                                              ? `${requiredLeft} required left`
                                              : unlocked
                                                ? `${requiredLeft} required left`
                                                : "Locked"}
                                    </span>
                                </span>
                                <span className="text-sm font-semibold whitespace-nowrap xl:hidden">
                                    {step.shortLabel}
                                </span>
                            </Button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
