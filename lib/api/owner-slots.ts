import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";

export type VisitSlotStatus = "open" | "closed" | "booked";

export type VisitSlot = {
    id: string;
    propertyId: string;
    ownerId: string;
    startAt: string;
    endAt: string;
    status: VisitSlotStatus;
    showingId?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    property?: {
        id: string;
        title?: string | null;
        city?: string;
        address?: string | null;
    } | null;
    booking?: {
        id: string;
        brokerId: string;
        clientId?: string | null;
        status?: string | null;
        scheduledDate?: string;
        notes?: string | null;
    } | null;
};

export type ShowingStatus =
    | "scheduled"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "no_show";

export type VisitShowing = {
    id: string;
    leadId?: string;
    propertyId: string;
    visitSlotId?: string | null;
    scheduledDate: string;
    status?: ShowingStatus | null;
    notes?: string | null;
    createdAt?: string | null;
    lead?: {
        id: string;
        stage?: string | null;
    } | null;
    property?: {
        id: string;
        title?: string | null;
        city?: string;
        address?: string | null;
        photos?: string[] | null;
    } | null;
    broker?: {
        id: string;
        fullName?: string | null;
        avatarUrl?: string | null;
    } | null;
};

export type OwnerShowingFocus =
    | "today"
    | "tomorrow"
    | "awaiting"
    | "confirmed"
    | "week"
    | "cancelled";

export type OwnerShowingsSummary = {
    total: number;
    today: number;
    tomorrow: number;
    awaitingOwner: number;
    confirmed: number;
    week: number;
    cancelled: number;
};

export type OwnerShowingsPage = PagedResult<VisitShowing> & {
    summary: OwnerShowingsSummary;
};

export type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type CreateBulkSlotsInput = {
    propertyId: string;
    dates: string[];
    from: string;
    to: string;
    slotLength: 30 | 60;
};

export type BulkSlotsResult = {
    planned: number;
    created: number;
    skipped: number;
    slots: VisitSlot[];
};

const EMPTY_PAGE = <T,>(): PagedResult<T> => ({
    items: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
});

const EMPTY_SHOWINGS_PAGE = (): OwnerShowingsPage => ({
    ...EMPTY_PAGE<VisitShowing>(),
    summary: {
        total: 0,
        today: 0,
        tomorrow: 0,
        awaitingOwner: 0,
        confirmed: 0,
        week: 0,
        cancelled: 0,
    },
});

export const ownerSlotsApi = {
    list(params?: {
        propertyId?: string;
        status?: VisitSlotStatus;
        page?: number;
        limit?: number;
    }) {
        if (isMockMode()) return Promise.resolve(EMPTY_PAGE<VisitSlot>());
        const q = new URLSearchParams();
        if (params?.propertyId) q.set("propertyId", params.propertyId);
        if (params?.status) q.set("status", params.status);
        if (params?.page) q.set("page", String(params.page));
        if (params?.limit) q.set("limit", String(params.limit));
        const qs = q.toString();
        return apiFetch<PagedResult<VisitSlot>>(`/slots/owner${qs ? `?${qs}` : ""}`);
    },

    create(body: { propertyId: string; startAt: string; endAt: string }) {
        return apiFetch<VisitSlot>("/slots", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },

    bulkCreate(body: CreateBulkSlotsInput) {
        return apiFetch<BulkSlotsResult>("/slots/bulk", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },

    close(slotId: string) {
        return apiFetch<VisitSlot>(`/slots/${slotId}/close`, { method: "PATCH" });
    },

    remove(slotId: string) {
        return apiFetch<{ message: string }>(`/slots/${slotId}`, { method: "DELETE" });
    },

    showings(params?: {
        propertyId?: string;
        status?: ShowingStatus;
        focus?: OwnerShowingFocus;
        from?: string;
        to?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        if (isMockMode()) return Promise.resolve(EMPTY_SHOWINGS_PAGE());
        const q = new URLSearchParams();
        if (params?.propertyId) q.set("propertyId", params.propertyId);
        if (params?.status) q.set("status", params.status);
        if (params?.focus) q.set("focus", params.focus);
        if (params?.from) q.set("from", params.from);
        if (params?.to) q.set("to", params.to);
        if (params?.search) q.set("search", params.search);
        if (params?.page) q.set("page", String(params.page));
        if (params?.limit) q.set("limit", String(params.limit));
        const qs = q.toString();
        return apiFetch<OwnerShowingsPage>(`/slots/owner/showings${qs ? `?${qs}` : ""}`);
    },

    updateShowingStatus(showingId: string, status: "confirmed" | "cancelled") {
        return apiFetch<VisitShowing>(`/slots/owner/showings/${showingId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
    },
};
