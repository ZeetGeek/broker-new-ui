"use client";

import { formatPriceInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { DealsSummary, DealsView } from "@/features/pipeline/types";

const META_TEXT = "body-sm font-medium text-ink-muted";

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * The two-tone headline from docs/DESIGN.md §2.3: the first clause states the
 * fact, the second states what it means. Written so the second clause is the
 * thing the broker should act on, not a restatement of the first.
 */
function headlineClauses(
    summary: DealsSummary | null,
    view: DealsView,
): { fact: string; meaning: string } {
    if (!summary) {
        return { fact: "No deals yet.", meaning: "Add a buyer to a property you represent." };
    }

    // The headline describes what is actually on screen. Saying "9 deals
    // running" above a list of finished ones would be a lie the broker can see.
    if (view === "done") {
        const resolved = summary.closedCount + summary.lostCount;
        if (resolved === 0) {
            return { fact: "Nothing finished yet.", meaning: "Sold and lost deals land here." };
        }
        return {
            fact: `${countLabel(summary.closedCount, "deal", "deals")} sold.`,
            meaning:
                summary.lostCount > 0
                    ? `${countLabel(summary.lostCount, "was", "were")} lost.`
                    : `${summary.winRate}% of finished deals.`,
        };
    }

    if (summary.liveTotal === 0) {
        return { fact: "No deals yet.", meaning: "Add a buyer to a property you represent." };
    }

    const fact = `${countLabel(summary.liveTotal, "deal", "deals")} running.`;

    if (summary.stalledCount > 0) {
        return {
            fact,
            meaning: `${countLabel(summary.stalledCount, "has", "have")} gone quiet.`,
        };
    }

    if (summary.upcomingVisitCount > 0) {
        return {
            fact,
            meaning: `${countLabel(summary.upcomingVisitCount, "visit", "visits")} coming up.`,
        };
    }

    return { fact, meaning: `${formatPriceInr(summary.liveValueInr)} on the table.` };
}

function StatChip({
    label,
    value,
    hint,
    tone = "default",
}: {
    label: string;
    value: string;
    /** Every number gets a plain-English explanation on hover. */
    hint: string;
    tone?: "default" | "urgent" | "success";
}) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Badge
                        variant={tone === "urgent" ? "urgent" : "outline"}
                        className={cn(
                            "cursor-help",
                            tone !== "urgent" && "bg-surface",
                            tone === "success" && "text-success",
                        )}
                    >
                        {label} · <span className="tabular">{value}</span>
                    </Badge>
                }
            />
            <TooltipContent side="bottom">{hint}</TooltipContent>
        </Tooltip>
    );
}

export function PipelineIntro({
    summary,
    isLoading,
    view,
}: {
    summary: DealsSummary | null;
    isLoading: boolean;
    view: DealsView;
}) {
    const { fact, meaning } = headlineClauses(summary, view);

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="h4">
                        <span className="text-ink">{fact}</span>{" "}
                        <span className="text-ink-muted">{meaning}</span>
                    </h1>
                    {isLoading && !summary ? (
                        <p className={META_TEXT}>Getting your deals…</p>
                    ) : null}
                </div>

                {summary && summary.liveTotal + summary.closedCount + summary.lostCount > 0 ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Only numbers a broker can act on. Win rate and
                                total value explain a number in a tooltip
                                rather than taking a chip of their own. */}
                            {summary.upcomingVisitCount > 0 ? (
                                <StatChip
                                    label="Visits booked"
                                    value={String(summary.upcomingVisitCount)}
                                    hint="Deals with a site visit coming up."
                                />
                            ) : null}

                            {summary.stalledCount > 0 ? (
                                <StatChip
                                    label="Gone quiet"
                                    value={String(summary.stalledCount)}
                                    tone="urgent"
                                    hint="Deals you have not touched in two weeks or more. Call these buyers."
                                />
                            ) : null}

                            {summary.closedCount > 0 ? (
                                <StatChip
                                    label="Sold"
                                    value={String(summary.closedCount)}
                                    tone="success"
                                    hint={`Deals you closed. Of the deals that ended, ${summary.winRate}% were sold.`}
                                />
                            ) : null}
                        </div>

                        {summary.liveTotal > 0 ? (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <span
                                            className={cn(
                                                META_TEXT,
                                                "ms-auto cursor-help whitespace-nowrap",
                                            )}
                                        >
                                            <span className="tabular">
                                                {formatPriceInr(summary.liveValueInr)}
                                            </span>{" "}
                                            in play
                                        </span>
                                    }
                                />
                                <TooltipContent side="bottom">
                                    The asking price of every property you have a live deal on.
                                    Not your commission.
                                </TooltipContent>
                            </Tooltip>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </TooltipProvider>
    );
}
