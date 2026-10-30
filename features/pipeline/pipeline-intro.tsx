"use client";

import { useMemo } from "react";

import { formatDateIn } from "@/lib/format/date";

import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";

import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { DEAL_STAGE_ORDER, type DealItem, type DealsView } from "@/features/pipeline/types";

function dealCount(count: number): string {
    return `${count} ${count === 1 ? "deal" : "deals"}`;
}

export function PipelineIntro({
    deals,
    view,
    hasActiveFilters,
    isLoading,
    hasError,
}: {
    deals: DealItem[];
    view: DealsView;
    hasActiveFilters: boolean;
    isLoading: boolean;
    hasError: boolean;
}) {
    const lines = useMemo(() => {
        if (deals.length === 0) {
            return [
                hasActiveFilters
                    ? "No deals match your filters"
                    : view === "board"
                      ? "No active deals yet"
                      : view === "sold"
                        ? "No finished deals yet"
                        : "No lost deals",
            ];
        }
        if (hasActiveFilters)
            return [
                `${dealCount(deals.length)} ${deals.length === 1 ? "matches" : "match"} your filters`,
            ];
        if (view === "board") {
            const stages = DEAL_STAGE_ORDER.map((stage) => ({
                stage,
                count: deals.filter((deal) => deal.status === stage).length,
            })).filter(({ count }) => count > 0);
            return [
                `${dealCount(deals.length)} in progress`,
                ...stages.map(
                    ({ stage, count }) =>
                        `${dealCount(count)} in the ${DEAL_STAGE_META[stage].label} stage`,
                ),
            ];
        }
        const result = [
            `${dealCount(deals.length)} ${view === "sold" ? "completed" : "marked as lost"}`,
        ];
        const resolved = deals
            .map((deal) => (deal.resolvedAt ? new Date(deal.resolvedAt) : null))
            .filter((date): date is Date => date != null && Number.isFinite(date.getTime()))
            .sort((a, b) => b.getTime() - a.getTime());
        if (resolved[0])
            result.push(
                `${view === "sold" ? "Latest completion" : "Most recent loss"}: ${formatDateIn(resolved[0])}`,
            );
        if (view === "sold") {
            const recorded = deals.filter(
                (deal) => deal.closedAmountInr != null && deal.closedAmountInr > 0,
            ).length;
            if (recorded > 0)
                result.push(
                    `Closing ${recorded === 1 ? "amount" : "amounts"} saved for ${dealCount(recorded)}`,
                );
        } else {
            const reasons = [
                { key: "price", label: "lost on price" },
                { key: "bought_elsewhere", label: "lost to another property" },
                { key: "not_responding", label: "lost after clients stopped replying" },
                { key: "changed_mind", label: "lost after clients changed their mind" },
            ]
                .map((reason) => ({
                    ...reason,
                    count: deals.filter((deal) => deal.lostReason === reason.key).length,
                }))
                .filter(({ count }) => count > 0)
                .sort((a, b) => b.count - a.count);
            if (reasons[0]) result.push(`${dealCount(reasons[0].count)} ${reasons[0].label}`);
        }
        return result;
    }, [deals, view, hasActiveFilters]);

    return (
        <h1 className="h3 text-start min-inline-0">
            <span className="text-ink">Pipeline.</span>{" "}
            <RotatingHeaderSummary
                key={`${view}:${lines.join("|")}`}
                lines={lines}
                isLoading={isLoading}
                loadingLabel="Loading your pipeline summary"
                loadingPlaceholder="Your deals, from first contact to close"
                errorMessage={hasError ? "Could not load your pipeline summary." : undefined}
                reservePlaceholder
            />
        </h1>
    );
}
