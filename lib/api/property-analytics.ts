import { apiFetch } from "@/lib/api/client";

export const LEAD_STAGES = [
    "new",
    "contacted",
    "site_visit",
    "negotiation",
    "offer_made",
    "closed_won",
    "closed_lost",
] as const;

export type LeadStageKey = (typeof LEAD_STAGES)[number];

export type StageCounts = Record<LeadStageKey, number>;

export type PropertyAnalyticsLead = {
    id: string;
    stage: LeadStageKey;
    buyerName: string | null;
    buyerPhone: string | null;
    buyerEmail: string | null;
    clientId: string | null;
    offerAmount: string | null;
    offerStatus: "pending" | "accepted" | "rejected" | null;
    listPrice: string | null;
    closedAmount: string | null;
    notes: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    showings: number;
    latestShowing: {
        status: string | null;
        scheduledDate: string;
    } | null;
};

export type PropertyAnalyticsProperty = {
    id: string;
    title: string | null;
    city: string | null;
    address: string | null;
    status: string | null;
    publishStatus: string | null;
    transactionType: string | null;
    salePrice: string | null;
    monthlyRent: string | null;
    photo: string | null;
    createdAt?: string | null;
    soldAt?: string | null;
};

export type PropertyAnalytics = {
    property: PropertyAnalyticsProperty;
    summary: {
        totalLeads: number;
        openLeads: number;
        closedWon: number;
        closedLost: number;
        pendingOffers: number;
        acceptedOffers: number;
        rejectedOffers: number;
        showings: number;
        closedWonAmount: string | null;
    };
    byStage: StageCounts;
    leads: PropertyAnalyticsLead[];
};

export type ListingsAnalyticsProperty = {
    id: string;
    title: string | null;
    city: string | null;
    address: string | null;
    status: string | null;
    publishStatus: string | null;
    transactionType: string | null;
    salePrice: string | null;
    monthlyRent: string | null;
    photo: string | null;
    totalLeads: number;
    openLeads: number;
    closedWon: number;
    closedLost: number;
    showings: number;
    pendingOffers: number;
    byStage: StageCounts;
};

export type ListingsAnalytics = {
    totals: {
        properties: number;
        totalLeads: number;
        openLeads: number;
        closedWon: number;
        closedLost: number;
        showings: number;
        pendingOffers: number;
    };
    byStage: StageCounts;
    properties: ListingsAnalyticsProperty[];
};

export const propertyAnalyticsApi = {
    /** `GET /properties/analytics` — lead counts for every listing in scope. */
    portfolio(signal?: AbortSignal) {
        return apiFetch<ListingsAnalytics>("/properties/analytics", { signal });
    },

    /** `GET /properties/:id/analytics` — stages and each lead on one listing. */
    property(propertyId: string, signal?: AbortSignal) {
        return apiFetch<PropertyAnalytics>(`/properties/${propertyId}/analytics`, { signal });
    },
};
