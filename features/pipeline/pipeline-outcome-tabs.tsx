"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

import { filterChipClassName } from "@/components/shared/filter-chip";
import { Skeleton } from "@/components/shared/skeleton";
import { TabsList } from "@/components/ui/tabs";

import type { DealsView } from "@/features/pipeline/types";

export type OutcomeView = Exclude<DealsView, "board">;

const PIPELINE_TABS: {
    view: DealsView;
    label: string;
    compactLabel: string;
    dotClassName: string;
}[] = [
    {
        view: "board",
        label: "Active deals",
        compactLabel: "Active",
        dotClassName: "bg-emerald-400",
    },
    {
        view: "sold",
        label: "Finished deals",
        compactLabel: "Finished",
        dotClassName: "bg-yellow-300",
    },
    { view: "lost", label: "Lost deals", compactLabel: "Lost", dotClassName: "bg-red-400" },
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
                    <span className="inline-flex items-center gap-2.5">
                        <span
                            aria-hidden
                            className={cn("size-1.5 shrink-0 rounded-full", tab.dotClassName)}
                        />
                        <span className="sm:hidden">{tab.compactLabel}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </span>
                    {isLoading && counts[tab.view] == null ? (
                        <span
                            className="
                              inline-flex items-center justify-center block-5 min-inline-6
                            "
                            aria-hidden
                        >
                            <Skeleton className="rounded-sm bg-ink/10 block-3 inline-3" />
                        </span>
                    ) : counts[tab.view] != null && counts[tab.view]! > 0 ? (
                        <span
                            className="
                              body-xs inline-flex items-center justify-center rounded-full bg-ink/5
                              px-1.5 font-semibold text-ink-muted tabular-nums block-5 min-inline-6
                              group-data-active/pipeline-tab:bg-brand-text/10
                              group-data-active/pipeline-tab:text-brand-text
                            "
                        >
                            {counts[tab.view]! > 99 ? "99+" : counts[tab.view]}
                        </span>
                    ) : null}
                </TabsPrimitive.Tab>
            ))}
        </TabsList>
    );
}
