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
                "inline-flex shrink-0 items-center gap-1 rounded-full border border-border-warm bg-surface p-1 shadow-sm",
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
                              flex items-center justify-center rounded-full p-2 transition-[background-color,color,box-shadow]
                              duration-160
                            `,
                            isActive
                                ? "border border-brand bg-brand-soft text-brand-text shadow-none"
                                : "border border-transparent text-ink-muted hover:border-border-warm hover:text-ink",
                        )}
                    >
                        <Icon aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    </button>
                );
            })}
        </div>
    );
}
