"use client";

import { useEffect, useState } from "react";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

import type {
    VisitsFilters,
    VisitsSummary,
    VisitStatusFilter,
    VisitViewer,
} from "@/features/site-visits/types";
import { VisitsDateRange } from "@/features/site-visits/visits-date-range";

/**
 * Only the numeric summary fields can sit on a chip. Spelled out as a
 * constraint rather than `keyof VisitsSummary` so a non-numeric field like
 * `dayCounts` cannot be pointed at a chip and rendered as "[object Object]".
 */
type CountKey = {
    [K in keyof VisitsSummary]: VisitsSummary[K] extends number ? K : never;
}[keyof VisitsSummary];

type StatusOption = { value: VisitStatusFilter; label: string; countKey?: CountKey };

/**
 * Filter chips. "All" leads as the unfiltered default, then the narrowing
 * ones: what needs me, what is coming, then history.
 */
const STATUS_OPTIONS: StatusOption[] = [
    { value: "all", label: "All" },
    { value: "needs_action", label: "Needs you", countKey: "needsActionCount" },
    { value: "upcoming", label: "Upcoming", countKey: "upcomingCount" },
    { value: "completed", label: "Done", countKey: "completedCount" },
    { value: "cancelled", label: "Cancelled", countKey: "cancelledCount" },
];

const CHIP_CLASS = `
  body-sm flex shrink-0 items-center gap-1.5 rounded-control border px-4 font-medium
  transition-colors duration-160 block-control-sm
`;

/** Search is debounced so typing does not refetch on every keystroke. */
function VisitsQueryInput({ value, onChange }: { value: string; onChange: (q: string) => void }) {
    const [draft, setDraft] = useState(value);
    const [prevValue, setPrevValue] = useState(value);

    // An external change (cleared filters) wins over a stale draft.
    if (value !== prevValue) {
        setPrevValue(value);
        setDraft(value);
    }

    useEffect(() => {
        if (draft === value) return;
        const timer = window.setTimeout(() => onChange(draft), 300);
        return () => window.clearTimeout(timer);
    }, [draft, onChange, value]);

    return (
        <Input
            size="sm"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search property, area or name"
            aria-label="Search your visits"
            startIcon={Search}
            clearable
            wrapperClassName="
              min-inline-44 inline-44 shadow-sm
              sm:min-inline-52 sm:inline-52
              lg:min-inline-64 lg:inline-64
            "
        />
    );
}

type VisitsHeaderProps = {
    filters: VisitsFilters;
    summary: VisitsSummary | null;
    viewer: VisitViewer;
    onPatch: (patch: Partial<VisitsFilters>) => void;
};

/** Search and the status chips. */
export function VisitsHeader({ filters, summary, onPatch }: VisitsHeaderProps) {
    return (
        <div className="flex flex-col gap-3">
            <VisitsQueryInput value={filters.q} onChange={(q) => onPatch({ q })} />

            <div className="flex items-start gap-3">
                <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pbe-1 min-inline-0">
                    {STATUS_OPTIONS.map((option) => {
                        const isActive = filters.status === option.value;
                        const count = option.countKey ? summary?.[option.countKey] : undefined;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => onPatch({ status: option.value })}
                                className={cn(
                                    CHIP_CLASS,
                                    isActive
                                        ? "border-brand-ink bg-brand-ink text-white"
                                        : `
                                          border-border-warm bg-surface text-ink
                                          hover:border-ink/25
                                        `,
                                )}
                            >
                                {option.label}
                                {typeof count === "number" && count > 0 ? (
                                    <span
                                        className={cn(
                                            "tabular body-xs",
                                            isActive ? "text-white/70" : "text-ink-subtle",
                                        )}
                                    >
                                        {count}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>

                {/* Outside the scrolling chip row so it stays reachable
                    instead of sliding off the end on a narrow phone. */}
                <VisitsDateRange
                    dateFrom={filters.dateFrom}
                    dateTo={filters.dateTo}
                    onChange={onPatch}
                />
            </div>
        </div>
    );
}
