"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

import { filterChipClassName } from "@/components/shared/filter-chip";
import { Skeleton } from "@/components/shared/skeleton";
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
    isLoading = false,
}: {
    counts: Record<DealsView, number | null>;
    view: DealsView;
    isLoading?: boolean;
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
                    <span className="body-xs inline-flex items-center justify-center rounded-full bg-ink/5 px-1.5 font-semibold text-ink-muted tabular-nums block-5 min-inline-6 group-data-active/pipeline-tab:bg-brand-text/10 group-data-active/pipeline-tab:text-brand-text">
                        {counts[tab.view] != null ? (
                            counts[tab.view]
                        ) : isLoading ? (
                            <Skeleton className="rounded-sm bg-ink/10 block-3 inline-3" />
                        ) : (
                            "-"
                        )}
                    </span>
                </TabsPrimitive.Tab>
            ))}
        </TabsList>
    );
}
