"use client";

import { cn } from "@/lib/utils";

import { Check } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { FORM_STEPS, type PropertyFormStep } from "@/constants/property";

export function StepNav({
    steps,
    activeStep,
    completedSteps,
    onStepChange,
}: {
    steps: readonly (typeof FORM_STEPS)[number][];
    activeStep: PropertyFormStep;
    completedSteps: Set<PropertyFormStep>;
    onStepChange: (step: PropertyFormStep) => void;
}) {
    return (
        <nav
            aria-label="Property form steps"
            className="flex flex-1 flex-col min-block-0 xl:block-full"
        >
            <ol
                className="
                  flex gap-1 overflow-x-auto px-4 py-2
                  xl:flex-1 xl:flex-col xl:gap-3 xl:overflow-y-auto xl:p-0 xl:min-block-0
                "
            >
                {steps.map((step, index) => {
                    const active = step.id === activeStep;
                    const complete = completedSteps.has(step.id);

                    return (
                        <li key={step.id} className="shrink-0 xl:inline-full">
                            <Button
                                type="button"
                                variant="ghost"
                                aria-current={active ? "step" : undefined}
                                onClick={() => onStepChange(step.id)}
                                className={cn(
                                    `
                                      flex items-center justify-start gap-3 px-3 text-start
                                      transition-[background-color,color,box-shadow] duration-160
                                      xl:inline-full xl:min-block-12
                                    `,
                                    active
                                        ? `
                                          bg-brand-soft text-brand-text
                                          hover:bg-brand-soft-hover hover:text-brand-text
                                        `
                                        : `text-ink-muted hover:bg-surface-muted hover:text-ink`,
                                )}
                            >
                                <span
                                    className={cn(
                                        `
                                          tabular flex shrink-0 items-center justify-center
                                          rounded-full text-xs font-semibold block-7 inline-7
                                        `,
                                        active
                                            ? "bg-brand text-surface"
                                            : complete
                                              ? "bg-brand-soft text-brand-text"
                                              : "bg-surface-muted text-ink-subtle",
                                    )}
                                >
                                    {complete && !active ? (
                                        <Check
                                            className="block-3.5 inline-3.5"
                                            strokeWidth={2.5}
                                            aria-hidden
                                        />
                                    ) : (
                                        index + 1
                                    )}
                                </span>
                                <span className="hidden text-sm font-semibold min-inline-0 xl:block">
                                    {step.label}
                                </span>
                                <span className="text-sm font-semibold whitespace-nowrap xl:hidden">
                                    {step.shortLabel}
                                </span>
                                <span className="sr-only">{complete ? "Complete" : null}</span>
                            </Button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
