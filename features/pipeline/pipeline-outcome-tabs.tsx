"use client";

import { FilterChip } from "@/components/shared/filter-chip";

import type { DealsView } from "@/features/pipeline/types";

export type OutcomeView = Exclude<DealsView, "board">;

const OUTCOME_TABS: { view: OutcomeView; label: string; description: string }[] = [
    { view: "sold", label: "Sold", description: "Deals you marked as sold" },
    { view: "lost", label: "Lost", description: "Deals you marked as lost" },
];

/** Sold and Lost tabs beside Filters. Tapping the active tab returns to the board. */
export function PipelineOutcomeTabs({
    counts,
    view,
    onChange,
}: {
    counts: Record<OutcomeView, number>;
    view: DealsView;
    onChange: (view: DealsView) => void;
}) {
    return (
        <>
            {OUTCOME_TABS.map((tab) => (
                <FilterChip
                    key={tab.view}
                    label={tab.label}
                    count={counts[tab.view]}
                    isActive={view === tab.view}
                    onClick={() => onChange(view === tab.view ? "board" : tab.view)}
                    description={tab.description}
                />
            ))}
        </>
    );
}
