import { ApiError, apiFetch } from "@/lib/api/client";
import { buildVisitSummary } from "@/lib/visits/summary";

import type { BrokerSiteVisit, BrokerVisitSummary, OutcomeTransactionResult, PersonSummary, PropertyWithSlots, SlotListFilters, TimeRequest, VisitListFilters, VisitSlot } from "@/features/site-visits/broker/model";
import { MOCK_PROPERTIES_WITH_SLOTS, MOCK_SITE_VISITS, MOCK_TIME_REQUESTS, USE_MOCK_VISITS } from "@/mocks/visits";

function unwrapData<T>(payload: T | { data: T }): T {
    return typeof payload === "object" && payload !== null && "data" in payload ? (payload as { data: T }).data : payload;
}

async function requestData<T>(url: string, method: "GET" | "POST" | "PATCH" = "GET", body?: unknown): Promise<T> {
    const payload = await apiFetch<T | { data: T }>(url, { method, body: body == null ? undefined : JSON.stringify(body) });
    return unwrapData(payload);
}

function listQuery(filters: VisitListFilters): string {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    filters.status?.forEach((status) => params.append("status[]", status));
    if (filters.propertyId) params.set("propertyId", filters.propertyId);
    if (filters.buyerId) params.set("buyerId", filters.buyerId);
    if (filters.q) params.set("q", filters.q);
    if (filters.cursor) params.set("cursor", filters.cursor);
    if (filters.limit) params.set("limit", String(filters.limit));
    return params.toString();
}

function slotQuery(filters: SlotListFilters): string {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    filters.propertyIds?.forEach((id) => params.append("propertyIds[]", id));
    filters.localities?.forEach((locality) => params.append("localities[]", locality));
    filters.timeBuckets?.forEach((bucket) => params.append("timeBuckets[]", bucket));
    if (filters.purpose) params.set("purpose", filters.purpose);
    if (filters.propertyType) params.set("type", filters.propertyType);
    if (filters.bhk) params.set("bhk", filters.bhk);
    if (filters.minBudget) params.set("minBudget", String(filters.minBudget));
    if (filters.maxBudget) params.set("maxBudget", String(filters.maxBudget));
    if (filters.ownerId) params.set("owner", filters.ownerId);
    if (filters.buyerId) params.set("buyerId", filters.buyerId);
    if (filters.q) params.set("q", filters.q);
    if (filters.cursor) params.set("cursor", filters.cursor);
    return params.toString();
}

export class SlotTakenError extends Error {
    constructor(public slot: VisitSlot) {
        super("This slot just got taken");
        this.name = "SlotTakenError";
    }
}

const bookedSlotIds = new Set<string>();

export const brokerVisitsApi = {
    async summary(): Promise<BrokerVisitSummary> {
        if (USE_MOCK_VISITS) return buildVisitSummary(structuredClone(MOCK_SITE_VISITS), structuredClone(MOCK_PROPERTIES_WITH_SLOTS), structuredClone(MOCK_TIME_REQUESTS));
        return requestData<BrokerVisitSummary>("/api/broker/visits/summary");
    },
    async list(filters: VisitListFilters = {}): Promise<BrokerSiteVisit[]> {
        if (USE_MOCK_VISITS) {
            return structuredClone(MOCK_SITE_VISITS).filter((visit) => {
                if (filters.from && visit.startsAt < filters.from) return false;
                if (filters.to && visit.startsAt > filters.to) return false;
                if (filters.status?.length && !filters.status.includes(visit.status)) return false;
                if (filters.propertyId && visit.propertyId !== filters.propertyId) return false;
                if (filters.buyerId && !visit.buyerIds.includes(filters.buyerId)) return false;
                if (filters.q && !`${visit.property.title} ${visit.property.locality} ${visit.buyers.map((buyer) => buyer.name).join(" ")}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
                return true;
            });
        }
        const query = listQuery(filters);
        return requestData<BrokerSiteVisit[]>(`/api/broker/visits${query ? `?${query}` : ""}`);
    },
    async slots(filters: SlotListFilters = {}): Promise<PropertyWithSlots[]> {
        if (USE_MOCK_VISITS) {
            return structuredClone(MOCK_PROPERTIES_WITH_SLOTS).filter((item) => {
                if (filters.propertyIds?.length && !filters.propertyIds.includes(item.property.id)) return false;
                if (filters.localities?.length && !filters.localities.includes(item.property.locality)) return false;
                if (filters.purpose && item.property.purpose !== filters.purpose) return false;
                if (filters.propertyType && item.property.propertyType !== filters.propertyType) return false;
                if (filters.bhk && !item.property.configLabel.startsWith(filters.bhk)) return false;
                if (filters.minBudget && item.property.amountInr < filters.minBudget) return false;
                if (filters.maxBudget && item.property.amountInr > filters.maxBudget) return false;
                if (filters.ownerId && item.owner.id !== filters.ownerId) return false;
                if (filters.q && !`${item.property.title} ${item.property.locality} ${item.owner.name}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
                return true;
            });
        }
        const query = slotQuery(filters);
        return requestData<PropertyWithSlots[]>(`/api/broker/slots${query ? `?${query}` : ""}`);
    },
    async requests(): Promise<TimeRequest[]> {
        if (USE_MOCK_VISITS) return structuredClone(MOCK_TIME_REQUESTS);
        return requestData<TimeRequest[]>("/api/broker/time-requests");
    },
    async book(input: { item: PropertyWithSlots; slot: VisitSlot; buyers: PersonSummary[]; note: string; remindBuyer: boolean }): Promise<BrokerSiteVisit> {
        if (USE_MOCK_VISITS) {
            if (bookedSlotIds.has(input.slot.id) || input.slot.status === "full" || input.slot.bookedCount >= input.slot.capacity) {
                throw new SlotTakenError({ ...input.slot, status: "full", bookedCount: input.slot.capacity });
            }
            bookedSlotIds.add(input.slot.id);
            const now = new Date().toISOString();
            return {
                id: `v_booked_${input.slot.id}`,
                source: input.item.propertySource === "own_listing" ? "broker_created" : "slot",
                slotId: input.slot.id,
                propertyId: input.item.property.id,
                propertySource: input.item.propertySource,
                ownerId: input.item.owner.id,
                brokerId: "broker_me",
                buyerIds: input.buyers.map((buyer) => buyer.id),
                startsAt: input.slot.startsAt,
                endsAt: input.slot.endsAt,
                status: input.item.propertySource === "own_listing" || input.slot.autoConfirm ? "confirmed" : "awaiting_owner",
                brokerNote: input.note || undefined,
                ownerNote: input.slot.note,
                remindBuyer: input.remindBuyer,
                createdAt: now,
                updatedAt: now,
                property: input.item.property,
                owner: input.item.owner,
                buyers: input.buyers,
                distanceKm: input.item.distanceKm,
                driveMinutes: Math.max(12, Math.round((input.item.distanceKm ?? 5) * 2.4)),
            };
        }
        try {
            return await requestData<BrokerSiteVisit>("/api/broker/visits", "POST", { slotId: input.slot.id, propertyId: input.item.property.id, propertySource: input.item.propertySource, buyerIds: input.buyers.map((buyer) => buyer.id), note: input.note, remindBuyer: input.remindBuyer });
        } catch (error) {
            const body = error instanceof ApiError ? error.body as { error?: string; data?: { slot?: VisitSlot } } | undefined : undefined;
            if (error instanceof ApiError && error.status === 409 && body?.error === "SLOT_TAKEN" && body.data?.slot) throw new SlotTakenError(body.data.slot);
            throw error;
        }
    },
    async createTimeRequest(input: { item: PropertyWithSlots; buyers: PersonSummary[]; preferredStartsAt: string; preferredEndsAt: string; alternates: { startsAt: string; endsAt: string }[]; message?: string }): Promise<TimeRequest> {
        if (USE_MOCK_VISITS) {
            const now = new Date().toISOString();
            return { id: `tr_${Date.now()}`, propertyId: input.item.property.id, ownerId: input.item.owner.id, brokerId: "broker_me", buyerIds: input.buyers.map((buyer) => buyer.id), preferredStartsAt: input.preferredStartsAt, preferredEndsAt: input.preferredEndsAt, alternates: input.alternates, message: input.message, status: "pending", expiresAt: input.preferredStartsAt, createdAt: now, property: input.item.property, owner: input.item.owner, buyers: input.buyers };
        }
        return requestData<TimeRequest>("/api/broker/time-requests", "POST", { propertyId: input.item.property.id, buyerIds: input.buyers.map((buyer) => buyer.id), preferredStartsAt: input.preferredStartsAt, preferredEndsAt: input.preferredEndsAt, alternates: input.alternates, message: input.message });
    },
    async withdrawRequest(id: string): Promise<string> {
        if (USE_MOCK_VISITS) return id;
        await requestData(`/api/broker/time-requests/${id}/withdraw`, "PATCH");
        return id;
    },
    async nudgeRequest(id: string): Promise<string> {
        if (USE_MOCK_VISITS) return id;
        return id;
    },
    async declineCounter(id: string): Promise<string> {
        if (USE_MOCK_VISITS) return id;
        await requestData(`/api/broker/time-requests/${id}/decline-counter`, "POST", { reason: "Broker declined the proposed time" });
        return id;
    },
    async acceptCounter(request: TimeRequest): Promise<BrokerSiteVisit> {
        if (!request.counterOffer) throw new Error("The owner has not offered another time.");
        if (USE_MOCK_VISITS) {
            const now = new Date().toISOString();
            return { id: `v_counter_${request.id}`, source: "time_request", propertyId: request.propertyId, propertySource: "marketplace", ownerId: request.ownerId, brokerId: "broker_me", buyerIds: request.buyerIds, startsAt: request.counterOffer.startsAt, endsAt: request.counterOffer.endsAt, status: "confirmed", brokerNote: request.message, ownerNote: request.counterOffer.ownerMessage, remindBuyer: true, createdAt: now, updatedAt: now, property: request.property, owner: request.owner, buyers: request.buyers };
        }
        return requestData<BrokerSiteVisit>(`/api/broker/time-requests/${request.id}/accept-counter`, "POST");
    },
    async recordOutcome(visit: BrokerSiteVisit, outcome: NonNullable<BrokerSiteVisit["outcome"]>): Promise<OutcomeTransactionResult> {
        if (USE_MOCK_VISITS) return { id: visit.id, outcome, buyerIds: visit.buyerIds, pipelineUpdated: true, followUpCreated: outcome.nextStep === "schedule_followup" && Boolean(outcome.followUpAt) };
        const result = await requestData<OutcomeTransactionResult | BrokerSiteVisit>(`/api/broker/visits/${visit.id}/outcome`, "POST", outcome);
        if ("pipelineUpdated" in result) return result;
        return { id: result.id, outcome: result.outcome ?? outcome, buyerIds: result.buyerIds, pipelineUpdated: true, followUpCreated: outcome.nextStep === "schedule_followup" && Boolean(outcome.followUpAt) };
    },
    async reschedule(id: string, startsAt: string, endsAt: string): Promise<{ id: string; startsAt: string; endsAt: string }> {
        if (USE_MOCK_VISITS) return { id, startsAt, endsAt };
        await requestData(`/api/broker/visits/${id}/reschedule`, "PATCH", { startsAt, endsAt });
        return { id, startsAt, endsAt };
    },
    async cancelVisit(id: string): Promise<string> {
        if (USE_MOCK_VISITS) return id;
        await requestData(`/api/broker/visits/${id}/cancel`, "PATCH", { reason: "broker_cancelled" });
        return id;
    },
};
