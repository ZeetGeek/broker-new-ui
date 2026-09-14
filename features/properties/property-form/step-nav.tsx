"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Progress, ProgressLabel } from "@/components/ui/progress";

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
    const currentIndex = Math.max(
        0,
        steps.findIndex((item) => item.id === activeStep),
    );
    const progressPct = steps.length
        ? Math.round(((currentIndex + 1) / steps.length) * 100)
        : 0;

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
                    const originalIndex = FORM_STEPS.findIndex((item) => item.id === step.id);
                    const unlocked = originalIndex <= highestUnlocked;
                    const complete = completedSteps.has(step.id);

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
                                      flex items-center justify-start gap-3 px-3 text-start
                                      xl:inline-full xl:min-block-12
                                    `,
                                    active
                                        ? `
                                          bg-brand-soft text-brand-text
                                          hover:bg-brand-soft-hover hover:text-brand-text
                                        `
                                        : "text-ink-muted hover:bg-surface-muted hover:text-ink",
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
                                <span className="sr-only">
                                    {complete ? "Complete" : unlocked ? null : "Locked"}
                                </span>
                            </Button>
                        </li>
                    );
                })}
            </ol>
            <div
                className="
                  mbs-auto hidden shrink-0 flex-col gap-3 border-bs border-border-warm pbs-4
                  xl:flex
                "
            >
                <Progress
                    value={progressPct}
                    className="
                      flex-row flex-nowrap items-center gap-2
                      **:data-[slot=progress-indicator]:bg-brand
                      **:data-[slot=progress-track]:flex-1
                      **:data-[slot=progress-track]:bg-surface-muted
                      **:data-[slot=progress-track]:block-1.5
                    "
                >
                    <ProgressLabel className="body-xs tabular shrink-0 font-medium text-ink-subtle">
                        {currentIndex + 1} of {steps.length}
                    </ProgressLabel>
                </Progress>
                <p className="body-xs flex flex-wrap items-center gap-1.5 text-ink-subtle">
                    Press
                    <KbdGroup className="gap-1">
                        <Kbd className="px-1.5 text-[10px] min-inline-4">1</Kbd>
                        <span aria-hidden>+</span>
                        <Kbd className="px-1.5 text-[10px] min-inline-4">2</Kbd>
                    </KbdGroup>
                    to navigate
                </p>
            </div>
        </nav>
    );
}
