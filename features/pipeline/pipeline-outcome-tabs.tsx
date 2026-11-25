"use client";

import { ResponsiveListStatus } from "@/components/shared/responsive-list-toolbar";
import { StatusTabs } from "@/components/shared/status-tabs";

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
    onChange,
    compact = false,
}: {
    counts: Record<DealsView, number | null>;
    view: DealsView;
    isLoading?: boolean;
    onChange: (value: string) => void;
    compact?: boolean;
}) {
    return (
        <ResponsiveListStatus
            label="Status"
            mobileDrawer
            value={view}
            onChange={onChange}
            isLoading={isLoading}
            hideLabel={compact}
            options={PIPELINE_TABS.map((tab) => ({
                ...tab,
                label: compact ? tab.compactLabel : tab.label,
                value: tab.view,
                count: counts[tab.view],
            }))}
        >
            <StatusTabs
                label="Pipeline views"
                value={view}
                isLoading={isLoading}
                tabs={PIPELINE_TABS.map((tab) => ({
                    ...tab,
                    value: tab.view,
                    count: counts[tab.view],
                }))}
            />
        </ResponsiveListStatus>
    );
}
