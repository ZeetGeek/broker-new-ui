import { isVisitCancelled } from "@/lib/visits/status";
import { addVisitDays as addDays, istDateKey } from "@/lib/visits/time";
import { visitWeekDays } from "@/lib/visits/time";

import type {
    BrokerSiteVisit,
    BrokerVisitSummary,
    PropertyWithSlots,
    TimeRequest,
} from "@/features/site-visits/broker/model";

export function buildVisitSummary(
    visits: BrokerSiteVisit[],
    properties: PropertyWithSlots[],
    requests: TimeRequest[],
    now = new Date(),
): BrokerVisitSummary {
    const today = istDateKey(now);
    const tomorrow = istDateKey(addDays(now, 1));
    const nowTime = now.getTime();
    const nextWeek = addDays(now, 7).getTime();
    const scheduled = visits.filter((visit) => !isVisitCancelled(visit.status));
    const weekStart = visitWeekDays(today)[0];
    const weekEnd = addDays(weekStart, 7);
    return {
        today: scheduled.filter((visit) => istDateKey(visit.startsAt) === today).length,
        tomorrow: scheduled.filter((visit) => istDateKey(visit.startsAt) === tomorrow).length,
        awaitingOwner: visits.filter(
            (visit) => visit.status === "awaiting_owner" || visit.status === "reschedule_pending",
        ).length,
        needsOutcome: visits.filter(
            (visit) =>
                !visit.outcome &&
                (visit.status === "completed" ||
                    (visit.status === "confirmed" && new Date(visit.startsAt).getTime() < nowTime)),
        ).length,
        weekTotal: scheduled.filter(
            (visit) =>
                new Date(visit.startsAt).getTime() >= nowTime &&
                new Date(visit.startsAt).getTime() <= nextWeek,
        ).length,
        cancelledThisWeek: visits.filter(
            (visit) =>
                (visit.status === "cancelled_by_broker" || visit.status === "cancelled_by_owner") &&
                new Date(visit.startsAt).getTime() >= weekStart.getTime() &&
                new Date(visit.startsAt).getTime() < weekEnd.getTime(),
        ).length,
        openSlots: properties.reduce(
            (total, item) =>
                total +
                item.slots.filter(
                    (slot) =>
                        slot.status === "open" &&
                        slot.bookedCount < slot.capacity &&
                        new Date(slot.startsAt).getTime() > nowTime,
                ).length,
            0,
        ),
        requestReplies: requests.filter(
            (request) => request.status === "pending" || request.status === "counter_offered",
        ).length,
    };
}
