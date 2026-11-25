import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";
import { testSnapshot } from "@/lib/testing/test-data";
import { getTestLabSettings } from "@/lib/testing/test-lab";
import { withTestNetwork } from "@/lib/testing/test-network";

import { PREVIEW_PROPERTY_ANALYTICS } from "@/config";
import {
    getMockListingsAnalytics,
    getMockPropertyAnalytics,
} from "@/features/properties/property-analytics/mock-property-analytics";

function shouldMockPropertyAnalytics(): boolean {
    return (
        isMockMode() || (getTestLabSettings().source === "default" && PREVIEW_PROPERTY_ANALYTICS)
    );
}

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

/** Same states as the Visits page tabs. */
export type VisitStateKey =
    "upcoming" | "running" | "needs_update" | "completed" | "not_attended" | "cancelled";

export type VisitCounts = Record<VisitStateKey, number>;

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
    /** Commission locked when the deal closed, whole INR. */
    commissionInrAtClose?: string | null;
    lostReason?: string | null;
    notes: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    /** Booked visits; cancelled visits are left out. */
    showings: number;
    visits?: VisitCounts;
    /** The soonest upcoming visit, else the latest one that was not cancelled. */
    latestShowing: {
        status: string | null;
        scheduledDate: string;
        endAt?: string | null;
        state?: VisitStateKey;
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
        clientsVisited?: number;
        visits?: VisitCounts;
        closedWonAmount: string | null;
        /** Sum of commissions locked on closed deals, whole INR. */
        closedCommissionInr?: string | null;
    };
    byStage: StageCounts;
    leads: PropertyAnalyticsLead[];
    generatedAt?: string;
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

export const propertyAnalyticsApi = withTestNetwork({
    /** `GET /properties/analytics` — lead counts for every listing in scope. */
    portfolio(signal?: AbortSignal) {
        if (isMockMode()) {
            return Promise.resolve(testSnapshot(getMockListingsAnalytics()));
        }
        return apiFetch<ListingsAnalytics>("/properties/analytics", { signal });
    },

    /** `GET /properties/:id/analytics` — stages and each lead on one listing. */
    property(propertyId: string, signal?: AbortSignal) {
        if (shouldMockPropertyAnalytics()) {
            return Promise.resolve(testSnapshot(getMockPropertyAnalytics(propertyId)));
        }
        return apiFetch<PropertyAnalytics>(`/properties/${propertyId}/analytics`, { signal });
    },
});
