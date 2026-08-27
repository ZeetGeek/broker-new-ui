import { apiFetch } from "@/lib/api/client";

export type NotificationItem = {
    id: string;
    userId: string;
    actorUserId: string | null;
    type: string | null;
    title: string;
    body: string | null;
    href: string | null;
    referenceType: string | null;
    referenceId: string | null;
    relatedPropertyId: string | null;
    relatedRepresentationId: string | null;
    relatedLeadId: string | null;
    metadata: Record<string, unknown> | null;
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
    list(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
        const q = new URLSearchParams();
        if (params?.page) q.set("page", String(params.page));
        if (params?.limit) q.set("limit", String(params.limit));
        if (params?.unreadOnly) q.set("unreadOnly", "true");
        const qs = q.toString();
        return apiFetch<NotificationListResponse>(`/notifications${qs ? `?${qs}` : ""}`);
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
