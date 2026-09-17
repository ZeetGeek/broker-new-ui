import { ApiError, apiFetch } from "@/lib/api/client";
import { clientsApi } from "@/lib/api/clients";
import {
    type ApiBrokerOpenSlotItem,
    type ApiPropertyOption,
    type ApiShowing,
    type ApiVisitSlot,
    type Paged,
    mapBrokerOpenSlotItem,
    mapClientToPerson,
    mapShowingToTimeRequest,
    mapShowingToVisit,
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

export type BrokerOpenSlotsPage = {
    items: PropertyWithSlots[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    propertyOptions: ApiPropertyOption[];
};

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

function buildOpenSlotsQuery(filters: SlotListFilters): string {
    const params = new URLSearchParams();
    params.set("page", String(filters.page ?? 1));
    params.set("limit", String(filters.limit ?? 20));
    if (filters.propertyId) params.set("propertyId", filters.propertyId);
    else if (filters.propertyIds?.length === 1) params.set("propertyId", filters.propertyIds[0]!);
    if (filters.from) params.set("from", filters.from.slice(0, 10));
    if (filters.to) params.set("to", filters.to.slice(0, 10));
    if (filters.localities?.length) params.set("localities", filters.localities.join(","));
    if (filters.timeBuckets?.length) params.set("timeBuckets", filters.timeBuckets.join(","));
    if (filters.purpose) params.set("purpose", filters.purpose);
    if (filters.propertyType) params.set("propertyType", filters.propertyType);
    if (filters.bhk) params.set("bhk", filters.bhk);
    if (filters.minBudget != null) params.set("minBudget", String(filters.minBudget));
    if (filters.maxBudget != null) params.set("maxBudget", String(filters.maxBudget));
    if (filters.ownerId) params.set("ownerId", filters.ownerId);
    if (filters.q) params.set("search", filters.q);
    if (filters.onlyAccepted === false) params.set("onlyAccepted", "false");
    return params.toString();
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
        const [visits, slotsPage, requests] = await Promise.all([
            this.list(),
            this.slots({ page: 1, limit: 100 }),
            this.requests(),
        ]);
        return buildVisitSummary(visits, slotsPage.items, requests);
    },

    async list(filters: VisitListFilters = {}): Promise<BrokerSiteVisit[]> {
        if (USE_MOCK_VISITS) {
            return filterVisits(structuredClone(MOCK_SITE_VISITS), filters);
        }
        const showings = await fetchAllBookings(filters);
        return filterVisits(showings.map(mapShowingToVisit), filters);
    },

    async slots(filters: SlotListFilters = {}): Promise<BrokerOpenSlotsPage> {
        if (USE_MOCK_VISITS) {
            let items = structuredClone(MOCK_PROPERTIES_WITH_SLOTS);
            if (filters.propertyId)
                items = items.filter((item) => item.property.id === filters.propertyId);
            if (filters.propertyIds?.length) {
                items = items.filter((item) => filters.propertyIds!.includes(item.property.id));
            }
            if (filters.localities?.length) {
                items = items.filter((item) =>
                    filters.localities!.includes(item.property.locality),
                );
            }
            if (filters.purpose)
                items = items.filter((item) => item.property.purpose === filters.purpose);
            if (filters.q) {
                const q = filters.q.toLowerCase();
                items = items.filter((item) =>
                    `${item.property.title} ${item.property.locality} ${item.owner.name}`
                        .toLowerCase()
                        .includes(q),
                );
            }
            const page = filters.page ?? 1;
            const limit = filters.limit ?? 20;
            const start = (page - 1) * limit;
            const paged = items.slice(start, start + limit);
            return {
                items: paged,
                total: items.length,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(items.length / limit) || 1),
                propertyOptions: MOCK_PROPERTIES_WITH_SLOTS.map((item) => ({
                    id: item.property.id,
                    title: item.property.title,
                    locality: item.property.locality,
                    city: item.property.city,
                })),
            };
        }

        const response = await requestData<
            Paged<ApiBrokerOpenSlotItem> & { propertyOptions?: ApiPropertyOption[] }
        >(`/slots/broker/open?${buildOpenSlotsQuery(filters)}`);

        return {
            items: (response.items ?? []).map(mapBrokerOpenSlotItem),
            total: response.total ?? 0,
            page: response.page ?? filters.page ?? 1,
            limit: response.limit ?? filters.limit ?? 20,
            totalPages: Math.max(1, response.totalPages ?? 1),
            propertyOptions: response.propertyOptions ?? [],
        };
    },

    /** Visit requests use existing broker bookings/showings API. */
    async requests(): Promise<TimeRequest[]> {
        if (USE_MOCK_VISITS) return structuredClone(MOCK_TIME_REQUESTS);
        const [scheduled, confirmed, cancelled] = await Promise.all([
            fetchAllBookings({ status: ["awaiting_owner"] }),
            fetchAllBookings({ status: ["confirmed"] }),
            fetchAllBookings({ status: ["cancelled_by_owner"] }),
        ]);
        return [...scheduled, ...confirmed, ...cancelled]
            .map(mapShowingToTimeRequest)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
