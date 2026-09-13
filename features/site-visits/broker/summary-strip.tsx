"use client";

import { cn } from "@/lib/utils";

import type { BrokerVisitSummary, SummaryFilter } from "@/features/site-visits/broker/model";

const SUMMARY_ITEMS: {
    key: SummaryFilter;
    label: string;
    field: keyof BrokerVisitSummary;
    warning?: boolean;
}[] = [
    { key: "today", label: "Today", field: "today" },
    { key: "tomorrow", label: "Tomorrow", field: "tomorrow" },
    { key: "awaiting", label: "Awaiting owner", field: "awaitingOwner", warning: true },
    { key: "feedback", label: "Needs feedback", field: "needsOutcome", warning: true },
    { key: "week", label: "This week", field: "weekTotal" },
    { key: "cancelled", label: "Cancelled", field: "cancelledThisWeek" },
];

export function SummaryStrip({
    summary,
    active,
    onChange,
}: {
    summary: BrokerVisitSummary;
    active?: SummaryFilter;
    onChange: (next?: SummaryFilter) => void;
}) {
    return (
        <section aria-label="Visit summary" className="
          relative overflow-hidden border-y border-border-warm bg-surface
        ">
            <div className="flex scrollbar-none overflow-x-auto">
                {SUMMARY_ITEMS.map((item, index) => {
                    const count = summary[item.field];
                    const isActive = active === item.key;
                    const warning = Boolean(item.warning && count > 0);
                    return (
                        <button
                            key={item.key}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onChange(isActive ? undefined : item.key)}
                            className={cn(
                                `
                                  group relative flex flex-1 items-baseline justify-center gap-2
                                  px-3 py-3.5 text-start transition-colors outline-none
                                  min-inline-[118px]
                                `,
                                index > 0 && `
                                  before:absolute before:inset-y-3 before:inset-s-0
                                  before:bg-border-warm before:inline-px
                                `,
                                index < 2 && "sticky z-10 bg-surface",
                                index === 0 && "inset-s-0",
                                index === 1 && `
                                  inset-s-[118px] shadow-[8px_0_14px_-14px_rgba(11,31,23,0.45)]
                                  md:static md:shadow-none
                                `,
                                isActive && "z-20 bg-brand-ink text-surface before:hidden",
                                !isActive && "hover:bg-surface-muted focus-visible:bg-brand-soft",
                            )}
                        >
                            <span className={cn("tabular text-xl font-bold text-ink", isActive && `
                              text-surface
                            `, warning && !isActive && `text-pending`)}>{count}</span>
                            <span className={cn("body-xs whitespace-nowrap text-ink-muted", isActive && `
                              font-semibold text-surface/80
                            `, warning && !isActive && `text-pending`)}>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

