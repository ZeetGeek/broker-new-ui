"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { MyListingsSummary } from "@/lib/api/my-listings";

const SUMMARY_LOOP_INTERVAL_S = 6.5;
const META_TEXT = "body-sm font-medium text-ink-muted";
const CHIP_SURFACE = "bg-surface";

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

function buildMyListingsSummaryLines({
    summary,
    resultTotal,
    hasActiveFilters,
    isLoading,
}: {
    summary: MyListingsSummary | null;
    resultTotal: number;
    hasActiveFilters: boolean;
    isLoading: boolean;
}): ReactNode[] {
    if (isLoading && !summary) {
        return ["Getting your listings…"];
    }

    const lines: ReactNode[] = [];
    const total = summary?.total ?? 0;

    if (hasActiveFilters) {
        if (resultTotal === 0) {
            lines.push("No properties match these filters — try clearing a few");
        } else {
            lines.push(
                <>{countLabel(resultTotal, "listing matches", "listings match")} your filters</>,
            );
        }
    } else if (total === 0) {
        lines.push("No properties yet — add your first one");
    } else {
        lines.push(<>{countLabel(total, "listing", "listings")} in your inventory</>);
    }

    if (summary && summary.published > 0) {
        lines.push(<>{countLabel(summary.published, "listing is", "listings are")} published</>);
    }

    if (summary && summary.draft > 0) {
        lines.push(<>{countLabel(summary.draft, "draft", "drafts")} waiting to publish</>);
    }

    if (summary && summary.unpublished > 0) {
        lines.push(
            <>{countLabel(summary.unpublished, "listing is", "listings are")} unpublished</>,
        );
    }

    return lines.length > 0 ? lines : ["Your inventory"];
}

function InventoryStatusMeta({ summary }: { summary: MyListingsSummary | null }) {
    if (!summary || summary.total === 0) {
        return null;
    }

    const chips: { key: string; label: string; count: number }[] = [
        { key: "published", label: "Published", count: summary.published },
        { key: "draft", label: "Draft", count: summary.draft },
        { key: "unpublished", label: "Unpublished", count: summary.unpublished },
    ].filter((chip) => chip.count > 0);

    if (chips.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
                <span className={META_TEXT}>Status</span>
                {chips.map((chip) => (
                    <Badge key={chip.key} variant="outline" className={CHIP_SURFACE}>
                        {chip.label} · {chip.count}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

export function MyListingsAddFab({
    className,
    onClick,
}: {
    className?: string;
    onClick: () => void;
}) {
    return (
        <div
            className={cn(
                `
                  fixed z-30 size-14
                  inset-e-8
                  inset-be-[calc(5.75rem+env(safe-area-inset-bottom))]
                  md:inset-e-10 md:inset-be-10
                `,
                className,
            )}
        >
            <span
                aria-hidden
                className="
                  pointer-events-none absolute inset-0 z-0 rounded-full bg-brand
                  animate-fab-pulse
                  motion-reduce:hidden
                "
            />
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger
                        delay={200}
                        render={
                            <button
                                type="button"
                                onClick={onClick}
                                aria-label="Add property"
                                title="Add property"
                                className="
                                  relative z-10 flex size-14 items-center justify-center
                                  rounded-full bg-brand text-surface shadow-lg
                                  transition-[background-color,transform] duration-160
                                  hover:bg-brand/85
                                  active:scale-[0.97]
                                  focus-visible:outline-none focus-visible:ring-3
                                  focus-visible:ring-ring/30
                                "
                            >
                                <Plus
                                    aria-hidden
                                    className="block-6 inline-6"
                                    strokeWidth={2}
                                />
                            </button>
                        }
                    />
                    <TooltipContent side="left" sideOffset={12} className="body-sm font-medium">
                        Add a new property to your inventory
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

export type MyListingsIntroProps = {
    summary: MyListingsSummary | null;
    resultTotal: number;
    hasActiveFilters: boolean;
    isLoading?: boolean;
};

export function MyListingsIntro({
    summary,
    resultTotal,
    hasActiveFilters,
    isLoading = false,
}: MyListingsIntroProps) {
    const [isPaused, setIsPaused] = useState(false);

    const lines = useMemo(
        () =>
            buildMyListingsSummaryLines({
                summary,
                resultTotal,
                hasActiveFilters,
                isLoading,
            }),
        [summary, resultTotal, hasActiveFilters, isLoading],
    );

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 text-start">
            <h1 className="h3 min-inline-0">
                <span className="text-ink">Your listings</span>
                <span className="text-ink">.</span>{" "}
                <span
                    aria-live="polite"
                    aria-atomic="true"
                    className="text-ink-muted"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <TextLoop interval={SUMMARY_LOOP_INTERVAL_S} trigger={!isPaused}>
                        {lines.map((line, index) => (
                            <span key={index}>{line}</span>
                        ))}
                    </TextLoop>
                </span>
            </h1>

            <InventoryStatusMeta summary={summary} />
        </div>
    );
}
