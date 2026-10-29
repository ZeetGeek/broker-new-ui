"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { REQUEST_GROUPS, requestIsCollapsed } from "@/lib/visits/status";
import { addVisitDays as addDays, addVisitMonths as addMonths } from "@/lib/visits/time";
import { formatVisitTime, istDateKey } from "@/lib/visits/time";
import { useRequestActions } from "@/hooks/use-time-requests";

import type { TimeRequest } from "@/features/site-visits/broker/model";
import type { SlotDateRange } from "@/features/site-visits/broker/open-slots/slot-filters";
import { RequestRow } from "@/features/site-visits/broker/requests/request-row";
import {
    type VisitsFilterChip,
    VisitsFilterChips,
    visitsRangeChipLabel,
} from "@/features/site-visits/broker/visits-filter-chips";
import { EmptyState, VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";

function rangeBounds(
    range: SlotDateRange | "all",
    customFrom: string,
    customTo: string,
    now: Date,
): { from: string; to: string } | null {
    if (range === "all") return null;
    const today = istDateKey(now);
    if (range === "today") return { from: today, to: today };
    if (range === "tomorrow") {
        const key = istDateKey(addDays(now, 1));
        return { from: key, to: key };
    }
    if (range === "month") {
        return { from: today, to: istDateKey(addMonths(now, 1)) };
    }
    if (range === "custom") {
        if (!customFrom) return null;
        return { from: customFrom, to: customTo || customFrom };
    }
    return { from: today, to: istDateKey(addDays(now, 7)) };
}

function matchesQuery(request: TimeRequest, query: string) {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    const haystack = [
        request.property.title,
        request.property.configLabel,
        request.property.locality,
        request.property.city,
        request.owner.name,
        ...request.buyers.map((buyer) => buyer.name),
    ]
        .join(" ")
        .toLowerCase();
    return haystack.includes(needle);
}

export function RequestsTab({
    requests,
    isLoading,
    query = "",
    range = "all",
    customFrom = "",
    customTo = "",
    onNew,
    onRetry,
    onViewVisit,
    onClearQuery,
    onClearRange,
    onClearFilters,
}: {
    requests: TimeRequest[];
    isLoading: boolean;
    query?: string;
    range?: SlotDateRange | "all";
    customFrom?: string;
    customTo?: string;
    onNew: () => void;
    onRetry: (propertyId: string, buyerId?: string) => void;
    onViewVisit: (id: string) => void;
    onClearQuery?: () => void;
    onClearRange?: () => void;
    onClearFilters?: () => void;
}) {
    const actions = useRequestActions();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [now] = useState(() => new Date());
    const filtered = useMemo(() => {
        const bounds = rangeBounds(range, customFrom, customTo, now);
        return requests.filter((request) => {
            if (!matchesQuery(request, query)) return false;
            if (!bounds) return true;
            const day = istDateKey(request.preferredStartsAt);
            return day >= bounds.from && day <= bounds.to;
        });
    }, [customFrom, customTo, now, query, range, requests]);
    const chips = useMemo(() => {
        const next: VisitsFilterChip[] = [];
        const trimmed = query.trim();
        if (trimmed && onClearQuery) {
            next.push({ key: "query", label: `“${trimmed}”`, clear: onClearQuery });
        }
        if (range !== "all" && onClearRange) {
            next.push({
                key: "range",
                label: visitsRangeChipLabel(range, customFrom, customTo),
                clear: onClearRange,
            });
        }
        return next;
    }, [customFrom, customTo, onClearQuery, onClearRange, query, range]);
    const groups = useMemo(
        () =>
            REQUEST_GROUPS.map((group) => ({
                ...group,
                rows: filtered
                    .filter((request) => request.status === group.status)
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
            })).filter((group) => group.rows.length > 0),
        [filtered],
    );
    const expired = filtered.filter((request) => requestIsCollapsed(request.status)).length;
    const busy =
        actions.accept.isPending ||
        actions.decline.isPending ||
        actions.withdraw.isPending ||
        actions.nudge.isPending;
    const run = async (request: TimeRequest, action: () => Promise<unknown>, success: string) => {
        setErrors((current) => ({ ...current, [request.id]: "" }));
        try {
            await action();
            toast.success(success);
        } catch (error) {
            setErrors((current) => ({
                ...current,
                [request.id]:
                    error instanceof Error
                        ? error.message
                        : "Could not update this request. Check your connection and try again.",
            }));
        }
    };

    if (isLoading && requests.length === 0) return <VisitsTabSkeleton kind="requests" />;
    if (requests.length === 0) return <EmptyState kind="no-requests" onPrimary={onNew} />;

    return (
        <section className="space-y-4">
            {onClearFilters ? (
                <VisitsFilterChips chips={chips} onClearAll={onClearFilters} />
            ) : null}

            {groups.length === 0 ? (
                <EmptyState kind="no-requests" onPrimary={onClearFilters ?? onNew} />
            ) : (
                <div className="space-y-6">
                    {groups.map((group) => (
                        <section key={group.status} className="space-y-3">
                            <header
                                className="
                                  flex flex-wrap items-baseline justify-between gap-2 px-0.5
                                "
                            >
                                <h3 className="body-sm font-semibold text-ink-muted">
                                    {group.label}
                                </h3>
                                <span className="body-xs text-ink-muted tabular-nums">
                                    {group.rows.length}{" "}
                                    {group.rows.length === 1 ? "request" : "requests"}
                                </span>
                            </header>
                            <div className="space-y-3">
                                {group.rows.map((request) => (
                                    <RequestRow
                                        key={request.id}
                                        request={request}
                                        busy={busy}
                                        error={errors[request.id]}
                                        onWithdraw={() =>
                                            void run(
                                                request,
                                                () => actions.withdraw.mutateAsync(request.id),
                                                "Request withdrawn",
                                            )
                                        }
                                        onNudge={() => {
                                            const text = encodeURIComponent(
                                                `Hello ${request.owner.name}, I had asked for a ${formatVisitTime(request.preferredStartsAt)} visit at ${request.property.title} for my client. Can you confirm if that time works?`,
                                            );
                                            if (request.owner.phoneDigits)
                                                window.open(
                                                    `https://wa.me/91${request.owner.phoneDigits}?text=${text}`,
                                                    "_blank",
                                                    "noopener,noreferrer",
                                                );
                                            void run(
                                                request,
                                                () => actions.nudge.mutateAsync(request.id),
                                                "Owner nudge ready",
                                            );
                                        }}
                                        onAccept={() =>
                                            void run(
                                                request,
                                                () => actions.accept.mutateAsync(request),
                                                "Counter-offer accepted",
                                            )
                                        }
                                        onDecline={() =>
                                            void run(
                                                request,
                                                () => actions.decline.mutateAsync(request.id),
                                                "Counter-offer declined",
                                            )
                                        }
                                        onRetry={() =>
                                            onRetry(request.propertyId, request.buyerIds[0])
                                        }
                                        onViewVisit={() => {
                                            if (request.createdVisitId)
                                                onViewVisit(request.createdVisitId);
                                        }}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {expired > 0 ? (
                <details className="rounded-inner border border-border-warm bg-surface px-4 py-3">
                    <summary className="body-sm cursor-pointer font-semibold text-ink-muted">
                        {expired} expired {expired === 1 ? "request" : "requests"}
                    </summary>
                    <p className="body-xs mbs-2 text-ink-muted">
                        These times passed before an owner accepted them.
                    </p>
                </details>
            ) : null}
        </section>
    );
}
