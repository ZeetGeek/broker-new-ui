"use client";

import { useMemo, useState } from "react";

import { addDays, addMonths } from "date-fns";

import { formatPrice } from "@/lib/format/price";
import { propertyCriteriaCount, type PropertyListCriteria } from "@/lib/properties/list-criteria";
import { groupVisitsByDay } from "@/lib/visits/grouping";
import { matchesVisitProperty } from "@/lib/visits/property-filters";
import { isVisitCancelled } from "@/lib/visits/status";
import { formatVisitDayHeading, formatVisitTime, istDateKey } from "@/lib/visits/time";

import { VirtualStack } from "@/components/shared/virtual-stack";

import type { BrokerSiteVisit, SummaryFilter } from "@/features/site-visits/broker/model";
import { VisitCard } from "@/features/site-visits/broker/my-visits/visit-card";
import type { SlotDateRange } from "@/features/site-visits/broker/open-slots/slot-filters";
import {
    type VisitsFilterChip,
    VisitsFilterChips,
    visitsRangeChipLabel,
} from "@/features/site-visits/broker/visits-filter-chips";
import { EmptyState, VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";

const FOCUS_CHIP_LABEL: Record<SummaryFilter, string> = {
    today: "Today",
    tomorrow: "Tomorrow",
    awaiting: "Waiting for owner",
    feedback: "Needs outcome",
    week: "This week",
    cancelled: "Cancelled",
};

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

function matchesQuery(visit: BrokerSiteVisit, query: string) {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    const haystack = [
        visit.property.title,
        visit.property.configLabel,
        visit.property.locality,
        visit.property.city,
        visit.property.address,
        visit.owner.name,
        ...visit.buyers.map((buyer) => buyer.name),
    ]
        .join(" ")
        .toLowerCase();
    return haystack.includes(needle);
}

function applyFocus(visits: BrokerSiteVisit[], focus?: SummaryFilter) {
    const now = new Date();
    const today = istDateKey(now);
    const tomorrow = istDateKey(new Date(now.getTime() + 86_400_000));
    const weekEnd = new Date(now.getTime() + 7 * 86_400_000).getTime();
    return visits.filter((visit) => {
        const day = istDateKey(visit.startsAt);
        if (focus === "today") return day === today;
        if (focus === "tomorrow") return day === tomorrow;
        if (focus === "awaiting")
            return visit.status === "awaiting_owner" || visit.status === "reschedule_pending";
        if (focus === "feedback")
            return (
                (visit.status === "completed" ||
                    (visit.status === "confirmed" && new Date(visit.startsAt) < new Date())) &&
                !visit.outcome
            );
        if (focus === "week") {
            const startsAt = new Date(visit.startsAt).getTime();
            return startsAt >= now.getTime() && startsAt <= weekEnd;
        }
        if (focus === "cancelled")
            return visit.status === "cancelled_by_owner" || visit.status === "cancelled_by_broker";
        return true;
    });
}

function daySummary(items: BrokerSiteVisit[]) {
    const active = items.filter((visit) => !isVisitCancelled(visit.status));
    const saleTotal = active.reduce(
        (total, visit) =>
            total + (visit.property.purpose === "sale" ? visit.property.amountInr : 0),
        0,
    );
    const visitLabel = `${items.length} ${items.length === 1 ? "visit" : "visits"}`;
    if (active.length === 0) return `${visitLabel} · all cancelled`;
    if (saleTotal <= 0) return visitLabel;
    return `${visitLabel} · ${formatPrice(saleTotal)} in play`;
}

function VisitGroup({
    group,
    onOpen,
    onAction,
}: {
    group: ReturnType<typeof groupVisitsByDay>[number];
    onOpen: (id: string) => void;
    onAction: (action: "outcome" | "reschedule" | "withdraw", id: string) => void;
}) {
    return (
        <section id={`broker-visits-${group.key}`} className="space-y-3">
            <header className="flex flex-wrap items-baseline justify-between gap-2 px-0.5">
                <h3 className="body-sm font-semibold text-ink-muted">
                    {formatVisitDayHeading(group.items[0].startsAt)}
                </h3>
                <span className="body-xs text-ink-muted tabular-nums">
                    {daySummary(group.items)}
                </span>
            </header>
            <div className="space-y-3">
                {group.items.map((visit) => (
                    <VisitCard key={visit.id} visit={visit} onOpen={onOpen} onAction={onAction} />
                ))}
            </div>
        </section>
    );
}

export function MyVisitsTab({
    visits,
    propertyFilters,
    isLoading,
    focus,
    query = "",
    range = "all",
    customFrom = "",
    customTo = "",
    onOpen,
    onAction,
    onBrowseSlots,
    browseLabel,
    onClearQuery,
    onClearRange,
    onClearFocus,
    onClearFilters,
}: {
    visits: BrokerSiteVisit[];
    propertyFilters?: PropertyListCriteria;
    isLoading: boolean;
    focus?: SummaryFilter;
    query?: string;
    range?: SlotDateRange | "all";
    customFrom?: string;
    customTo?: string;
    onOpen: (id: string) => void;
    onAction: (action: "outcome" | "reschedule" | "withdraw", id: string) => void;
    onBrowseSlots: () => void;
    browseLabel?: string;
    onClearQuery?: () => void;
    onClearRange?: () => void;
    onClearFocus?: () => void;
    onClearFilters?: () => void;
}) {
    const [now] = useState(() => new Date());
    const filtered = useMemo(() => {
        const bounds = rangeBounds(range, customFrom, customTo, now);
        return applyFocus(visits, focus).filter((visit) => {
            if (!matchesVisitProperty(visit.property, propertyFilters)) return false;
            if (!matchesQuery(visit, query)) return false;
            if (!bounds) return true;
            const day = istDateKey(visit.startsAt);
            return day >= bounds.from && day <= bounds.to;
        });
    }, [customFrom, customTo, focus, now, query, range, visits, propertyFilters]);
    const groups = useMemo(() => groupVisitsByDay(filtered), [filtered]);
    const chips = useMemo(() => {
        const next: VisitsFilterChip[] = [];
        const propertyCount = propertyCriteriaCount(propertyFilters);
        if (propertyCount && onClearFilters) {
            next.push({
                key: "property",
                label: `Property filters (${propertyCount})`,
                clear: onClearFilters,
            });
        }
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
        if (focus && onClearFocus) {
            next.push({ key: "focus", label: FOCUS_CHIP_LABEL[focus], clear: onClearFocus });
        }
        return next;
    }, [
        customFrom,
        customTo,
        focus,
        onClearFocus,
        onClearQuery,
        onClearRange,
        query,
        range,
        propertyFilters,
        onClearFilters,
    ]);
    const nextVisit = useMemo(
        () =>
            visits
                .filter(
                    (visit) =>
                        !["cancelled_by_broker", "cancelled_by_owner", "expired"].includes(
                            visit.status,
                        ),
                )
                .filter((visit) => new Date(visit.startsAt).getTime() > now.getTime())
                .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0],
        [now, visits],
    );
    const nextVisitDetail = nextVisit
        ? `Next visit is ${istDateKey(nextVisit.startsAt) === istDateKey(addDays(now, 1)) ? "tomorrow" : formatVisitDayHeading(nextVisit.startsAt)} at ${formatVisitTime(nextVisit.startsAt)}, ${nextVisit.property.title}.`
        : undefined;

    if (isLoading && visits.length === 0) return <VisitsTabSkeleton />;
    if (visits.length === 0)
        return <EmptyState kind="no-visits" onPrimary={onBrowseSlots} primary={browseLabel} />;

    return (
        <section className="space-y-4">
            {onClearFilters ? (
                <VisitsFilterChips chips={chips} onClearAll={onClearFilters} />
            ) : null}
            {groups.length === 0 ? (
                <EmptyState
                    kind="no-today"
                    detail={nextVisitDetail}
                    onPrimary={nextVisit ? () => onOpen(nextVisit.id) : undefined}
                />
            ) : filtered.length > 40 ? (
                <VirtualStack
                    items={groups}
                    estimateSize={280}
                    getKey={(group) => group.key}
                    renderItem={(group) => (
                        <VisitGroup group={group} onOpen={onOpen} onAction={onAction} />
                    )}
                />
            ) : (
                <div className="space-y-6">
                    {groups.map((group) => (
                        <VisitGroup
                            key={group.key}
                            group={group}
                            onOpen={onOpen}
                            onAction={onAction}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
