"use client";

import { useEffect, useState } from "react";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

import type {
    ReferralsFilters,
    ReferralsSummary,
    ReferralStatusFilter,
} from "@/features/referrals/types";

/**
 * Only the numeric summary fields can sit on a chip. Spelled out as a
 * constraint rather than `keyof ReferralsSummary` so a nullable field like
 * `conversionPct` cannot be pointed at a chip.
 */
type CountKey = {
    [K in keyof ReferralsSummary]: ReferralsSummary[K] extends number ? K : never;
}[keyof ReferralsSummary];

type StatusOption = { value: ReferralStatusFilter; label: string; countKey?: CountKey };

/**
 * "All" leads as the unfiltered default, then the narrowing ones in the order
 * a broker cares: what is moving, what is stuck on a step they can chase, what
 * is stuck on someone else, what paid off, what died.
 */
const STATUS_OPTIONS: StatusOption[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "In flight", countKey: "pendingCount" },
    { value: "joined", label: "Email pending", countKey: "emailPendingCount" },
    {
        value: "awaiting_approval",
        label: "Owner deciding",
        countKey: "awaitingApprovalCount",
    },
    { value: "qualified", label: "Qualified", countKey: "qualifiedCount" },
    { value: "expired", label: "Expired", countKey: "expiredCount" },
];

const CHIP_CLASS = `
  body-sm flex shrink-0 items-center gap-1.5 rounded-control border px-4 font-medium
  transition-colors duration-160 block-control-sm
`;

/** Debounced so typing does not refetch on every keystroke. */
function ReferralsQueryInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (q: string) => void;
}) {
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
            placeholder="Search name or number"
            aria-label="Search the brokers you invited"
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

type ReferralsHeaderProps = {
    filters: ReferralsFilters;
    summary: ReferralsSummary | null;
    onPatch: (patch: Partial<ReferralsFilters>) => void;
};

/** The status chips and search, on one row. */
export function ReferralsHeader({ filters, summary, onPatch }: ReferralsHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-3">
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
                                    : `border-border-warm bg-surface text-ink hover:border-ink/25`,
                            )}
                        >
                            {option.label}
                            {/* A zero on a chip is noise, not information —
                                docs/EMPTY_STATES.md. The chip still works. */}
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

            <ReferralsQueryInput value={filters.q} onChange={(q) => onPatch({ q })} />
        </div>
    );
}
