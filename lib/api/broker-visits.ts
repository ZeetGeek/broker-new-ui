import type { BrokerSiteVisit, PersonSummary, PropertyWithSlots, TimeRequest, VisitSlot } from "@/features/site-visits/broker/model";
import { MOCK_PROPERTIES_WITH_SLOTS, MOCK_SITE_VISITS, MOCK_TIME_REQUESTS, USE_MOCK_VISITS } from "@/mocks/visits";

async function readJson<T>(url: string): Promise<T> {
    const response = await fetch(url, { credentials: "include" });
    const payload = (await response.json()) as { data?: T; error?: string };
    if (!response.ok || payload.data == null) throw new Error(payload.error ?? `Request failed (${response.status})`);
    return payload.data;
}

async function mutateJson<T>(url: string, method: "POST" | "PATCH", body?: unknown): Promise<T> {
    const response = await fetch(url, {
        method,
        credentials: "include",
        headers: body == null ? undefined : { "Content-Type": "application/json" },
        body: body == null ? undefined : JSON.stringify(body),
    });
    const payload = (await response.json()) as { data?: T; error?: string };
    if (!response.ok || payload.data == null) throw new Error(payload.error ?? `Request failed (${response.status})`);
    return payload.data;
}

export class SlotTakenError extends Error {
    constructor(public slot: VisitSlot) {
        super("This slot just got taken");
        this.name = "SlotTakenError";
    }
}

const bookedSlotIds = new Set<string>();

export const brokerVisitsApi = {
    async list(): Promise<BrokerSiteVisit[]> {
        if (USE_MOCK_VISITS) return structuredClone(MOCK_SITE_VISITS);
        return readJson<BrokerSiteVisit[]>("/api/broker/visits");
    },
    async slots(): Promise<PropertyWithSlots[]> {
        if (USE_MOCK_VISITS) return structuredClone(MOCK_PROPERTIES_WITH_SLOTS);
        return readJson<PropertyWithSlots[]>("/api/broker/slots");
    },
    async requests(): Promise<TimeRequest[]> {
        if (USE_MOCK_VISITS) return structuredClone(MOCK_TIME_REQUESTS);
        return readJson<TimeRequest[]>("/api/broker/time-requests");
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
                source: "slot",
                slotId: input.slot.id,
                propertyId: input.item.property.id,
                propertySource: "marketplace",
                ownerId: input.item.owner.id,
                brokerId: "broker_me",
                buyerIds: input.buyers.map((buyer) => buyer.id),
                startsAt: input.slot.startsAt,
                endsAt: input.slot.endsAt,
                status: input.slot.autoConfirm ? "confirmed" : "awaiting_owner",
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
        const response = await fetch("/api/broker/visits", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slotId: input.slot.id, buyerIds: input.buyers.map((buyer) => buyer.id), note: input.note, remindBuyer: input.remindBuyer }) });
        const payload = (await response.json()) as { data?: BrokerSiteVisit | { slot: VisitSlot }; error?: string };
        if (response.status === 409 && payload.error === "SLOT_TAKEN") throw new SlotTakenError((payload.data as { slot: VisitSlot }).slot);
        if (!response.ok || !payload.data) throw new Error(payload.error ?? "Booking failed");
        return payload.data as BrokerSiteVisit;
    },
    async createTimeRequest(input: { item: PropertyWithSlots; buyers: PersonSummary[]; preferredStartsAt: string; preferredEndsAt: string; alternates: { startsAt: string; endsAt: string }[]; message?: string }): Promise<TimeRequest> {
        if (USE_MOCK_VISITS) {
            const now = new Date().toISOString();
            return { id: `tr_${Date.now()}`, propertyId: input.item.property.id, ownerId: input.item.owner.id, brokerId: "broker_me", buyerIds: input.buyers.map((buyer) => buyer.id), preferredStartsAt: input.preferredStartsAt, preferredEndsAt: input.preferredEndsAt, alternates: input.alternates, message: input.message, status: "pending", expiresAt: input.preferredStartsAt, createdAt: now, property: input.item.property, owner: input.item.owner, buyers: input.buyers };
        }
        const response = await fetch("/api/broker/time-requests", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: input.item.property.id, buyerIds: input.buyers.map((buyer) => buyer.id), preferredStartsAt: input.preferredStartsAt, preferredEndsAt: input.preferredEndsAt, alternates: input.alternates, message: input.message }) });
        const payload = (await response.json()) as { data?: TimeRequest; error?: string };
        if (!response.ok || !payload.data) throw new Error(payload.error ?? "Could not send this request");
        return payload.data;
    },
    async withdrawRequest(id: string): Promise<string> {
        if (USE_MOCK_VISITS) return id;
        await mutateJson(`/api/broker/time-requests/${id}/withdraw`, "PATCH");
        return id;
    },
    async nudgeRequest(id: string): Promise<string> {
        if (USE_MOCK_VISITS) return id;
        return id;
    },
    async declineCounter(id: string): Promise<string> {
        if (USE_MOCK_VISITS) return id;
        await mutateJson(`/api/broker/time-requests/${id}/decline-counter`, "POST", { reason: "Broker declined the proposed time" });
        return id;
    },
    async acceptCounter(request: TimeRequest): Promise<BrokerSiteVisit> {
        if (!request.counterOffer) throw new Error("The owner has not offered another time.");
        if (USE_MOCK_VISITS) {
            const now = new Date().toISOString();
            return { id: `v_counter_${request.id}`, source: "time_request", propertyId: request.propertyId, propertySource: "marketplace", ownerId: request.ownerId, brokerId: "broker_me", buyerIds: request.buyerIds, startsAt: request.counterOffer.startsAt, endsAt: request.counterOffer.endsAt, status: "confirmed", brokerNote: request.message, ownerNote: request.counterOffer.ownerMessage, remindBuyer: true, createdAt: now, updatedAt: now, property: request.property, owner: request.owner, buyers: request.buyers };
        }
        return mutateJson<BrokerSiteVisit>(`/api/broker/time-requests/${request.id}/accept-counter`, "POST");
    },
    async recordOutcome(id: string, outcome: BrokerSiteVisit["outcome"]): Promise<{ id: string; outcome: BrokerSiteVisit["outcome"] }> {
        if (USE_MOCK_VISITS) return { id, outcome };
        const response = await fetch(`/api/broker/visits/${id}/outcome`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(outcome) });
        const payload = (await response.json()) as { data?: BrokerSiteVisit; error?: string };
        if (!response.ok || !payload.data) throw new Error(payload.error ?? "Could not log this outcome");
        return { id, outcome: payload.data.outcome };
    },
    async reschedule(id: string, startsAt: string, endsAt: string): Promise<{ id: string; startsAt: string; endsAt: string }> {
        if (USE_MOCK_VISITS) return { id, startsAt, endsAt };
        await fetch(`/api/broker/visits/${id}/reschedule`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ startsAt, endsAt }) });
        return { id, startsAt, endsAt };
    },
    async cancelVisit(id: string): Promise<string> {
        if (USE_MOCK_VISITS) return id;
        await fetch(`/api/broker/visits/${id}/cancel`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "broker_cancelled" }) });
        return id;
    },
};
