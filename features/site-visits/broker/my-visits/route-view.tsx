"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { AlertTriangle, Route } from "lucide-react";

import { formatVisitTime } from "@/lib/visits/time";

import { Button } from "@/components/ui/button";

import type { BrokerSiteVisit } from "@/features/site-visits/broker/model";

const RouteMap = dynamic(() => import("@/features/site-visits/broker/my-visits/route-map"), { ssr: false, loading: () => <div className="
  animate-pulse bg-surface-muted block-full inline-full
" /> });

function minutesBetween(a: BrokerSiteVisit, b: BrokerSiteVisit) {
    return Math.round((new Date(b.startsAt).getTime() - new Date(a.endsAt).getTime()) / 60_000);
}

function distanceBetween(a: BrokerSiteVisit["property"], b: BrokerSiteVisit["property"]) {
    if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return Infinity;
    const radians = (value: number) => value * Math.PI / 180;
    const latitudeDelta = radians(b.latitude - a.latitude);
    const longitudeDelta = radians(b.longitude - a.longitude);
    const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function estimatedRouteMinutes(visits: BrokerSiteVisit[]) {
    const minutes = visits.slice(1).reduce((total, visit, index) => {
        const distance = distanceBetween(visits[index].property, visit.property);
        return Number.isFinite(distance) ? total + distance * 1.25 * 2.4 : total;
    }, 0);
    return Math.round(minutes);
}

export default function RouteView({ visits, onOpen }: { visits: BrokerSiteVisit[]; onOpen: (id: string) => void }) {
    const [suggested, setSuggested] = useState(false);
    const chronological = useMemo(() => [...visits].sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [visits]);
    const bestOrder = useMemo(() => {
        if (chronological.length < 3) return chronological;
        const remaining = chronological.slice(1);
        const result = [chronological[0]];
        while (remaining.length) {
            const last = result[result.length - 1].property;
            const nextIndex = remaining.reduce((best, candidate, index) => distanceBetween(last, candidate.property) < distanceBetween(last, remaining[best].property) ? index : best, 0);
            result.push(remaining.splice(nextIndex, 1)[0]);
        }
        return result;
    }, [chronological]);
    const ordered = suggested ? bestOrder : chronological;
    const estimatedSaving = Math.max(0, estimatedRouteMinutes(chronological) - estimatedRouteMinutes(bestOrder));
    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)]">
            <div className="rounded-card border border-border-warm bg-surface p-4">
                <div className="mbe-4 flex items-center justify-between gap-3"><div><h2 className="
                  h5 text-ink
                ">Today’s route</h2><p className="body-xs text-ink-muted">{suggested ? `Suggested order · saves about ${estimatedSaving} min · bookings unchanged` : "Time order · suggestions never change bookings"}</p></div><Button variant="surface" size="md" onClick={() => setSuggested((value) => !value)}><Route aria-hidden /> {suggested ? "Time order" : "Best order"}</Button></div>
                <ol className="space-y-0">
                    {ordered.map((visit, index) => {
                        const previous = ordered[index - 1];
                        const gap = previous ? minutesBetween(previous, visit) : null;
                        const drive = visit.driveMinutes ?? 0;
                        const tight = gap != null && gap < drive + 10;
                        const distance = visit.distanceKm == null ? "Distance unavailable" : `${visit.distanceKm.toFixed(1)} km`;
                        return <li key={visit.id}>
                            {previous ? <div className={`ms-5 border-s border-dashed py-3 ps-6 ${tight ? `
                              border-pending
                            ` : `border-border-warm`}`}><div className={`
                              body-xs flex items-start gap-2 rounded-inner px-3 py-2
                              ${tight ? `bg-urgent-soft text-pending` : `
                                bg-surface-muted text-ink-muted
                              `}`}>{tight ? <AlertTriangle aria-hidden className="
                                mbs-0.5 shrink-0 block-4 inline-4
                              " /> : <Route aria-hidden className="
                                mbs-0.5 shrink-0 block-4 inline-4
                              " />}<span>{tight ? `Only ${gap} min gap, ${distance}, drive takes ${drive} min` : `${distance} · ${drive} min drive`}</span></div></div> : null}
                            <button type="button" onClick={() => onOpen(visit.id)} className="
                              flex items-center gap-3 rounded-inner p-2 text-start inline-full
                              min-block-12
                              hover:bg-surface-muted
                              focus-visible:ring-3 focus-visible:ring-brand/25
                            "><span className="
                              grid shrink-0 place-items-center rounded-full bg-brand-ink text-xs
                              font-bold text-surface block-10 inline-10
                            ">{index + 1}</span><span className="min-inline-0"><span className="
                              tabular block font-bold text-ink
                            ">{formatVisitTime(visit.startsAt)}</span><span className="
                              body-sm block truncate font-semibold text-ink
                            ">{visit.property.title}</span><span className="
                              body-xs block truncate text-ink-muted
                            ">{visit.property.locality} · {visit.buyers[0].name}</span></span></button>
                        </li>;
                    })}
                </ol>
            </div>
            <div className="
              relative overflow-hidden rounded-card border border-border-warm bg-brand-soft
              min-block-[360px]
            "><RouteMap visits={ordered} /></div>
        </div>
    );
}
