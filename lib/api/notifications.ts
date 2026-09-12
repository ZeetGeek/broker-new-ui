import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";

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
        if (isMockMode()) {
            const items: NotificationItem[] = [
                {
                    id: "nt_001",
                    userId: "user_design_broker",
                    actorUserId: "owner_1",
                    type: "representation_approved",
                    title: "Jayesh P. approved your request",
                    body: "1 BHK · Pal · you can add a buyer now",
                    href: "/broker/requests",
                    referenceType: "representation",
                    referenceId: "req_042",
                    relatedPropertyId: "pr_099",
                    relatedRepresentationId: "req_042",
                    relatedLeadId: null,
                    metadata: null,
                    representationStatus: "accepted",
                    isRead: false,
                    readAt: null,
                    createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
                },
                {
                    id: "nt_002",
                    userId: "user_design_broker",
                    actorUserId: null,
                    type: "visit_approved",
                    title: "Owner confirmed today's Vesu visit",
                    body: "3 BHK · 2:11 PM · Milan Vamja",
                    href: "/broker/visits",
                    referenceType: "visit",
                    referenceId: "visit_02",
                    relatedPropertyId: "pr_108",
                    relatedRepresentationId: null,
                    relatedLeadId: "dl_003",
                    metadata: null,
                    representationStatus: null,
                    isRead: false,
                    readAt: null,
                    createdAt: new Date(Date.now() - 4 * 3_600_000).toISOString(),
                },
                {
                    id: "nt_003",
                    userId: "user_design_broker",
                    actorUserId: "owner_2",
                    type: "invite_received",
                    title: "Hitesh Ranpura invited you to represent a listing",
                    body: "4 BHK penthouse · Piplod",
                    href: "/broker/requests",
                    referenceType: "invite",
                    referenceId: "inv_004",
                    relatedPropertyId: "pr_210",
                    relatedRepresentationId: "inv_004",
                    relatedLeadId: null,
                    metadata: null,
                    representationStatus: "pending",
                    isRead: true,
                    readAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
                    createdAt: new Date(Date.now() - 28 * 3_600_000).toISOString(),
                },
            ];
            const unread = items.filter((item) => !item.isRead);
            const visible = params?.unreadOnly ? unread : items;
            return Promise.resolve({
                page: params?.page ?? 1,
                limit: params?.limit ?? 20,
                total: visible.length,
                unreadCount: unread.length,
                items: visible,
            });
        }
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
        if (isMockMode()) {
            return Promise.resolve({ unreadCount: 2 });
        }
        return apiFetch<{ unreadCount: number }>("/notifications/unread-count");
    },

    markRead(id: string) {
        if (isMockMode()) {
            return Promise.resolve({ unreadCount: 1 });
        }
        return apiFetch<{ unreadCount: number }>(`/notifications/${id}/read`, {
            method: "PATCH",
        });
    },

    markAllRead() {
        if (isMockMode()) {
            return Promise.resolve({ unreadCount: 0 });
        }
        return apiFetch<{ unreadCount: number }>("/notifications/read-all", {
            method: "PATCH",
        });
    },
};
