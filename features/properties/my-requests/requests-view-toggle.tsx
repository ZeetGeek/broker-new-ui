"use client";

import { LayoutGrid, List } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

import { AnimatedBackground } from "@/components/motion-primitives/animated-background";

import type { RequestsView } from "@/features/properties/my-requests/use-requests-view";

export type RequestsViewToggleProps = {
    view: RequestsView;
    onViewChange: (view: RequestsView) => void;
    className?: string;
};

const VIEW_OPTIONS: { value: RequestsView; label: string; icon: typeof LayoutGrid }[] = [
    { value: "grid", label: "Grid view", icon: LayoutGrid },
    { value: "list", label: "List view", icon: List },
];

export function RequestsViewToggle({ view, onViewChange, className }: RequestsViewToggleProps) {
    const reduceMotion = useReducedMotion();

    return (
        <div
            role="group"
            aria-label="Results layout"
            className={cn(
                `
                  inline-flex shrink-0 items-center gap-1 rounded-full border border-border-warm
                  bg-surface p-1 shadow-sm block-[38px]
                `,
                className,
            )}
        >
            <AnimatedBackground
                defaultValue={view}
                onValueChange={(id) => {
                    if (id) {
                        onViewChange(id as RequestsView);
                    }
                }}
                className="rounded-full border border-brand bg-brand-soft shadow-none"
                transition={reduceMotion ? { duration: 0 } : spring.snappy}
            >
                {VIEW_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = view === option.value;

                    return (
                        <button
                            key={option.value}
                            data-id={option.value}
                            type="button"
                            aria-label={option.label}
                            aria-pressed={isActive}
                            className={cn(
                                `
                                  flex items-center justify-center rounded-full border
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
