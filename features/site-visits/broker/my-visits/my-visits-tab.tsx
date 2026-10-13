"use client";

import { useMemo, useState } from "react";

import { addDays } from "date-fns";

import { groupVisitsByDay } from "@/lib/visits/grouping";
import { formatVisitDayHeading, formatVisitTime, istDateKey } from "@/lib/visits/time";

import { VirtualStack } from "@/components/shared/virtual-stack";

import type { BrokerSiteVisit, SummaryFilter } from "@/features/site-visits/broker/model";
import { VisitCard } from "@/features/site-visits/broker/my-visits/visit-card";
import { EmptyState, VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";

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
        <section id={`broker-visits-${group.key}`} className="space-y-2">
            <header className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                <h3 className="h6 text-ink">{formatVisitDayHeading(group.items[0].startsAt)}</h3>
                <span className="body-xs text-ink-muted">
                    {group.items.length} {group.items.length === 1 ? "visit" : "visits"} ·{" "}
                    {group.totalLabel} in play
                </span>
            </header>
            <div className="overflow-hidden rounded-card border border-border-warm bg-surface shadow-sm">
                {group.items.map((visit) => (
                    <VisitCard key={visit.id} visit={visit} onOpen={onOpen} onAction={onAction} />
                ))}
            </div>
        </section>
    );
}

export function MyVisitsTab({
    visits,
    isLoading,
    focus,
    onOpen,
    onAction,
    onBrowseSlots,
}: {
    visits: BrokerSiteVisit[];
    isLoading: boolean;
    focus?: SummaryFilter;
    onOpen: (id: string) => void;
    onAction: (action: "outcome" | "reschedule" | "withdraw", id: string) => void;
    onBrowseSlots: () => void;
}) {
    const [now] = useState(() => new Date());
    const filtered = useMemo(() => applyFocus(visits, focus), [focus, visits]);
    const groups = useMemo(() => groupVisitsByDay(filtered), [filtered]);
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
    if (visits.length === 0) return <EmptyState kind="no-visits" onPrimary={onBrowseSlots} />;

    return (
        <section className="space-y-4">
            <div>
                <h2 className="h5 text-ink">Your schedule</h2>
                <p className="body-sm text-ink-muted">
                    Time, travel, buyer and owner details in one place.
                </p>
            </div>

            {groups.length === 0 ? (
                <EmptyState
                    kind="no-today"
                    detail={nextVisitDetail}
                    onPrimary={nextVisit ? () => onOpen(nextVisit.id) : undefined}
                />
            ) : filtered.length > 40 ? (
                <VirtualStack
                    items={groups}
                    estimateSize={340}
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
