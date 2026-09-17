import "server-only";

import { buildVisitSummary } from "@/lib/visits/summary";

import type {
    BrokerSiteVisit,
    BrokerVisitSummary,
    PropertyWithSlots,
    SlotListFilters,
    TimeRequest,
    VisitListFilters,
} from "@/features/site-visits/broker/model";
import {
    MOCK_PROPERTIES_WITH_SLOTS,
    MOCK_SITE_VISITS,
    MOCK_TIME_REQUESTS,
    USE_MOCK_VISITS,
} from "@/mocks/visits";

/**
 * SSR seed for React Query. Live visits load on the client with the browser
 * session (cookie + refresh). Mocks still hydrate immediately for design mode.
 */
export async function getInitialBrokerVisits(
    _visitFilters: VisitListFilters,
    _slotFilters: SlotListFilters,
): Promise<{
    visits: BrokerSiteVisit[];
    slots: PropertyWithSlots[];
    requests: TimeRequest[];
    summary: BrokerVisitSummary;
}> {
    if (USE_MOCK_VISITS) {
        const visits = structuredClone(MOCK_SITE_VISITS);
        const slots = structuredClone(MOCK_PROPERTIES_WITH_SLOTS);
        const requests = structuredClone(MOCK_TIME_REQUESTS);
        return { visits, slots, requests, summary: buildVisitSummary(visits, slots, requests) };
    }
    return {
        visits: [],
        slots: [],
        requests: [],
        summary: buildVisitSummary([], [], []),
    };
}
