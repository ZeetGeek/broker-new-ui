import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";
import { toApiUtcParts } from "@/lib/datetime/api";
import { formatTimeIn } from "@/lib/format/date";

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

export type ShowingStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";

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
    "today" | "tomorrow" | "awaiting" | "confirmed" | "week" | "cancelled";

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

/** Dates and times are the user's local wall clock; `bulkCreate` sends them in UTC. */
export type CreateBulkSlotsInput = {
    propertyId: string;
    dates: string[];
    from: string;
    to: string;
    slotLength: 30 | 60;
};

/**
 * The bulk API takes one `from`–`to` per UTC day, so a local range that spans
 * midnight UTC (5:30 am in India) cannot be sent.
 */
export class SlotRangeCrossesUtcDayError extends Error {
    constructor(utcMidnight: Date) {
        super(
            `These times can't be added together. Add slots before and after ${formatTimeIn(utcMidnight)} separately.`,
        );
        this.name = "SlotRangeCrossesUtcDayError";
    }
}

/**
 * Local dates + times → UTC bulk payloads. Dates whose UTC times differ (a DST
 * change) go in separate requests; India has no DST, so this is normally one.
 */
function toUtcBulkPayloads(input: CreateBulkSlotsInput): CreateBulkSlotsInput[] {
    const groups = new Map<string, CreateBulkSlotsInput>();
    for (const date of input.dates) {
        const start = toApiUtcParts(date, input.from);
        const end = toApiUtcParts(date, input.to);
        if (end.date !== start.date) {
            throw new SlotRangeCrossesUtcDayError(new Date(`${end.date}T00:00:00Z`));
        }
        const key = `${start.time}|${end.time}`;
        const group = groups.get(key);
        if (group) {
            group.dates.push(start.date);
        } else {
            groups.set(key, { ...input, dates: [start.date], from: start.time, to: end.time });
        }
    }
    return [...groups.values()];
}

export type BulkSlotsResult = {
    planned: number;
    created: number;
    skipped: number;
    slots: VisitSlot[];
};

const EMPTY_PAGE = <T>(): PagedResult<T> => ({
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

    async bulkCreate(input: CreateBulkSlotsInput): Promise<BulkSlotsResult> {
        const results = await Promise.all(
            toUtcBulkPayloads(input).map((body) =>
                apiFetch<BulkSlotsResult>("/slots/bulk", {
                    method: "POST",
                    body: JSON.stringify(body),
                }),
            ),
        );
        return results.reduce(
            (total, result) => ({
                planned: total.planned + result.planned,
                created: total.created + result.created,
                skipped: total.skipped + result.skipped,
                slots: [...total.slots, ...result.slots],
            }),
            { planned: 0, created: 0, skipped: 0, slots: [] },
        );
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
