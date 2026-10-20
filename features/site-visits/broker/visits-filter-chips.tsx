"use client";

import { X } from "@/components/shared/icons";

import type { SlotDateRange } from "@/features/site-visits/broker/open-slots/slot-filters";

export type VisitsFilterChip = {
    key: string;
    label: string;
    clear: () => void;
};

export function visitsRangeChipLabel(range: SlotDateRange, customFrom = "", customTo = ""): string {
    if (range === "custom") {
        return `${customFrom || "Start"} to ${customTo || "End"}`;
    }
    if (range === "month") return "Next month";
    if (range === "week") return "Next week";
    return range[0].toUpperCase() + range.slice(1);
}

export function VisitsFilterChips({
    chips,
    onClearAll,
}: {
    chips: VisitsFilterChip[];
    onClearAll: () => void;
}) {
    if (chips.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    type="button"
                    onClick={chip.clear}
                    className="
                      body-xs flex items-center gap-1 rounded-md border border-brand/15
                      bg-brand-soft px-2.5 font-semibold text-brand-text block-control-md
                      hover:bg-brand-soft-hover
                    "
                >
                    {chip.label}
                    <X aria-hidden className="block-3 inline-3" />
                </button>
            ))}
            <button
                type="button"
                onClick={onClearAll}
                className="
                  body-xs px-2 font-semibold text-brand-text block-control-md
                  hover:underline
                "
            >
                Clear all
            </button>
        </div>
    );
}
