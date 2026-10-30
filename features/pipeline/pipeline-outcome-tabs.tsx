"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

import { filterChipClassName } from "@/components/shared/filter-chip";
import { TabsList } from "@/components/ui/tabs";

import type { DealsView } from "@/features/pipeline/types";

export type OutcomeView = Exclude<DealsView, "board">;

const PIPELINE_TABS: { view: DealsView; label: string; compactLabel: string }[] = [
    { view: "board", label: "Active deals", compactLabel: "Active" },
    { view: "sold", label: "Finished deals", compactLabel: "Finished" },
    { view: "lost", label: "Lost deals", compactLabel: "Lost" },
];

/** Explicit, mutually exclusive views of the broker's pipeline. */
export function PipelineOutcomeTabs({
    counts,
    view,
}: {
    counts: Record<DealsView, number | null>;
    view: DealsView;
}) {
    return (
        <TabsList
            aria-label="Pipeline views"
            className="gap-3 bg-transparent p-0 block-auto! max-inline-full"
        >
            {PIPELINE_TABS.map((tab) => (
                <TabsPrimitive.Tab
                    key={tab.view}
                    value={tab.view}
                    className={cn("group/pipeline-tab", filterChipClassName(view === tab.view))}
                >
                    <span className="sm:hidden">{tab.compactLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    {counts[tab.view] != null ? (
                        <span className="body-xs rounded-full bg-ink/5 px-1.5 font-semibold text-ink-muted tabular-nums min-inline-5 group-data-active/pipeline-tab:bg-brand-text/10 group-data-active/pipeline-tab:text-brand-text">
                            {counts[tab.view]}
                        </span>
                    ) : null}
                </TabsPrimitive.Tab>
            ))}
        </TabsList>
    );
}
