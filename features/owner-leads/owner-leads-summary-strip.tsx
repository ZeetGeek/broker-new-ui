"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export type OwnerLeadsSummaryChip = "running" | "pending" | "finished";

export type OwnerLeadsSummary = {
    liveTotal: number;
    pendingOfferCount: number;
    finishedCount: number;
};

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

export function OwnerLeadsSummaryStrip({
    summary,
    active,
    onChange,
}: {
    summary: OwnerLeadsSummary;
    active: OwnerLeadsSummaryChip;
    onChange: (chip: OwnerLeadsSummaryChip) => void;
}) {
    const chips: {
        id: OwnerLeadsSummaryChip;
        label: string;
        tone: "default" | "urgent";
    }[] = [
        {
            id: "running",
            label: `${countLabel(summary.liveTotal, "lead", "leads")} running`,
            tone: "default",
        },
        {
            id: "pending",
            label: `${countLabel(summary.pendingOfferCount, "offer needs", "offers need")} your reply`,
            tone: "urgent",
        },
        {
            id: "finished",
            label: `${countLabel(summary.finishedCount, "lead", "leads")} finished`,
            tone: "default",
        },
    ];

    return (
        <div role="group" aria-label="Filter leads" className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => {
                const isActive = active === chip.id;
                const isUrgent = chip.tone === "urgent";
                // Hide empty urgent chips so a quiet board does not advertise urgency.
                if (isUrgent && summary.pendingOfferCount === 0 && !isActive) return null;

                return (
                    <div
                        key={chip.id}
                        className={cn(
                            `
                              body-sm flex items-center rounded-control border transition-colors
                              duration-160 block-control-sm
                            `,
                            isActive ? "font-semibold" : "font-medium",
                            isActive && !isUrgent && "border-brand bg-brand-soft text-brand-text",
                            isActive && isUrgent && "border-urgent bg-urgent-soft text-urgent",
                            !isActive &&
                                "border-border-warm bg-surface text-ink-muted hover:border-ink/25",
                        )}
                    >
                        <button
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onChange(chip.id)}
                            className="flex items-center px-3 block-full"
                        >
                            {chip.label}
                        </button>
                        {isActive && chip.id !== "running" ? (
                            <button
                                type="button"
                                aria-label="Clear filter"
                                className="
                                  flex items-center pe-2 text-current block-full
                                  hover:opacity-70
                                "
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
