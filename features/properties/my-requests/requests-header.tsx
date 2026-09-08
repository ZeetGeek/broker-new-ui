"use client";

import { useEffect, useState } from "react";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

import { RequestsSortMenu } from "@/features/properties/my-requests/requests-sort-menu";
import { RequestsStatusMenu } from "@/features/properties/my-requests/requests-status-menu";
import { RequestsViewToggle } from "@/features/properties/my-requests/requests-view-toggle";
import type {
    RequestsFilters,
    RequestSort,
    RequestsSummary,
    RequestsViewFilter,
} from "@/features/properties/my-requests/types";
import type { RequestsView } from "@/features/properties/my-requests/use-requests-view";

/** Search is debounced so typing does not push a URL entry per keystroke. */
function RequestsQueryInput({ value, onChange }: { value: string; onChange: (q: string) => void }) {
    const [draft, setDraft] = useState(value);
    const [prevValue, setPrevValue] = useState(value);

    // An external change (back button, cleared filters) wins over a stale draft.
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
            placeholder="Search requests"
            aria-label="Search your requests"
            startIcon={Search}
            clearable
            wrapperClassName="
              min-inline-44 inline-44 shadow-sm
              sm:min-inline-52 sm:inline-52
              lg:min-inline-64 lg:inline-64
            "
            className="
              rounded-full border! border-border-warm bg-surface text-sm font-medium shadow-sm
              block-[38px]!
              hover:border-ink/25!
              focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20
            "
        />
    );
}

export function RequestsHeader({
    filters,
    summary,
    isLoading,
    view,
    onViewChange,
    onPatch,
}: {
    filters: RequestsFilters;
    summary: RequestsSummary | null;
    isLoading: boolean;
    view: RequestsView;
    onViewChange: (view: RequestsView) => void;
    onPatch: (patch: Partial<RequestsFilters>) => void;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <RequestsStatusMenu
                view={filters.view}
                summary={summary}
                isLoading={isLoading && !summary}
                onViewChange={(next: RequestsViewFilter) => onPatch({ view: next })}
            />

            <div className="flex shrink-0 items-center gap-2.5">
                <RequestsQueryInput value={filters.q} onChange={(q) => onPatch({ q })} />
                <RequestsViewToggle view={view} onViewChange={onViewChange} />
                <RequestsSortMenu
                    sort={filters.sort}
                    onSortChange={(sort: RequestSort) => onPatch({ sort })}
                />
            </div>
        </div>
    );
}
