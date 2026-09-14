"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { addDays } from "date-fns";
import { CalendarRange, List, Map as MapIcon, Route } from "lucide-react";

import { cn } from "@/lib/utils";
import { groupVisitsByDay } from "@/lib/visits/grouping";
import { formatVisitDayHeading, formatVisitTime, istDateKey } from "@/lib/visits/time";

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
    const now = new Date();
    const today = istDateKey(now);
    const tomorrow = istDateKey(new Date(now.getTime() + 86_400_000));
    const weekEnd = new Date(now.getTime() + 7 * 86_400_000).getTime();
    return visits.filter((visit) => {
        const day = istDateKey(visit.startsAt);
        if (focus === "today") return day === today;
        if (focus === "tomorrow") return day === tomorrow;
        if (focus === "awaiting") return visit.status === "awaiting_owner" || visit.status === "reschedule_pending";
        if (focus === "feedback") return (visit.status === "completed" || (visit.status === "confirmed" && new Date(visit.startsAt) < new Date())) && !visit.outcome;
        if (focus === "week") {
            const startsAt = new Date(visit.startsAt).getTime();
            return startsAt >= now.getTime() && startsAt <= weekEnd;
        }
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
    const [now] = useState(() => new Date());
    const today = istDateKey(now);
    const filtered = useMemo(() => applyFocus(visits, focus).filter((visit) => past ? istDateKey(visit.startsAt) < today : istDateKey(visit.startsAt) >= today), [focus, past, today, visits]);
    const groups = useMemo(() => groupVisitsByDay(filtered), [filtered]);
    const nextVisit = useMemo(() => visits.filter((visit) => !["cancelled_by_broker", "cancelled_by_owner", "expired"].includes(visit.status)).filter((visit) => new Date(visit.startsAt).getTime() > now.getTime()).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0], [now, visits]);
    const nextVisitDetail = nextVisit ? `Next visit is ${istDateKey(nextVisit.startsAt) === istDateKey(addDays(now, 1)) ? "tomorrow" : formatVisitDayHeading(nextVisit.startsAt)} at ${formatVisitTime(nextVisit.startsAt)}, ${nextVisit.property.title}.` : undefined;
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
            const current = new Date(`${activeDay}T00:00:00+05:30`);
            selectDay(istDateKey(addDays(current, direction)));
        };
        window.addEventListener("site-visits-day-step", onStep);
        return () => window.removeEventListener("site-visits-day-step", onStep);
    });

    useEffect(() => {
        if (initialView !== "list" || groups.length === 0) return;
        const observer = new IntersectionObserver((entries) => {
            const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            const day = visible?.target.getAttribute("data-visit-day");
            if (day) setActiveDay(day);
        }, { rootMargin: "-18% 0px -70% 0px", threshold: 0 });
        const sections = document.querySelectorAll<HTMLElement>("[data-visit-day]");
        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, [groups, initialView]);

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
                      font-semibold text-ink-muted min-block-12
                      md:min-block-9
                    `, initialView === item.id && `bg-brand-ink text-surface`)}><item.icon aria-hidden className="
                      block-3.5 inline-3.5
                    " />{item.label}</button>)}
                </div>
            </div>

            {initialView === "week" ? <WeekGrid visits={filtered} onOpen={onOpen} /> : initialView === "route" ? <RouteView visits={filtered.filter((visit) => istDateKey(visit.startsAt) === activeDay)} onOpen={onOpen} /> : (
                <div className="grid gap-4 md:grid-cols-[132px_minmax(0,1fr)]">
                    <DayRail counts={counts} activeDay={activeDay} past={past} onSelect={selectDay} onTogglePast={() => setPast((value) => !value)} />
                    <div className="space-y-6 min-inline-0">
                        {groups.length === 0 ? <EmptyState kind="no-today" detail={nextVisitDetail} onPrimary={() => nextVisit && onOpen(nextVisit.id)} /> : filtered.length > 40 ? <VirtualStack items={groups} estimateSize={380} getKey={(group) => group.key} renderItem={(group) => <section id={`broker-visits-${group.key}`} data-visit-day={group.key} className="
                          space-y-3
                        "><header className="
                          sticky inset-bs-14 z-20 border-be border-border-warm bg-canvas py-2
                          md:inset-bs-0
                        "><h3 className="h6 text-ink">{formatVisitDayHeading(group.items[0].startsAt)}</h3><p className="
                          body-xs text-ink-muted
                        ">{group.items.length} {group.items.length === 1 ? "visit" : "visits"} · {group.totalLabel} in play</p></header>{group.items.map((visit) => <VisitCard key={visit.id} visit={visit} onOpen={onOpen} onAction={onAction} />)}</section>} /> : groups.map((group) => (
                            <section key={group.key} id={`broker-visits-${group.key}`} data-visit-day={group.key} className="
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
