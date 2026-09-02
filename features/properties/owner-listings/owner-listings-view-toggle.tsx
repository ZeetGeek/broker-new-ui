"use client";

import type { ReactNode } from "react";

import { LayoutGrid, List } from "lucide-react";

import { cn } from "@/lib/utils";

import type { OwnerListingsView } from "@/features/properties/owner-listings/use-owner-listings-view";

export type OwnerListingsViewToggleProps = {
    view: OwnerListingsView;
    onViewChange: (view: OwnerListingsView) => void;
};

function ViewToggleButton({
    label,
    isActive,
    onClick,
    children,
}: {
    label: string;
    isActive: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={isActive}
            onClick={onClick}
            className={cn(
                `
                  flex items-center justify-center px-2.5 py-1.5 text-ink-muted transition-colors
                  duration-160
                `,
                isActive ? "bg-surface-muted text-ink" : "hover:text-ink",
            )}
        >
            {children}
        </button>
    );
}

export function OwnerListingsViewToggle({ view, onViewChange }: OwnerListingsViewToggleProps) {
    return (
        <div
            role="group"
            aria-label="Results layout"
            className="
              flex shrink-0 items-center overflow-hidden rounded-full border border-border-warm
              bg-surface
            "
        >
            <ViewToggleButton
                label="Grid view"
                isActive={view === "grid"}
                onClick={() => onViewChange("grid")}
            >
                <LayoutGrid aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
            </ViewToggleButton>
            <ViewToggleButton
                label="List view"
                isActive={view === "list"}
                onClick={() => onViewChange("list")}
            >
                <List aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
            </ViewToggleButton>
        </div>
    );
}
