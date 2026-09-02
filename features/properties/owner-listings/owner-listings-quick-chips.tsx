"use client";

import type { ReactNode } from "react";

import { SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import type { OwnerListingsFilters } from "@/features/properties/owner-listings/types";

type QuickChipKey = "yourAreas" | "newToday" | "slotsOpen" | "commissionSet" | "readyToMove";

const QUICK_CHIPS: { key: QuickChipKey; label: string; mobileLabel?: string }[] = [
    { key: "yourAreas", label: "Your areas" },
    { key: "newToday", label: "New today" },
    { key: "slotsOpen", label: "Slots open", mobileLabel: "Slots" },
    { key: "commissionSet", label: "Commission set" },
    { key: "readyToMove", label: "Ready to move" },
];

export type OwnerListingsQuickChipsProps = {
    filters: OwnerListingsFilters;
    sheetFilterCount: number;
    onToggleQuickChip: (key: QuickChipKey) => void;
    onOpenFilters: () => void;
};

function QuickChip({
    label,
    isActive,
    onClick,
}: {
    label: ReactNode;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <Button
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn(
                "shrink-0 rounded-full",
                isActive
                    ? "border-brand-ink bg-brand-ink text-surface hover:bg-brand-ink/90"
                    : "border-border-warm bg-surface text-ink-muted hover:text-ink",
            )}
            onClick={onClick}
            aria-pressed={isActive}
        >
            {label}
        </Button>
    );
}

export function OwnerListingsQuickChips({
    filters,
    sheetFilterCount,
    onToggleQuickChip,
    onOpenFilters,
}: OwnerListingsQuickChipsProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="
              flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none]
              [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            ">
                {QUICK_CHIPS.map((chip) => (
                    <QuickChip
                        key={chip.key}
                        label={
                            <>
                                <span className="md:hidden">{chip.mobileLabel ?? chip.label}</span>
                                <span className="hidden md:inline">{chip.label}</span>
                            </>
                        }
                        isActive={filters[chip.key]}
                        onClick={() => onToggleQuickChip(chip.key)}
                    />
                ))}
            </div>

            <div className="h-8 w-px shrink-0 bg-border-warm" aria-hidden />

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="
                  shrink-0 rounded-full border-border-warm bg-surface text-ink-muted
                  hover:text-ink
                "
                onClick={onOpenFilters}
            >
                <SlidersHorizontal aria-hidden className="block-4 inline-4 md:me-1.5" strokeWidth={1.75} />
                <span className="hidden md:inline">
                    Filters{sheetFilterCount > 0 ? ` ${sheetFilterCount}` : ""}
                </span>
                {sheetFilterCount > 0 ? (
                    <span className="body-xs ms-1 inline-flex min-inline-5 items-center justify-center rounded-full bg-brand-ink px-1.5 font-semibold text-surface md:hidden">
                        {sheetFilterCount}
                    </span>
                ) : null}
            </Button>
        </div>
    );
}
