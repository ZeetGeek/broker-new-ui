import { apiFetch } from "@/lib/api/client";

export type RepresentationRespondStatus = "accepted" | "rejected";

export type RepresentationRespondBody = {
    status: RepresentationRespondStatus;
    message?: string;
};

export type RepresentationItem = {
    id: string;
    propertyId: string;
    brokerId?: string;
    initiatedBy?: "broker" | "owner" | string;
    status: "pending" | "accepted" | "rejected" | "withdrawn" | "revoked" | string;
    message?: string | null;
    endsAt?: string | null;
    decidedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    brokerRequestCount?: number;
    brokerRequestsRemaining?: number;
    reminderCount?: number;
    lastRemindedAt?: string | null;
    remindersRemaining?: number;
    propertyTitle?: string | null;
    propertyCity?: string | null;
    propertyAddress?: string | null;
    propertyTransactionType?: string | null;
    propertyType?: string | null;
    propertySubtype?: string | null;
    propertyBhkConfig?: string | null;
    propertyBedrooms?: number | null;
    propertyAreaSqft?: number | null;
    propertySalePrice?: string | number | null;
    propertyMonthlyRent?: string | number | null;
    propertyCommissionPercent?: string | number | null;
    propertyPhotos?: string[] | null;
    propertyOwnerName?: string | null;
    propertyOwnerPhone?: string | null;
    propertyOwnerAvatarUrl?: string | null;
};

export type RepresentationListPage = {
    items: RepresentationItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type BrokerInvitationListQuery = {
    /** `pending` (default server-side), `accepted`, `rejected`, `closed`, or `all`. */
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
};

export const representativeApi = {
    requestRepresentation(propertyId: string, message?: string) {
        return apiFetch<RepresentationItem>("/representative/broker/request", {
            method: "POST",
            body: JSON.stringify({ propertyId, ...(message ? { message } : {}) }),
        });
    },

    /** Broker-side representations (outbound requests + inbound invites). */
    brokerList(status?: string) {
        const qs = status ? `?status=${encodeURIComponent(status)}` : "";
        return apiFetch<RepresentationItem[]>(`/representative/broker/list${qs}`);
    },

    /**
     * Owner → broker invitations for this agency.
     * Without page/limit the API returns the full array; with either it pages.
     */
    brokerInvitationList(params?: BrokerInvitationListQuery) {
        const q = new URLSearchParams();
        if (params?.status) q.set("status", params.status);
        if (params?.search) q.set("search", params.search);
        if (params?.page != null && params.page > 1) q.set("page", String(params.page));
        if (params?.limit != null) q.set("limit", String(params.limit));
        const qs = q.toString();
        return apiFetch<RepresentationItem[] | RepresentationListPage>(
            `/representative/broker/invitation/list${qs ? `?${qs}` : ""}`,
        );
    },

    /** Remind the owner about a pending request (capped server-side). */
    remind(representationId: string) {
        return apiFetch<RepresentationItem>(`/representative/${representationId}/remind`, {
            method: "POST",
        });
    },

    withdraw(representationId: string) {
        return apiFetch<RepresentationItem>(`/representative/${representationId}/withdraw`, {
            method: "PUT",
        });
    },

    ownerRespond(representationId: string, body: RepresentationRespondBody) {
        return apiFetch(`/representative/${representationId}/owner/respond`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },

    brokerRespond(representationId: string, body: RepresentationRespondBody) {
        return apiFetch<RepresentationItem>(`/representative/${representationId}/broker/respond`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },
};
