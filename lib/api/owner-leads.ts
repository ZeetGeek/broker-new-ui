import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";

export type LeadStage =
    | "new"
    | "contacted"
    | "site_visit"
    | "negotiation"
    | "offer"
    | "closed_won"
    | "closed_lost"
    | string;

export type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn" | string;

export type PropertyLead = {
    id: string;
    ownerId?: string;
    propertyId: string;
    brokerId?: string;
    clientId?: string | null;
    stage?: LeadStage | null;
    listPrice?: string | null;
    offerAmount?: string | null;
    offerStatus?: OfferStatus | null;
    closedAmount?: string | null;
    notes?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    property?: {
        id: string;
        title?: string | null;
        city?: string;
        address?: string | null;
        salePrice?: string | null;
        monthlyRent?: string | null;
        transactionType?: string | null;
        propertyType?: string | null;
        subtype?: string | null;
        bhkConfig?: string | null;
        bedrooms?: number | null;
        areaSqft?: number | null;
        photos?: string[] | null;
    } | null;
    broker?: {
        id: string;
        fullName?: string | null;
        email?: string;
        phone?: string | null;
    } | null;
    client?: {
        id: string;
        name: string;
        phone?: string;
        email?: string | null;
        clientType?: string | null;
        notes?: string | null;
    } | null;
};

export type OwnerLeadsQuery = {
    search?: string;
    propertyId?: string;
    stage?: string;
    offerStatus?: OfferStatus;
    page?: number;
    limit?: number;
};

export type OwnerLeadsResponse = {
    items: PropertyLead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type RespondOfferInput = {
    decision: "accept" | "reject";
    notes?: string;
};

export const ownerLeadsApi = {
    list(params?: OwnerLeadsQuery) {
        if (isMockMode()) {
            return Promise.resolve({
                items: [],
                total: 0,
                page: 1,
                limit: 12,
                totalPages: 0,
            } satisfies OwnerLeadsResponse);
        }
        const q = new URLSearchParams();
        if (params?.search?.trim()) q.set("search", params.search.trim());
        if (params?.propertyId) q.set("propertyId", params.propertyId);
        if (params?.stage) q.set("stage", params.stage);
        if (params?.offerStatus) q.set("offerStatus", params.offerStatus);
        if (params?.page) q.set("page", String(params.page));
        if (params?.limit) q.set("limit", String(params.limit));
        const qs = q.toString();
        return apiFetch<OwnerLeadsResponse>(`/clients/owner/leads${qs ? `?${qs}` : ""}`);
    },

    respond(leadId: string, body: RespondOfferInput) {
        return apiFetch<PropertyLead>(`/clients/owner/leads/${leadId}/respond`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },
};
