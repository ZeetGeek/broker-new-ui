"use client";

import { cn } from "@/lib/utils";

import type { BrokerVisitsTab } from "@/features/site-visits/broker/model";

const TABS: { value: BrokerVisitsTab; label: string }[] = [
    { value: "visits", label: "My visits" },
    { value: "slots", label: "Open slots" },
    { value: "requests", label: "Requests" },
];

export function VisitsTabs({
    value,
    counts,
    onChange,
}: {
    value: BrokerVisitsTab;
    counts: Record<BrokerVisitsTab, number>;
    onChange: (tab: BrokerVisitsTab) => void;
}) {
    return (
        <div className="
          sticky inset-bs-0 z-30 rounded-control border border-border-warm bg-surface p-1 shadow-sm
          md:static md:inline-fit
        " role="tablist" aria-label="Site visit sections">
            <div className="grid grid-cols-3 gap-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={value === tab.value}
                        onClick={() => onChange(tab.value)}
                        className={cn(
                            `
                              body-sm flex items-center justify-center gap-2 rounded-[9px] px-3
                              font-semibold text-ink-muted transition-colors outline-none
                              min-block-11
                              focus-visible:ring-3 focus-visible:ring-brand/25
                            `,
                            value === tab.value ? "bg-brand-ink text-surface" : `
                              hover:bg-surface-muted hover:text-ink
                            `,
                        )}
                    >
                        <span>{tab.label}</span>
                        <span className={cn(`
                          tabular rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px]
                          text-ink-muted
                        `, value === tab.value && `bg-surface/15 text-surface`)}>{counts[tab.value]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

