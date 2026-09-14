"use client";

import { useReducedMotion } from "motion/react";

import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

import { AnimatedBackground } from "@/components/motion-primitives/animated-background";

export type TextSegmentedOption<T extends string = string> = {
    value: T;
    label: string;
};

export type TextSegmentedToggleProps<T extends string> = {
    value: T;
    onValueChange: (value: T) => void;
    options: readonly TextSegmentedOption<T>[];
    ariaLabel: string;
    className?: string;
    size?: "sm" | "default";
};

export function TextSegmentedToggle<T extends string>({
    value,
    onValueChange,
    options,
    ariaLabel,
    className,
    size = "default",
}: TextSegmentedToggleProps<T>) {
    const reduceMotion = useReducedMotion();
    const isCompact = size === "sm";

    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className={cn(
                `
                  inline-flex shrink-0 items-center border border-border-warm bg-surface
                  shadow-sm
                `,
                isCompact
                    ? "gap-0.5 rounded-control p-0.5"
                    : "gap-1 rounded-full p-1 min-inline-[10.5rem]",
                className,
            )}
        >
            <AnimatedBackground
                defaultValue={value}
                onValueChange={(id) => {
                    if (id) {
                        onValueChange(id as T);
                    }
                }}
                className={cn(
                    "border border-brand bg-brand-soft shadow-none",
                    isCompact ? "rounded-md" : "rounded-full",
                )}
                transition={reduceMotion ? { duration: 0 } : spring.snappy}
            >
                {options.map((option) => {
                    const isActive = value === option.value;

                    return (
                        <button
                            key={option.value}
                            data-id={option.value}
                            type="button"
                            aria-pressed={isActive}
                            className={cn(
                                `
                                  relative z-10 font-semibold transition-[color] duration-160
                                `,
                                isCompact
                                    ? "body-xs rounded-md px-2.5 py-0.5"
                                    : `
                                      body-sm inline-flex min-inline-[5rem] flex-1
                                      items-center justify-center rounded-full px-4 py-1.5
                                      min-block-9
                                    `,
                                isActive ? "text-brand-text" : "text-ink-muted hover:text-ink",
                            )}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </AnimatedBackground>
        </div>
    );
}
