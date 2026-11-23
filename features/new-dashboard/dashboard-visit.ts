import { formatInTimeZone } from "date-fns-tz";

import type { BrokerVisit } from "@/lib/api/site-visits";
import { formatDurationUntil } from "@/lib/format/date";
import { istDateKey } from "@/lib/visits/time";

import { visitState } from "@/features/new-site-visits/model";

export type DashboardVisitPhase = "upcoming" | "running" | "needs_update";

/** Where an unmarked visit sits on the dashboard; null once marked or cancelled. */
export function dashboardVisitPhase(visit: BrokerVisit, now: number): DashboardVisitPhase | null {
    const state = visitState(visit, now);
    return state === "upcoming" || state === "running" || state === "needs_update" ? state : null;
}

/**
 * Today's visits by phase. Needs update also takes unmarked visits from
 * earlier days, newest first, so the count matches the Visits page.
 */
export function groupDashboardVisits(
    today: readonly BrokerVisit[],
    needsUpdate: readonly BrokerVisit[],
    now: number,
): Record<DashboardVisitPhase, BrokerVisit[]> {
    const groups: Record<DashboardVisitPhase, BrokerVisit[]> = {
        upcoming: [],
        running: [],
        needs_update: [],
    };
    const seen = new Set<string>();
    for (const visit of [...today, ...needsUpdate]) {
        if (seen.has(visit.id)) continue;
        const phase = dashboardVisitPhase(visit, now);
        if (!phase) continue;
        seen.add(visit.id);
        groups[phase].push(visit);
    }
    groups.upcoming.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    groups.running.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    groups.needs_update.sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
    return groups;
}

/** The needs-update list is capped; its API total counts every unmarked visit. */
export function needsUpdateCount(listed: number, apiTotal: number | undefined): number {
    return Math.max(listed, apiTotal ?? 0);
}

const VISIT_TIME_ZONE = "Asia/Kolkata";

/** `12:30–1:15 PM` — drops the first AM/PM when both ends share it. */
export function visitTimeRange(visit: Pick<BrokerVisit, "startsAt" | "endsAt">): string {
    const start = formatInTimeZone(visit.startsAt, VISIT_TIME_ZONE, "h:mm a");
    const end = formatInTimeZone(visit.endsAt, VISIT_TIME_ZONE, "h:mm a");
    return `${start.endsWith(end.slice(-2)) ? start.slice(0, -3) : start}–${end}`;
}

/** The time range, prefixed with the day when the visit is not today. */
export function visitWhenLabel(visit: Pick<BrokerVisit, "startsAt" | "endsAt">, now: Date): string {
    const range = visitTimeRange(visit);
    return istDateKey(visit.startsAt) === istDateKey(now)
        ? range
        : `${formatInTimeZone(visit.startsAt, VISIT_TIME_ZONE, "EEE d MMM")} · ${range}`;
}

/** Status line from the clock, so a card never lags behind a visit that just began. */
export function visitStatusLabel(visit: BrokerVisit, now: Date): string {
    const phase = dashboardVisitPhase(visit, now.getTime());
    if (phase === "needs_update") return "Ended · needs update";
    if (phase === "running") return "Happening now";
    return `Starts ${formatDurationUntil(new Date(visit.startsAt), now).label}`;
}

/** A copy of `ids` with `id` added or removed. */
export function withBusy(ids: ReadonlySet<string>, id: string, busy: boolean): Set<string> {
    const next = new Set(ids);
    if (busy) next.add(id);
    else next.delete(id);
    return next;
}
