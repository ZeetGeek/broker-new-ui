"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { addDays } from "date-fns";
import { CalendarRange, List, Map as MapIcon, MapPin, Navigation, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { groupVisitsByDay } from "@/lib/visits/grouping";
import { VISIT_STATUS } from "@/lib/visits/status";
import { formatVisitDayHeading, formatVisitTime, istDateKey } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { IconSegmentedToggle } from "@/components/shared/icon-segmented-toggle";
import { VirtualStack } from "@/components/shared/virtual-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { BrokerSiteVisit, SummaryFilter } from "@/features/site-visits/broker/model";
import { DayRail } from "@/features/site-visits/broker/my-visits/day-rail";
import { VisitCard } from "@/features/site-visits/broker/my-visits/visit-card";
import { EmptyState, VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";

const WeekGrid = dynamic(() => import("@/features/site-visits/broker/my-visits/week-grid"), { loading: () => <VisitsTabSkeleton /> });
const RouteView = dynamic(() => import("@/features/site-visits/broker/my-visits/route-view"), { loading: () => <VisitsTabSkeleton /> });

type VisitsView = "list" | "week" | "route";

const VIEW_OPTIONS = [
    { value: "list", label: "List view", icon: List },
    { value: "week", label: "Week view", icon: CalendarRange },
    { value: "route", label: "Route view", icon: MapIcon },
] as const;

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

function NextVisitSpotlight({ visit, onOpen }: { visit: BrokerSiteVisit; onOpen: (id: string) => void }) {
    const status = VISIT_STATUS[visit.status];
    const StatusIcon = status.icon;
    const mapHref = visit.property.latitude && visit.property.longitude
        ? `https://www.openstreetmap.org/directions?to=${visit.property.latitude},${visit.property.longitude}`
        : `https://www.openstreetmap.org/search?query=${encodeURIComponent(visit.property.address)}`;

    return (
        <article className="rounded-card bg-brand-deep p-4 text-surface md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="eyebrow text-surface/65">Next visit</p>
                <Badge variant="outline" className="border-surface/15 bg-surface/10 text-surface">
                    <StatusIcon aria-hidden />
                    {status.label}
                </Badge>
            </div>
            <div className="mbs-4 grid gap-4 md:grid-cols-[80px_minmax(0,1fr)_auto] md:items-center">
                <div className="relative overflow-hidden rounded-inner bg-surface/10 block-16 inline-20">
                    <AppImage src={visit.property.coverUrl ?? "/properties/1.jpg"} alt="" fill sizes="80px" />
                </div>
                <div className="min-inline-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p className="h4 tabular-nums text-surface">{formatVisitTime(visit.startsAt)}</p>
                        <p className="body-sm text-surface/65">{formatVisitDayHeading(visit.startsAt)}</p>
                    </div>
                    <h2 className="h6 mbs-1 truncate text-surface">{visit.property.title}</h2>
                    <p className="body-xs mbs-1 flex items-center gap-1.5 text-surface/65">
                        <MapPin aria-hidden className="block-3.5 inline-3.5" />
                        {visit.property.locality}
                        <span aria-hidden>·</span>
                        {visit.driveMinutes ?? "—"} min away
                    </p>
                    <p className="body-xs mbs-2 flex items-center gap-1.5 text-surface/65">
                        <Users aria-hidden className="block-3.5 inline-3.5" />
                        {visit.buyers[0].name} with {visit.owner.name}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:flex">
                    <Button nativeButton={false} render={<a href={mapHref} target="_blank" rel="noreferrer" />} variant="highlight-outline" size="md">
                        <Navigation aria-hidden />
                        Directions
                    </Button>
                    <Button type="button" variant="highlight" size="md" onClick={() => onOpen(visit.id)}>
                        Open visit
                    </Button>
                </div>
            </div>
        </article>
    );
}

function VisitGroup({ group, onOpen, onAction }: {
    group: ReturnType<typeof groupVisitsByDay>[number];
    onOpen: (id: string) => void;
    onAction: (action: "outcome" | "reschedule" | "withdraw", id: string) => void;
}) {
    return (
        <section id={`broker-visits-${group.key}`} data-visit-day={group.key} className="scroll-mbs-40 space-y-2">
            <header className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                <h3 className="h6 text-ink">{formatVisitDayHeading(group.items[0].startsAt)}</h3>
                <span className="body-xs text-ink-muted">
                    {group.items.length} {group.items.length === 1 ? "visit" : "visits"} · {group.totalLabel} in play
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
    const [activeDay, setActiveDay] = useState(today);

    const selectDay = useCallback((day: string) => {
        setActiveDay(day);
        document.getElementById(`broker-visits-${day}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    useEffect(() => {
        const onStep = (event: Event) => {
            const direction = (event as CustomEvent<number>).detail;
            const current = new Date(`${activeDay}T00:00:00+05:30`);
            selectDay(istDateKey(addDays(current, direction)));
        };
        window.addEventListener("site-visits-day-step", onStep);
        return () => window.removeEventListener("site-visits-day-step", onStep);
    }, [activeDay, selectDay]);

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
                <div>
                    <h2 className="h5 text-ink">Your schedule</h2>
                    <p className="body-sm text-ink-muted">Time, travel, buyer and owner details in one place.</p>
                </div>
                <IconSegmentedToggle value={initialView} onValueChange={onViewChange} options={VIEW_OPTIONS} ariaLabel="Visit view" />
            </div>

            {!past && nextVisit ? <NextVisitSpotlight visit={nextVisit} onOpen={onOpen} /> : null}

            <DayRail counts={counts} activeDay={activeDay} past={past} onSelect={selectDay} onTogglePast={() => setPast((value) => !value)} />

            {initialView === "week" ? (
                <WeekGrid visits={filtered} onOpen={onOpen} />
            ) : initialView === "route" ? (
                <RouteView visits={filtered.filter((visit) => istDateKey(visit.startsAt) === activeDay)} onOpen={onOpen} />
            ) : groups.length === 0 ? (
                <EmptyState kind="no-today" detail={nextVisitDetail} onPrimary={nextVisit ? () => onOpen(nextVisit.id) : undefined} />
            ) : filtered.length > 40 ? (
                <VirtualStack items={groups} estimateSize={340} getKey={(group) => group.key} renderItem={(group) => <VisitGroup group={group} onOpen={onOpen} onAction={onAction} />} />
            ) : (
                <div className="space-y-6">
                    {groups.map((group) => <VisitGroup key={group.key} group={group} onOpen={onOpen} onAction={onAction} />)}
                </div>
            )}
        </section>
    );
}
