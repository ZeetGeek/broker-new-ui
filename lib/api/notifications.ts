import { apiFetch } from "@/lib/api/client";

export type NotificationType =
    | "representation_request"
    | "representation_reminder"
    | "representation_approved"
    | "representation_rejected"
    | "representation_revoked"
    | "representation_message"
    | "invite_received"
    | "invite_accepted"
    | "invite_declined"
    | "offer_received"
    | "offer_accepted"
    | "offer_rejected"
    | "visit_requested"
    | "visit_approved"
    | "visit_cancelled"
    | "lead_added"
    | "deal_closed"
    | "team_joined"
    | "referral_rewarded"
    | "property_assigned"
    | "client_assigned"
    | "system";

export type NotificationItem = {
    id: string;
    userId: string;
    actorUserId: string | null;
    type: NotificationType | string | null;
    title: string;
    body: string | null;
    href: string | null;
    referenceType: string | null;
    referenceId: string | null;
    relatedPropertyId: string | null;
    relatedRepresentationId: string | null;
    relatedLeadId: string | null;
    metadata: Record<string, unknown> | null;
    /** Live status from property_representations when relatedRepresentationId is set. */
    representationStatus: string | null;
    isRead: boolean;
    readAt: string | null;
    createdAt: string | null;
};

export type NotificationListResponse = {
    page: number;
    limit: number;
    total: number;
    unreadCount: number;
    items: NotificationItem[];
};

export const notificationsApi = {
    list(params?: { page?: number; limit?: number; unreadOnly?: boolean }, signal?: AbortSignal) {
        const q = new URLSearchParams();
        if (params?.page) q.set("page", String(params.page));
        if (params?.limit) q.set("limit", String(params.limit));
        if (params?.unreadOnly) q.set("unreadOnly", "true");
        const qs = q.toString();
        return apiFetch<NotificationListResponse>(`/notifications${qs ? `?${qs}` : ""}`, {
            signal,
        });
    },

    unreadCount() {
        return apiFetch<{ unreadCount: number }>("/notifications/unread-count");
    },

    markRead(id: string) {
        return apiFetch<{ unreadCount: number }>(`/notifications/${id}/read`, {
            method: "PATCH",
        });
    },

    markAllRead() {
        return apiFetch<{ unreadCount: number }>("/notifications/read-all", {
            method: "PATCH",
        });
    },
};
