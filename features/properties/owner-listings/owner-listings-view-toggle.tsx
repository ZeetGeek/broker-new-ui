"use client";

import { LayoutGrid, List } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { AnimatedBackground } from "@/components/motion-primitives/animated-background";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

import type { OwnerListingsView } from "@/features/properties/owner-listings/use-owner-listings-view";

export type OwnerListingsViewToggleProps = {
    view: OwnerListingsView;
    onViewChange: (view: OwnerListingsView) => void;
    className?: string;
};

const VIEW_OPTIONS: { value: OwnerListingsView; label: string; icon: typeof LayoutGrid }[] = [
    { value: "grid", label: "Grid view", icon: LayoutGrid },
    { value: "list", label: "List view", icon: List },
];

export function OwnerListingsViewToggle({
    view,
    onViewChange,
    className,
}: OwnerListingsViewToggleProps) {
    const reduceMotion = useReducedMotion();

    return (
        <div
            role="group"
            aria-label="Results layout"
            className={cn(
                `
                  inline-flex h-[38px] shrink-0 items-center gap-1 rounded-full border
                  border-border-warm bg-surface p-1 shadow-sm
                `,
                className,
            )}
        >
            <AnimatedBackground
                defaultValue={view}
                onValueChange={(id) => {
                    if (id) {
                        onViewChange(id as OwnerListingsView);
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
                                  flex size-7 items-center justify-center rounded-full border
                                  border-transparent transition-[color] duration-160
                                `,
                                isActive
                                    ? "text-brand-text"
                                    : "text-ink-muted hover:text-ink",
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
