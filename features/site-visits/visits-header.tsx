"use client";

import { useEffect, useState } from "react";

import { CalendarDays, List, Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type {
    VisitsFilters,
    VisitsSummary,
    VisitStatusFilter,
    VisitsView,
    VisitViewer,
} from "@/features/site-visits/types";

type StatusOption = { value: VisitStatusFilter; label: string; countKey?: keyof VisitsSummary };

/**
 * Filter chips, in the order a user actually reasons about them: what needs me,
 * what is coming, then history. "All" sits last because it is the escape hatch,
 * not the starting point.
 */
const STATUS_OPTIONS: StatusOption[] = [
    { value: "needs_action", label: "Needs you", countKey: "needsActionCount" },
    { value: "upcoming", label: "Upcoming", countKey: "upcomingCount" },
    { value: "completed", label: "Done", countKey: "completedCount" },
    { value: "cancelled", label: "Cancelled", countKey: "cancelledCount" },
    { value: "all", label: "All" },
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
    view: VisitsView;
    viewer: VisitViewer;
    onPatch: (patch: Partial<VisitsFilters>) => void;
    onViewChange: (view: VisitsView) => void;
};

/**
 * Search, the calendar/list switch, and the status chips.
 *
 * Date navigation and the month/week/day switcher are *not* here — the
 * calendar ships its own nav and owns the anchor date, so a second set of
 * arrows on this page would be two controls fighting over one piece of state.
 */
export function VisitsHeader({ filters, summary, view, onPatch, onViewChange }: VisitsHeaderProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <VisitsQueryInput value={filters.q} onChange={(q) => onPatch({ q })} />

                <div
                    className="flex items-center gap-1 rounded-control bg-surface-muted p-1"
                    role="group"
                    aria-label="Switch view"
                >
                    <Button
                        size="sm"
                        variant={view === "calendar" ? "default" : "ghost"}
                        aria-pressed={view === "calendar"}
                        onClick={() => onViewChange("calendar")}
                    >
                        <CalendarDays aria-hidden />
                        Calendar
                    </Button>
                    <Button
                        size="sm"
                        variant={view === "list" ? "default" : "ghost"}
                        aria-pressed={view === "list"}
                        onClick={() => onViewChange("list")}
                    >
                        <List aria-hidden />
                        List
                    </Button>
                </div>
            </div>

            {view === "calendar" ? null : (
                // Status chips belong to the list. In the calendar the grid
                // itself is the filter — you look at a day, not at a status.
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pbe-1">
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
            )}
        </div>
    );
}
