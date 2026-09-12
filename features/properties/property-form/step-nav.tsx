"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { FORM_STEPS, type PropertyFormStep } from "@/constants/property";

export function StepNav({
    activeStep,
    highestUnlocked,
    completedSteps,
    onStepChange,
}: {
    activeStep: PropertyFormStep;
    highestUnlocked: number;
    completedSteps: Set<PropertyFormStep>;
    onStepChange: (step: PropertyFormStep) => void;
}) {
    return (
        <nav aria-label="Property form steps" className="xl:block-full">
            <ol
                className="
                  flex gap-2 overflow-x-auto px-4 py-3
                  xl:block xl:space-y-1 xl:overflow-visible xl:p-0
                "
            >
                {FORM_STEPS.map((step, index) => {
                    const active = step.id === activeStep;
                    const unlocked = index <= highestUnlocked;
                    const complete = completedSteps.has(step.id);
                    return (
                        <li key={step.id} className="shrink-0 xl:inline-full">
                            <button
                                type="button"
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
                                    <span className="
                                      block text-sm/5 font-semibold whitespace-normal
                                    ">
                                        {step.label}
                                    </span>
                                    <span
                                        className={cn(
                                            "mbs-0.5 block text-xs",
                                            active
                                                ? `text-surface/60`
                                                : `text-ink-subtle`,
                                        )}
                                    >
                                        {complete
                                            ? "Complete"
                                            : active
                                              ? "In progress"
                                              : unlocked
                                                ? "Ready"
                                                : "Locked"}
                                    </span>
                                </span>
                                <span className="text-sm font-semibold whitespace-nowrap xl:hidden">
                                    {step.shortLabel}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
