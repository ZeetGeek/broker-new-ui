"use client";

import { LayoutGrid, List } from "lucide-react";

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
    return (
        <div
            role="group"
            aria-label="Results layout"
            className={cn(
                `
                  inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-border-warm
                  bg-surface p-1 shadow-sm
                `,
                className,
            )}
        >
            {VIEW_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = view === option.value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-label={option.label}
                        aria-pressed={isActive}
                        onClick={() => onViewChange(option.value)}
                        className={cn(
                            `
                              flex size-7 items-center justify-center rounded-full border
                              transition-[background-color,border-color,color] duration-160
                            `,
                            isActive
                                ? "border-brand bg-brand-soft text-brand-text shadow-none hover:border-brand-text hover:bg-brand-soft/80"
                                : `
                                  border-transparent text-ink-muted
                                  hover:border-border-warm hover:bg-surface-muted/60 hover:text-ink
                                `,
                        )}
                    >
                        <Icon aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                    </button>
                );
            })}
        </div>
    );
}
