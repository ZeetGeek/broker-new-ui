import type { ApiLeadOption, ApiShowing, Paged } from "@/lib/api/broker-visits-map";
import { apiFetch } from "@/lib/api/client";

/**
 * Broker Visits client for `/slots/broker/*`. Converts API showings into the
 * Visits screen's shape once, here, so components never see API field names.
 */

export type VisitTab =
    "upcoming" | "running" | "needs_update" | "completed" | "not_attended" | "cancelled";
export type VisitSort = "start_asc" | "start_desc" | "booked_desc";
export type VisitDuration = 30 | 45 | 60;
export type VisitApiStatus = "scheduled" | "confirmed" | "completed" | "no_show" | "cancelled";

export type BrokerVisit = {
    id: string;
    leadId: string;
    clientId: string;
    clientName: string;
    clientPhone: string | null;
    /** Property owner; null when the API did not send one. */
    ownerName: string | null;
    ownerAvatarUrl: string | null;
    propertyId: string;
    propertyTitle: string;
    locality: string;
    city: string;
    /** On the broker's own exclusive listing (can be rescheduled). */
    isExclusive: boolean;
    startsAt: string;
    endsAt: string;
    durationMinutes: number;
    status: VisitApiStatus;
    notes: string;
    bookedAt: string;
    updatedAt: string;
};

export type VisitListQuery = {
    tab: VisitTab;
    search?: string;
    clientId?: string;
    propertyId?: string;
    leadId?: string;
    from?: string;
    to?: string;
    sort?: VisitSort;
    page?: number;
    limit?: number;
};

export type VisitListPage = {
    items: BrokerVisit[];
    total: number;
    page: number;
    totalPages: number;
    counts: Record<VisitTab, number>;
    clientOptions: { id: string; name: string }[];
    propertyOptions: { id: string; title: string }[];
    /** When a visit next starts or ends; refetch then so tabs stay right. */
    nextChangeAt: string | null;
};

/** A client with an open deal on one of the broker's exclusive listings. */
export type BookableLead = {
    leadId: string;
    clientId: string;
    clientName: string;
    propertyId: string;
    propertyTitle: string;
};

/** Counts and options come on page 1 only; later pages send null. */
type ApiVisitListPage = Paged<ApiShowing> & {
    counts?: Partial<Record<VisitTab, number>> | null;
    clientOptions?: { id: string; name: string }[] | null;
    propertyOptions?: { id: string; title: string }[] | null;
    nextChangeAt?: string | null;
};

type ApiExclusiveOpen = {
    items?: Array<{ property: { id: string }; slots: Array<{ startAt: string }> }>;
    leadOptions?: ApiLeadOption[];
};

const EMPTY_COUNTS: Record<VisitTab, number> = {
    upcoming: 0,
    running: 0,
    needs_update: 0,
    completed: 0,
    not_attended: 0,
    cancelled: 0,
};

const DEFAULT_VISIT_MINUTES = 30;
const VISIT_STATUSES: VisitApiStatus[] = [
    "scheduled",
    "confirmed",
    "completed",
    "no_show",
    "cancelled",
];

/** Query string for the bookings list; empty values are left out. */
export function visitListParams(q: VisitListQuery): URLSearchParams {
    const params = new URLSearchParams();
    const set = (key: string, value: string | number | undefined) => {
        const text = value == null ? "" : String(value).trim();
        if (text) params.set(key, text);
    };
    set("tab", q.tab);
    set("search", q.search);
    set("clientId", q.clientId);
    set("propertyId", q.propertyId);
    set("leadId", q.leadId);
    set("from", q.from);
    set("to", q.to);
    set("sort", q.sort);
    set("page", q.page);
    set("limit", q.limit);
    return params;
}

export function mapShowing(api: ApiShowing): BrokerVisit {
    const startsAt = new Date(api.scheduledDate).toISOString();
    const endsAt = new Date(
        api.endAt ??
            api.visitSlot?.endAt ??
            Date.parse(api.scheduledDate) + DEFAULT_VISIT_MINUTES * 60_000,
    ).toISOString();
    const address = api.property?.address?.split(",")[0]?.trim();
    const city = api.property?.city ?? "";
    const status = VISIT_STATUSES.includes(api.status as VisitApiStatus)
        ? (api.status as VisitApiStatus)
        : "scheduled";
    return {
        id: api.id,
        leadId: api.leadId,
        clientId: api.client?.id ?? "",
        clientName: api.client?.name?.trim() || "Client",
        clientPhone: api.client?.phone || null,
        ownerName: api.owner?.fullName?.trim() || null,
        ownerAvatarUrl: api.owner?.avatarUrl || null,
        propertyId: api.propertyId,
        propertyTitle: api.property?.title?.trim() || "Property",
        locality: address || city,
        city,
        isExclusive: api.listingSource === "exclusive",
        startsAt,
        endsAt,
        durationMinutes: Math.round((Date.parse(endsAt) - Date.parse(startsAt)) / 60_000),
        status,
        notes: api.notes ?? "",
        bookedAt: api.createdAt ?? startsAt,
        updatedAt: api.updatedAt ?? api.createdAt ?? startsAt,
    };
}

function json(method: "POST" | "PATCH", body: unknown) {
    return {
        method,
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    };
}

export const siteVisitsApi = {
    async list(q: VisitListQuery): Promise<VisitListPage> {
        const response = await apiFetch<ApiVisitListPage>(
            `/slots/broker/bookings?${visitListParams(q)}`,
        );
        return {
            items: (response.items ?? []).map(mapShowing),
            total: response.total ?? 0,
            page: response.page ?? q.page ?? 1,
            totalPages: Math.max(1, response.totalPages ?? 1),
            counts: { ...EMPTY_COUNTS, ...response.counts },
            clientOptions: response.clientOptions ?? [],
            propertyOptions: response.propertyOptions ?? [],
            nextChangeAt: response.nextChangeAt ?? null,
        };
    },

    /** The deal's earliest visit that is not yet marked or cancelled. */
    async activeForLead(leadId: string): Promise<BrokerVisit | null> {
        const params = new URLSearchParams({
            tab: "active",
            leadId,
            sort: "start_asc",
            limit: "1",
        });
        const response = await apiFetch<Paged<ApiShowing>>(`/slots/broker/bookings?${params}`);
        const first = response.items?.[0];
        return first ? mapShowing(first) : null;
    },

    /** Deals the broker can book a visit for (exclusive listings, open deals). */
    async bookable(): Promise<BookableLead[]> {
        const response = await apiFetch<ApiExclusiveOpen>(
            "/slots/broker/exclusive/open?leadsOnly=true",
        );
        return (response.leadOptions ?? [])
            .filter((lead) => lead.clientId)
            .map((lead) => ({
                leadId: lead.id,
                clientId: lead.clientId as string,
                clientName: lead.buyerName,
                propertyId: lead.propertyId,
                propertyTitle: lead.propertyTitle,
            }));
    },

    /** Free start times (ISO) on one listing and IST date for this length. */
    async freeTimes(a: {
        propertyId: string;
        leadId?: string;
        date: string;
        durationMinutes: VisitDuration;
        excludeShowingId?: string;
    }): Promise<string[]> {
        const params = new URLSearchParams({
            propertyId: a.propertyId,
            from: a.date,
            to: a.date,
            durationMinutes: String(a.durationMinutes),
        });
        if (a.leadId) params.set("leadId", a.leadId);
        if (a.excludeShowingId) params.set("excludeShowingId", a.excludeShowingId);
        const response = await apiFetch<ApiExclusiveOpen>(`/slots/broker/exclusive/open?${params}`);
        const item = response.items?.find((entry) => entry.property.id === a.propertyId);
        return (item?.slots ?? []).map((slot) => new Date(slot.startAt).toISOString());
    },

    async book(a: {
        propertyId: string;
        leadId: string;
        startAt: string;
        durationMinutes: VisitDuration;
        notes?: string;
    }): Promise<void> {
        await apiFetch("/slots/broker/exclusive/book", json("POST", a));
    },

    async reschedule(
        id: string,
        a: { startAt: string; durationMinutes: VisitDuration; notes?: string },
    ): Promise<BrokerVisit> {
        return mapShowing(
            await apiFetch<ApiShowing>(`/slots/broker/showings/${id}/reschedule`, json("PATCH", a)),
        );
    },

    async cancel(id: string): Promise<void> {
        await apiFetch(`/slots/broker/showings/${id}/cancel`, { method: "PATCH" });
    },

    async setOutcome(id: string, status: "completed" | "no_show"): Promise<BrokerVisit> {
        return mapShowing(
            await apiFetch<ApiShowing>(
                `/slots/broker/showings/${id}/outcome`,
                json("PATCH", { status }),
            ),
        );
    },
};
