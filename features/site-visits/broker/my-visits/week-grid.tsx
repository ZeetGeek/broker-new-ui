"use client";

import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { cn } from "@/lib/utils";
import { DAY_END, DAY_START, VISITS_TIME_ZONE } from "@/lib/visits/constants";
import { VISIT_STATUS } from "@/lib/visits/status";
import { durationMinutes, istDateKey, istDayAsDate } from "@/lib/visits/time";

import type { BrokerSiteVisit } from "@/features/site-visits/broker/model";

function overlaps(a: BrokerSiteVisit, b: BrokerSiteVisit) {
    return new Date(a.startsAt) < new Date(b.endsAt) && new Date(b.startsAt) < new Date(a.endsAt);
}

function overlapLayout(visit: BrokerSiteVisit, visits: BrokerSiteVisit[]) {
    const peers = visits.filter((item) => overlaps(visit, item)).sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id));
    return { column: Math.max(0, peers.findIndex((item) => item.id === visit.id)), columns: Math.max(1, peers.length) };
}

export default function WeekGrid({ visits, onOpen }: { visits: BrokerSiteVisit[]; onOpen: (id: string) => void }) {
    const today = istDayAsDate(new Date());
    const days = Array.from({ length: 7 }, (_, index) => addDays(today, index));
    const rowHeight = 64;
    const hours = Array.from({ length: DAY_END - DAY_START }, (_, index) => DAY_START + index);
    const now = new Date();
    const todayKey = istDateKey(now);
    const currentHour = Number(formatInTimeZone(now, VISITS_TIME_ZONE, "H"));
    const currentMinute = Number(formatInTimeZone(now, VISITS_TIME_ZONE, "m"));
    const currentTop = ((currentHour - DAY_START) * 60 + currentMinute) / 60 * rowHeight;

    return (
        <div className="overflow-x-auto rounded-card border border-border-warm bg-surface">
            <div className="grid grid-cols-[64px_repeat(7,minmax(110px,1fr))] min-inline-[860px]">
                <div className="
                  sticky inset-s-0 z-20 border-e border-be border-border-warm bg-surface
                " />
                {days.map((day) => <div key={istDateKey(day)} className="
                  border-e border-be border-border-warm px-2 py-3 text-center
                "><span className="body-xs block text-ink-muted">{formatInTimeZone(day, VISITS_TIME_ZONE, "EEE")}</span><span className="
                  body-sm tabular font-bold text-ink
                ">{formatInTimeZone(day, VISITS_TIME_ZONE, "d MMM")}</span></div>)}
                <div className="sticky inset-s-0 z-10 bg-surface">
                    {hours.map((hour) => <div key={hour} style={{ height: rowHeight }} className="
                      tabular border-e border-be border-border-warm pe-2 pbs-1 text-end text-[10px]
                      text-ink-subtle
                    ">{formatInTimeZone(new Date(Date.UTC(2026, 0, 1, hour - 5, 30)), VISITS_TIME_ZONE, "h a")}</div>)}
                </div>
                {days.map((day) => {
                    const key = istDateKey(day);
                    const dayVisits = visits.filter((visit) => istDateKey(visit.startsAt) === key);
                    return <div key={key} className="relative border-e border-border-warm" style={{ height: hours.length * rowHeight }}>
                        {hours.map((hour) => <div key={hour} style={{ height: rowHeight }} className="
                          border-be border-border-warm
                        " />)}
                        {key === todayKey && currentHour >= DAY_START && currentHour < DAY_END ? <div aria-label={`Current time ${formatInTimeZone(now, VISITS_TIME_ZONE, "h:mm a")}`} className="
                          pointer-events-none absolute inset-x-0 z-20 border-bs-2 border-urgent
                        " style={{ top: currentTop }}><span className="sr-only">Current time</span></div> : null}
                        {dayVisits.map((visit) => {
                            const hour = Number(formatInTimeZone(visit.startsAt, VISITS_TIME_ZONE, "H"));
                            const minute = Number(formatInTimeZone(visit.startsAt, VISITS_TIME_ZONE, "m"));
                            const top = ((hour - DAY_START) * 60 + minute) / 60 * rowHeight;
                            const height = Math.max(44, durationMinutes(visit.startsAt, visit.endsAt) / 60 * rowHeight);
                            const status = VISIT_STATUS[visit.status];
                            const layout = overlapLayout(visit, dayVisits);
                            const width = 96 / layout.columns;
                            return <button key={visit.id} type="button" onClick={() => onOpen(visit.id)} style={{ top, height, insetInlineStart: `calc(${layout.column * width}% + 3px)`, width: `calc(${width}% - 5px)` }} className={cn(`
                              absolute overflow-hidden rounded-[9px] border bg-brand-soft p-1.5
                              text-start text-[10px] leading-tight text-brand-text shadow-xs
                              hover:bg-brand-soft-hover
                              focus-visible:ring-2 focus-visible:ring-brand
                            `, status.tone)}>
                                <span className="tabular block font-bold">{formatInTimeZone(visit.startsAt, VISITS_TIME_ZONE, "h:mm a")}</span><span className="
                                  block truncate font-semibold
                                ">{visit.property.title}</span><span className="block truncate">{visit.buyers[0].name.split(" ")[0]}</span>
                            </button>;
                        })}
                    </div>;
                })}
            </div>
        </div>
    );
}

