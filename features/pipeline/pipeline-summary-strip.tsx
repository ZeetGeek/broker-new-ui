"use client";

import { X } from "lucide-react";

import { formatPriceInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import type { DealsSummary, PipelineSummaryChip } from "@/features/pipeline/types";

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

export function PipelineSummaryStrip({
    summary,
    active,
    onChange,
}: {
    summary: DealsSummary;
    active: PipelineSummaryChip;
    onChange: (chip: PipelineSummaryChip) => void;
}) {
    const chips: {
        id: PipelineSummaryChip;
        label: string;
        tone: "default" | "urgent";
    }[] = [
        {
            id: "running",
            label: `${countLabel(summary.liveTotal, "deal", "deals")} running`,
            tone: "default",
        },
        {
            id: "in_play",
            label: `${formatPriceInr(summary.liveValueInr)} in play`,
            tone: "default",
        },
        {
            id: "quiet",
            label: `${summary.stalledCount} gone quiet`,
            tone: "urgent",
        },
        {
            id: "finished",
            label: `${summary.closedCount + summary.lostCount} finished`,
            tone: "default",
        },
    ];

    return (
        <div role="group" aria-label="Filter deals" className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => {
                const isActive = active === chip.id;
                const isUrgent = chip.tone === "urgent";

                return (
                    <div
                        key={chip.id}
                        className={cn(
                            "body-sm flex items-center rounded-sm border font-medium",
                            isActive &&
                                !isUrgent &&
                                "border-brand bg-brand-soft text-brand-text",
                            isActive && isUrgent && "border-urgent bg-urgent-soft text-urgent",
                            !isActive && "border-border-warm bg-surface text-ink",
                        )}
                    >
                        <button
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onChange(chip.id)}
                            className="px-3 py-1.5"
                        >
                            {chip.label}
                        </button>
                        {isActive && chip.id !== "running" ? (
                            <button
                                type="button"
                                aria-label="Clear filter"
                                className="pe-2 text-current hover:opacity-70"
                                onClick={() => onChange("running")}
                            >
                                <X aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                            </button>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}
