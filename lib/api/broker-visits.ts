import { ApiError, apiFetch } from "@/lib/api/client";
import { clientsApi } from "@/lib/api/clients";
import { myListingsApi } from "@/lib/api/my-listings";
import { representativeApi } from "@/lib/api/representative";
import {
    type ApiShowing,
    type ApiVisitSlot,
    type Paged,
    filterPropertyCards,
    mapApiSlot,
    mapClientToPerson,
    mapShowingToTimeRequest,
    mapShowingToVisit,
    ownListingToPropertyCard,
    representationToPropertyCard,
} from "@/lib/api/broker-visits-map";
import { buildVisitSummary } from "@/lib/visits/summary";

import type {
    BrokerSiteVisit,
    BrokerVisitSummary,
    OutcomeTransactionResult,
    PersonSummary,
    PropertyWithSlots,
    SlotListFilters,
    TimeRequest,
    VisitListFilters,
    VisitSlot,
} from "@/features/site-visits/broker/model";
import {
    MOCK_PROPERTIES_WITH_SLOTS,
    MOCK_SITE_VISITS,
    MOCK_TIME_REQUESTS,
    USE_MOCK_VISITS,
} from "@/mocks/visits";

async function requestData<T>(
    url: string,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    body?: unknown,
): Promise<T> {
    return apiFetch<T>(url, {
        method,
        body: body == null ? undefined : JSON.stringify(body),
        headers: body == null ? undefined : { "Content-Type": "application/json" },
    });
}

async function fetchAllBookings(filters: VisitListFilters = {}): Promise<ApiShowing[]> {
    const items: ApiShowing[] = [];
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
        const params = new URLSearchParams({
            page: String(page),
            limit: "100",
        });
        if (filters.from) params.set("from", filters.from.slice(0, 10));
        if (filters.to) params.set("to", filters.to.slice(0, 10));
        if (filters.propertyId) params.set("propertyId", filters.propertyId);
        if (filters.q) params.set("search", filters.q);
        // Backend accepts a single status; when multiple are requested, fetch all and filter client-side.
        if (filters.status?.length === 1) {
            const mapped = uiStatusToApi(filters.status[0]);
            if (mapped) params.set("status", mapped);
        }
        const response = await requestData<Paged<ApiShowing>>(`/slots/broker/bookings?${params}`);
        items.push(...(response.items ?? []));
        totalPages = Math.max(1, response.totalPages ?? 1);
        page += 1;
    }
    return items;
}

function uiStatusToApi(status: string): string | undefined {
    switch (status) {
        case "awaiting_owner":
            return "scheduled";
        case "confirmed":
            return "confirmed";
        case "completed":
            return "completed";
        case "cancelled_by_broker":
        case "cancelled_by_owner":
            return "cancelled";
        case "no_show":
            return "no_show";
        default:
            return undefined;
    }
}

function filterVisits(visits: BrokerSiteVisit[], filters: VisitListFilters): BrokerSiteVisit[] {
    return visits.filter((visit) => {
        if (filters.from && visit.startsAt < filters.from) return false;
        if (filters.to && visit.startsAt > filters.to) return false;
        if (filters.status?.length && !filters.status.includes(visit.status)) return false;
        if (filters.propertyId && visit.propertyId !== filters.propertyId) return false;
        if (filters.buyerId && !visit.buyerIds.includes(filters.buyerId)) return false;
        if (
            filters.q &&
            !`${visit.property.title} ${visit.property.locality} ${visit.buyers.map((b) => b.name).join(" ")}`
                .toLowerCase()
                .includes(filters.q.toLowerCase())
        ) {
            return false;
        }
        return true;
    });
}

async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T) => Promise<R>,
): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += limit) {
        const chunk = items.slice(i, i + limit);
        results.push(...(await Promise.all(chunk.map(mapper))));
    }
    return results;
}

async function fetchOpenSlotsForProperty(propertyId: string): Promise<ApiVisitSlot[]> {
    try {
        return await requestData<ApiVisitSlot[]>(`/slots/property/${propertyId}`);
    } catch {
        return [];
    }
}

async function listAccessiblePropertyCards(
    filters: SlotListFilters = {},
): Promise<PropertyWithSlots[]> {
    const [activeReps, ownPage] = await Promise.all([
        representativeApi.brokerList("accepted").catch(() => []),
        myListingsApi.list({ page: 1, status: "published", q: filters.q ?? "" }).catch(() => ({
            items: [],
            total: 0,
            page: 1,
            totalPages: 1,
        })),
    ]);

    const reps = Array.isArray(activeReps) ? activeReps : [];
    const ownItems = ownPage.items ?? [];
    const ownIds = new Set(ownItems.map((item) => item.id));

    const repTargets = reps.filter((rep) => rep.propertyId && !ownIds.has(rep.propertyId));
    if (filters.propertyIds?.length) {
        const allowed = new Set(filters.propertyIds);
        repTargets.splice(
            0,
            repTargets.length,
            ...repTargets.filter((r) => allowed.has(r.propertyId)),
        );
        ownItems.splice(0, ownItems.length, ...ownItems.filter((item) => allowed.has(item.id)));
    }

    const [repCards, ownCards] = await Promise.all([
        mapWithConcurrency(repTargets, 5, async (rep) => {
            const slots = (await fetchOpenSlotsForProperty(rep.propertyId)).map((slot) =>
                mapApiSlot(slot, rep.id),
            );
            return representationToPropertyCard(rep, slots);
        }),
        mapWithConcurrency(ownItems, 5, async (listing) => {
            const slots = (await fetchOpenSlotsForProperty(listing.id)).map((slot) =>
                mapApiSlot(slot, listing.ownerId ?? "me"),
            );
            return ownListingToPropertyCard(listing, slots);
        }),
    ]);

    return filterPropertyCards([...ownCards, ...repCards], filters);
}

async function resolveLeadIdForBuyer(propertyId: string, clientId: string): Promise<string> {
    await clientsApi.setPropertyClients(propertyId, [clientId]);
    const params = new URLSearchParams({ propertyId, page: "1", limit: "100" });
    const response = await requestData<{
        items: Array<{ id: string; clientId?: string | null; client?: { id: string } | null }>;
    }>(`/clients/leads?${params}`);
    const lead = (response.items ?? []).find(
        (item) => item.clientId === clientId || item.client?.id === clientId,
    );
    if (!lead) {
        throw new Error("Could not link this buyer to the property. Try again from Contacts.");
    }
    return lead.id;
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
        if (USE_MOCK_VISITS) {
            return buildVisitSummary(
                structuredClone(MOCK_SITE_VISITS),
                structuredClone(MOCK_PROPERTIES_WITH_SLOTS),
                structuredClone(MOCK_TIME_REQUESTS),
            );
        }
        const [visits, slots, requests] = await Promise.all([
            this.list(),
            this.slots(),
            this.requests(),
        ]);
        return buildVisitSummary(visits, slots, requests);
    },

    async list(filters: VisitListFilters = {}): Promise<BrokerSiteVisit[]> {
        if (USE_MOCK_VISITS) {
            return filterVisits(structuredClone(MOCK_SITE_VISITS), filters);
        }
        const showings = await fetchAllBookings(filters);
        return filterVisits(showings.map(mapShowingToVisit), filters);
    },

    async slots(filters: SlotListFilters = {}): Promise<PropertyWithSlots[]> {
        if (USE_MOCK_VISITS) {
            return structuredClone(MOCK_PROPERTIES_WITH_SLOTS).filter((item) => {
                if (filters.propertyIds?.length && !filters.propertyIds.includes(item.property.id))
                    return false;
                if (
                    filters.localities?.length &&
                    !filters.localities.includes(item.property.locality)
                )
                    return false;
                if (filters.purpose && item.property.purpose !== filters.purpose) return false;
                if (filters.propertyType && item.property.propertyType !== filters.propertyType)
                    return false;
                if (filters.bhk && !item.property.configLabel.startsWith(filters.bhk)) return false;
                if (filters.minBudget && item.property.amountInr < filters.minBudget) return false;
                if (filters.maxBudget && item.property.amountInr > filters.maxBudget) return false;
                if (filters.ownerId && item.owner.id !== filters.ownerId) return false;
                if (
                    filters.q &&
                    !`${item.property.title} ${item.property.locality} ${item.owner.name}`
                        .toLowerCase()
                        .includes(filters.q.toLowerCase())
                ) {
                    return false;
                }
                return true;
            });
        }
        return listAccessiblePropertyCards(filters);
    },

    async requests(): Promise<TimeRequest[]> {
        if (USE_MOCK_VISITS) return structuredClone(MOCK_TIME_REQUESTS);
        const showings = await fetchAllBookings();
        return showings
            .map(mapShowingToTimeRequest)
            .filter(
                (request) =>
                    request.status === "pending" ||
                    request.status === "declined" ||
                    request.status === "accepted" ||
                    request.status === "expired",
            );
    },

    async book(input: {
        item: PropertyWithSlots;
        slot: VisitSlot;
        buyers: PersonSummary[];
        note: string;
        remindBuyer: boolean;
    }): Promise<BrokerSiteVisit> {
        if (USE_MOCK_VISITS) {
            if (
                bookedSlotIds.has(input.slot.id) ||
                input.slot.status === "full" ||
                input.slot.bookedCount >= input.slot.capacity
            ) {
                throw new SlotTakenError({
                    ...input.slot,
                    status: "full",
                    bookedCount: input.slot.capacity,
                });
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
                status:
                    input.item.propertySource === "own_listing" || input.slot.autoConfirm
                        ? "confirmed"
                        : "awaiting_owner",
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

        const primaryBuyer = input.buyers[0];
        if (!primaryBuyer) throw new Error("Select a buyer to book this visit.");

        try {
            const leadId = await resolveLeadIdForBuyer(input.item.property.id, primaryBuyer.id);
            const result = await requestData<{
                slot: ApiVisitSlot;
                showing: {
                    id: string;
                    leadId: string;
                    propertyId: string;
                    visitSlotId: string | null;
                    scheduledDate: string;
                    status: string;
                    notes: string | null;
                    createdAt: string;
                };
            }>(`/slots/${input.slot.id}/book`, "POST", {
                leadId,
                notes: input.note || undefined,
            });

            const now = new Date().toISOString();
            return {
                id: result.showing.id,
                source: input.item.propertySource === "own_listing" ? "broker_created" : "slot",
                slotId: input.slot.id,
                propertyId: input.item.property.id,
                propertySource: input.item.propertySource,
                ownerId: input.item.owner.id,
                brokerId: "broker_me",
                buyerIds: input.buyers.map((buyer) => buyer.id),
                startsAt: input.slot.startsAt,
                endsAt: input.slot.endsAt,
                status: result.showing.status === "confirmed" ? "confirmed" : "awaiting_owner",
                brokerNote: input.note || undefined,
                ownerNote: input.slot.note,
                remindBuyer: input.remindBuyer,
                createdAt: result.showing.createdAt ?? now,
                updatedAt: now,
                property: input.item.property,
                owner: input.item.owner,
                buyers: input.buyers,
                distanceKm: input.item.distanceKm,
                driveMinutes: Math.max(12, Math.round((input.item.distanceKm ?? 5) * 2.4)),
            };
        } catch (error) {
            if (error instanceof ApiError && (error.status === 409 || error.status === 400)) {
                const message = error.message.toLowerCase();
                if (
                    message.includes("no longer available") ||
                    message.includes("not available") ||
                    message.includes("slot")
                ) {
                    throw new SlotTakenError({
                        ...input.slot,
                        status: "full",
                        bookedCount: input.slot.capacity,
                    });
                }
            }
            throw error;
        }
    },

    async createTimeRequest(_input: {
        item: PropertyWithSlots;
        buyers: PersonSummary[];
        preferredStartsAt: string;
        preferredEndsAt: string;
        alternates: { startsAt: string; endsAt: string }[];
        message?: string;
    }): Promise<TimeRequest> {
        if (USE_MOCK_VISITS) {
            const now = new Date().toISOString();
            return {
                id: `tr_${Date.now()}`,
                propertyId: _input.item.property.id,
                ownerId: _input.item.owner.id,
                brokerId: "broker_me",
                buyerIds: _input.buyers.map((buyer) => buyer.id),
                preferredStartsAt: _input.preferredStartsAt,
                preferredEndsAt: _input.preferredEndsAt,
                alternates: _input.alternates,
                message: _input.message,
                status: "pending",
                expiresAt: _input.preferredStartsAt,
                createdAt: now,
                property: _input.item.property,
                owner: _input.item.owner,
                buyers: _input.buyers,
            };
        }
        throw new Error("Custom time requests aren’t available yet. Book an open slot instead.");
    },

    async withdrawRequest(id: string): Promise<string> {
        if (USE_MOCK_VISITS) return id;
        await requestData(`/slots/broker/showings/${id}/cancel`, "PATCH");
        return id;
    },

    async nudgeRequest(id: string): Promise<string> {
        return id;
    },

    async declineCounter(id: string): Promise<string> {
        if (USE_MOCK_VISITS) return id;
        throw new Error("Owner counter-offers aren’t supported on this visit yet.");
    },

    async acceptCounter(request: TimeRequest): Promise<BrokerSiteVisit> {
        if (!request.counterOffer) throw new Error("The owner has not offered another time.");
        if (USE_MOCK_VISITS) {
            const now = new Date().toISOString();
            return {
                id: `v_counter_${request.id}`,
                source: "time_request",
                propertyId: request.propertyId,
                propertySource: "marketplace",
                ownerId: request.ownerId,
                brokerId: "broker_me",
                buyerIds: request.buyerIds,
                startsAt: request.counterOffer.startsAt,
                endsAt: request.counterOffer.endsAt,
                status: "confirmed",
                brokerNote: request.message,
                ownerNote: request.counterOffer.ownerMessage,
                remindBuyer: true,
                createdAt: now,
                updatedAt: now,
                property: request.property,
                owner: request.owner,
                buyers: request.buyers,
            };
        }
        throw new Error("Owner counter-offers aren’t supported on this visit yet.");
    },

    async recordOutcome(
        visit: BrokerSiteVisit,
        outcome: NonNullable<BrokerSiteVisit["outcome"]>,
    ): Promise<OutcomeTransactionResult> {
        // Backend has no outcome endpoint yet — keep the UI flow local.
        return {
            id: visit.id,
            outcome,
            buyerIds: visit.buyerIds,
            pipelineUpdated: false,
            followUpCreated:
                outcome.nextStep === "schedule_followup" && Boolean(outcome.followUpAt),
        };
    },

    async reschedule(
        id: string,
        startsAt: string,
        endsAt: string,
    ): Promise<{ id: string; startsAt: string; endsAt: string }> {
        if (USE_MOCK_VISITS) return { id, startsAt, endsAt };
        throw new Error(
            "Reschedule isn’t available yet. Cancel this visit and book another open slot.",
        );
    },

    async cancelVisit(id: string): Promise<string> {
        if (USE_MOCK_VISITS) return id;
        await requestData(`/slots/broker/showings/${id}/cancel`, "PATCH");
        return id;
    },

    async listBuyers(): Promise<PersonSummary[]> {
        if (USE_MOCK_VISITS) {
            const { MOCK_BUYERS } = await import("@/mocks/visits");
            return structuredClone(MOCK_BUYERS);
        }
        const clients = await clientsApi.list();
        return clients.map(mapClientToPerson);
    },
};
