"use client";

import type { LucideIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

import { AnimatedBackground } from "@/components/motion-primitives/animated-background";

export type IconSegmentedOption<T extends string = string> = {
    value: T;
    label: string;
    icon: LucideIcon;
};

export type IconSegmentedToggleProps<T extends string> = {
    value: T;
    onValueChange: (value: T) => void;
    options: readonly IconSegmentedOption<T>[];
    ariaLabel: string;
    className?: string;
};

export function IconSegmentedToggle<T extends string>({
    value,
    onValueChange,
    options,
    ariaLabel,
    className,
}: IconSegmentedToggleProps<T>) {
    const reduceMotion = useReducedMotion();

    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className={cn(
                `
                  inline-flex shrink-0 items-center gap-1 rounded-control border border-border-warm
                  bg-surface p-1 shadow-sm block-[38px]
                `,
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
                className="rounded-md border border-brand bg-brand-soft shadow-none"
                transition={reduceMotion ? { duration: 0 } : spring.snappy}
            >
                {options.map((option) => {
                    const Icon = option.icon;
                    const isActive = value === option.value;

                    return (
                        <button
                            key={option.value}
                            data-id={option.value}
                            type="button"
                            aria-label={option.label}
                            aria-pressed={isActive}
                            className={cn(
                                `
                                  flex items-center justify-center rounded-md border
                                  border-transparent transition-[color] duration-160 block-7
                                  inline-7
                                `,
                                isActive ? "text-brand-text" : "text-ink-muted hover:text-ink",
                            )}
                        >
                            <Icon aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                        </button>
                    );
                })}
            </AnimatedBackground>
        </div>
    );
}
