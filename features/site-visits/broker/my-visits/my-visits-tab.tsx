"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { CalendarRange, List, Map as MapIcon, Route } from "lucide-react";

import { cn } from "@/lib/utils";
import { groupVisitsByDay } from "@/lib/visits/grouping";
import { formatVisitDayHeading, istDateKey } from "@/lib/visits/time";

import { VirtualStack } from "@/components/shared/virtual-stack";
import { Button } from "@/components/ui/button";

import type { BrokerSiteVisit, SummaryFilter } from "@/features/site-visits/broker/model";
import { DayRail } from "@/features/site-visits/broker/my-visits/day-rail";
import { VisitCard } from "@/features/site-visits/broker/my-visits/visit-card";
import { EmptyState, VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";

const WeekGrid = dynamic(() => import("@/features/site-visits/broker/my-visits/week-grid"), { loading: () => <VisitsTabSkeleton /> });
const RouteView = dynamic(() => import("@/features/site-visits/broker/my-visits/route-view"), { loading: () => <VisitsTabSkeleton /> });

type VisitsView = "list" | "week" | "route";

function applyFocus(visits: BrokerSiteVisit[], focus?: SummaryFilter) {
    const today = istDateKey(new Date());
    const tomorrow = istDateKey(new Date(Date.now() + 86_400_000));
    return visits.filter((visit) => {
        const day = istDateKey(visit.startsAt);
        if (focus === "today") return day === today;
        if (focus === "tomorrow") return day === tomorrow;
        if (focus === "awaiting") return visit.status === "awaiting_owner" || visit.status === "reschedule_pending";
        if (focus === "feedback") return (visit.status === "completed" || (visit.status === "confirmed" && new Date(visit.startsAt) < new Date())) && !visit.outcome;
        if (focus === "cancelled") return visit.status === "cancelled_by_owner" || visit.status === "cancelled_by_broker";
        return true;
    });
}

export function MyVisitsTab({
    visits,
    isLoading,
    focus,
    initialView,
    onViewChange,
    onOpen,
    onAction,
    onBrowseSlots,
}: {
    visits: BrokerSiteVisit[];
    isLoading: boolean;
    focus?: SummaryFilter;
    initialView: VisitsView;
    onViewChange: (view: VisitsView) => void;
    onOpen: (id: string) => void;
    onAction: (action: "outcome" | "reschedule" | "withdraw", id: string) => void;
    onBrowseSlots: () => void;
}) {
    const [past, setPast] = useState(false);
    const today = istDateKey(new Date());
    const filtered = useMemo(() => applyFocus(visits, focus).filter((visit) => past ? istDateKey(visit.startsAt) < today : istDateKey(visit.startsAt) >= today), [focus, past, today, visits]);
    const groups = useMemo(() => groupVisitsByDay(filtered), [filtered]);
    const counts = useMemo(() => {
        const map = new Map<string, number>();
        for (const visit of visits) map.set(istDateKey(visit.startsAt), (map.get(istDateKey(visit.startsAt)) ?? 0) + 1);
        return map;
    }, [visits]);
    const [activeDay, setActiveDay] = useState(istDateKey(new Date()));

    const selectDay = (day: string) => {
        setActiveDay(day);
        document.getElementById(`broker-visits-${day}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    useEffect(() => {
        const onStep = (event: Event) => {
            const direction = (event as CustomEvent<number>).detail;
            const ordered = [...counts.keys()].sort();
            const current = Math.max(0, ordered.indexOf(activeDay));
            const next = ordered[Math.max(0, Math.min(ordered.length - 1, current + direction))];
            if (next) selectDay(next);
        };
        window.addEventListener("site-visits-day-step", onStep);
        return () => window.removeEventListener("site-visits-day-step", onStep);
    });

    if (isLoading && visits.length === 0) return <VisitsTabSkeleton />;
    if (visits.length === 0) return <EmptyState kind="no-visits" onPrimary={onBrowseSlots} />;

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="h5 text-ink">Your visit day</h2><p className="
                  body-xs text-ink-muted
                ">Buyer, owner, property and travel time in one line of sight.</p></div>
                <div className="
                  inline-grid grid-cols-3 rounded-control border border-border-warm bg-surface p-1
                ">
                    {([{ id: "list", label: "List", icon: List }, { id: "week", label: "Week", icon: CalendarRange }, { id: "route", label: "Route", icon: MapIcon }] as const).map((item) => <button key={item.id} type="button" aria-pressed={initialView === item.id} onClick={() => onViewChange(item.id)} className={cn(`
                      body-xs flex items-center justify-center gap-1.5 rounded-[9px] px-3
                      font-semibold text-ink-muted min-block-9
                    `, initialView === item.id && `bg-brand-ink text-surface`)}><item.icon aria-hidden className="
                      block-3.5 inline-3.5
                    " />{item.label}</button>)}
                </div>
            </div>

            {initialView === "week" ? <WeekGrid visits={filtered} onOpen={onOpen} /> : initialView === "route" ? <RouteView visits={filtered.filter((visit) => istDateKey(visit.startsAt) === activeDay)} onOpen={onOpen} /> : (
                <div className="grid gap-4 md:grid-cols-[132px_minmax(0,1fr)]">
                    <DayRail counts={counts} activeDay={activeDay} past={past} onSelect={selectDay} onTogglePast={() => setPast((value) => !value)} />
                    <div className="space-y-6 min-inline-0">
                        {groups.length === 0 ? <EmptyState kind="no-today" onPrimary={() => setActiveDay(groups[0]?.key ?? activeDay)} /> : filtered.length > 40 ? <VirtualStack items={filtered} estimateSize={330} getKey={(visit) => visit.id} renderItem={(visit, index) => <div><header className="
                          mbe-2 border-be border-border-warm bg-canvas py-2
                        "><h3 className="h6 text-ink">{index === 0 || istDateKey(filtered[index - 1].startsAt) !== istDateKey(visit.startsAt) ? formatVisitDayHeading(visit.startsAt) : <span className="
                          sr-only
                        ">Same day</span>}</h3></header><VisitCard visit={visit} onOpen={onOpen} onAction={onAction} /></div>} /> : groups.map((group) => (
                            <section key={group.key} id={`broker-visits-${group.key}`} className="
                              scroll-mbs-24 space-y-3
                            ">
                                <header className="
                                  sticky inset-bs-14 z-20 flex flex-wrap items-baseline gap-x-2
                                  gap-y-1 border-be border-border-warm bg-canvas/95 py-2
                                  backdrop-blur-sm
                                  md:inset-bs-0
                                ">
                                    <h3 className="h6 text-ink">{formatVisitDayHeading(group.items[0].startsAt)}</h3>
                                    <span className="body-xs text-ink-muted">{group.items.length} {group.items.length === 1 ? "visit" : "visits"} · {group.totalLabel} in play</span>
                                </header>
                                {group.items.map((visit) => <VisitCard key={visit.id} visit={visit} onOpen={onOpen} onAction={onAction} />)}
                            </section>
                        ))}
                    </div>
                </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setPast((value) => !value)} className="
              md:hidden
            "><Route aria-hidden />{past ? "Upcoming visits" : "Past visits"}</Button>
        </section>
    );
}
