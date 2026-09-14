import "server-only";

import { cookies } from "next/headers";

import { buildVisitSummary } from "@/lib/visits/summary";

import { API_URL } from "@/config";
import type { BrokerSiteVisit, BrokerVisitSummary, PropertyWithSlots, SlotListFilters, TimeRequest, VisitListFilters } from "@/features/site-visits/broker/model";
import { MOCK_PROPERTIES_WITH_SLOTS, MOCK_SITE_VISITS, MOCK_TIME_REQUESTS, USE_MOCK_VISITS } from "@/mocks/visits";

function appendListFilters(params: URLSearchParams, filters: VisitListFilters) {
    if (filters.buyerId) params.set("buyerId", filters.buyerId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    filters.status?.forEach((status) => params.append("status[]", status));
}

function appendSlotFilters(params: URLSearchParams, filters: SlotListFilters) {
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.buyerId) params.set("buyerId", filters.buyerId);
    if (filters.q) params.set("q", filters.q);
    filters.localities?.forEach((value) => params.append("localities[]", value));
    filters.timeBuckets?.forEach((value) => params.append("timeBuckets[]", value));
    if (filters.purpose) params.set("purpose", filters.purpose);
    if (filters.propertyType) params.set("type", filters.propertyType);
    if (filters.bhk) params.set("bhk", filters.bhk);
    if (filters.minBudget) params.set("minBudget", String(filters.minBudget));
    if (filters.maxBudget) params.set("maxBudget", String(filters.maxBudget));
    if (filters.ownerId) params.set("owner", filters.ownerId);
}

async function serverGet<T>(path: string): Promise<T> {
    const cookieStore = await cookies();
    const response = await fetch(`${API_URL}${path}`, { headers: { cookie: cookieStore.toString() }, cache: "no-store" });
    if (!response.ok) throw new Error(`Initial visit data failed (${response.status})`);
    const payload = await response.json() as T | { data: T };
    return typeof payload === "object" && payload !== null && "data" in payload ? (payload as { data: T }).data : payload;
}

export async function getInitialBrokerVisits(visitFilters: VisitListFilters, slotFilters: SlotListFilters): Promise<{ visits: BrokerSiteVisit[]; slots: PropertyWithSlots[]; requests: TimeRequest[]; summary: BrokerVisitSummary }> {
    if (USE_MOCK_VISITS) {
        const visits = structuredClone(MOCK_SITE_VISITS);
        const slots = structuredClone(MOCK_PROPERTIES_WITH_SLOTS);
        const requests = structuredClone(MOCK_TIME_REQUESTS);
        return { visits, slots, requests, summary: buildVisitSummary(visits, slots, requests) };
    }
    const visitParams = new URLSearchParams();
    appendListFilters(visitParams, visitFilters);
    const slotParams = new URLSearchParams();
    appendSlotFilters(slotParams, slotFilters);
    const [visits, slots, requests, summary] = await Promise.all([
        serverGet<BrokerSiteVisit[]>(`/api/broker/visits?${visitParams}`),
        serverGet<PropertyWithSlots[]>(`/api/broker/slots?${slotParams}`),
        serverGet<TimeRequest[]>("/api/broker/time-requests"),
        serverGet<BrokerVisitSummary>("/api/broker/visits/summary"),
    ]);
    return { visits, slots, requests, summary };
}
