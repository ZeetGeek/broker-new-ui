"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

import { filterChipClassName } from "@/components/shared/filter-chip";
import { Skeleton } from "@/components/shared/skeleton";
import { TabsList } from "@/components/ui/tabs";

export type StatusTab = {
    value: string;
    label: string;
    compactLabel?: string;
    dotClassName: string;
    count: number | null;
};

/** Shared CRM tabs, with room around the scroll area for their soft shadows. */
export function StatusTabs({
    tabs,
    value,
    label,
    isLoading = false,
    variant = "chips",
}: {
    tabs: StatusTab[];
    value: string;
    label: string;
    isLoading?: boolean;
    variant?: "chips" | "segmented";
}) {
    const segmented = variant === "segmented";
    return (
        <div className="-m-2 overflow-x-auto p-2 max-inline-full min-inline-0">
            <TabsList
                aria-label={label}
                className={cn(
                    "block-auto! max-inline-full",
                    segmented ? "gap-1 bg-surface-muted p-1" : "gap-3 bg-transparent p-0",
                )}
            >
                {tabs.map((tab) => (
                    <TabsPrimitive.Tab
                        key={tab.value}
                        value={tab.value}
                        className={cn(
                            "group/status-tab",
                            segmented
                                ? "touch-target inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent px-3 text-sm font-semibold whitespace-nowrap text-ink-muted block-[30px] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-active:border-border-warm data-active:bg-surface data-active:text-ink"
                                : filterChipClassName(value === tab.value),
                        )}
                    >
                        <span className="inline-flex items-center gap-2.5">
                            {!segmented && (
                                <span
                                    aria-hidden
                                    className={cn(
                                        "shrink-0 rounded-full block-1.5 inline-1.5",
                                        tab.dotClassName,
                                    )}
                                />
                            )}
                            {tab.compactLabel ? (
                                <>
                                    <span className="sm:hidden">{tab.compactLabel}</span>
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </>
                            ) : (
                                <span>{tab.label}</span>
                            )}
                        </span>
                        {isLoading && tab.count == null ? (
                            <span
                                className="inline-flex items-center justify-center block-5 min-inline-6"
                                aria-hidden
                            >
                                <Skeleton className="rounded-sm bg-ink/10 block-3 inline-3" />
                            </span>
                        ) : tab.count != null && tab.count > 0 ? (
                            <span
                                className={cn(
                                    "body-xs inline-flex items-center justify-center rounded-full bg-ink/5 px-1.5 font-semibold text-ink-muted tabular-nums block-5 min-inline-6",
                                    !segmented &&
                                        "group-data-active/status-tab:bg-brand-text/10 group-data-active/status-tab:text-brand-text",
                                )}
                            >
                                {tab.count > 99 ? "99+" : tab.count}
                            </span>
                        ) : null}
                    </TabsPrimitive.Tab>
                ))}
            </TabsList>
        </div>
    );
}
