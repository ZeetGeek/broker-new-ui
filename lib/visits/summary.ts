import { addDays } from "date-fns";

import { istDateKey } from "@/lib/visits/time";

import type { BrokerSiteVisit, BrokerVisitSummary, PropertyWithSlots, TimeRequest } from "@/features/site-visits/broker/model";

export function buildVisitSummary(visits: BrokerSiteVisit[], properties: PropertyWithSlots[], requests: TimeRequest[], now = new Date()): BrokerVisitSummary {
    const today = istDateKey(now);
    const tomorrow = istDateKey(addDays(now, 1));
    const nowTime = now.getTime();
    const nextWeek = addDays(now, 7).getTime();
    return {
        today: visits.filter((visit) => istDateKey(visit.startsAt) === today).length,
        tomorrow: visits.filter((visit) => istDateKey(visit.startsAt) === tomorrow).length,
        awaitingOwner: visits.filter((visit) => visit.status === "awaiting_owner" || visit.status === "reschedule_pending").length,
        needsOutcome: visits.filter((visit) => !visit.outcome && (visit.status === "completed" || (visit.status === "confirmed" && new Date(visit.startsAt).getTime() < nowTime))).length,
        weekTotal: visits.filter((visit) => new Date(visit.startsAt).getTime() >= nowTime && new Date(visit.startsAt).getTime() <= nextWeek).length,
        cancelledThisWeek: visits.filter((visit) => (visit.status === "cancelled_by_broker" || visit.status === "cancelled_by_owner") && new Date(visit.startsAt).getTime() >= nowTime && new Date(visit.startsAt).getTime() <= nextWeek).length,
        openSlots: properties.reduce((total, item) => total + item.slots.filter((slot) => slot.status === "open" && slot.bookedCount < slot.capacity && new Date(slot.startsAt).getTime() > nowTime).length, 0),
        requestReplies: requests.filter((request) => request.status === "pending" || request.status === "counter_offered").length,
    };
}
