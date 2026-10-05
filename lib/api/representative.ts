import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";

export type RepresentationRespondStatus = "accepted" | "rejected";

export type RepresentationRespondBody = {
    status: RepresentationRespondStatus;
    message?: string;
};

export type RepresentationMessage = {
    id: string;
    representationId: string;
    sender: "owner" | "broker";
    body: string;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    attachmentMime?: string | null;
    attachmentSize?: number | null;
    createdAt: string | null;
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
    brokerName?: string | null;
    brokerDisplayName?: string | null;
    brokerIsAgency?: boolean;
    brokerPhone?: string | null;
    brokerEmail?: string | null;
    brokerAvatarUrl?: string | null;
    brokerOrgName?: string | null;
    brokerVerified?: boolean;
    brokerRating?: string | null;
    brokerRatingCount?: number;
    brokerExperienceYears?: number | null;
    brokerServiceAreas?: string[];
};

export type BrokerProfile = {
    id: string;
    userId?: string;
    fullName?: string | null;
    displayName?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    avatarUrl?: string | null;
    orgName?: string | null;
    accountType?: string | null;
    isAgency?: boolean;
    agencyId?: string | null;
    agencyStaffCount?: number;
    accountHolderName?: string | null;
    experienceYears?: number | null;
    specializations?: string[];
    serviceAreas?: string[];
    licenseNumber?: string | null;
    reraState?: string | null;
    rating?: string | null;
    ratingCount?: number | null;
    verified?: boolean | null;
    dealsClosed?: number | null;
    avgDaysToClose?: number | null;
    bio?: string | null;
    publicSlug?: string | null;
};

export type RepresentationListPage = {
    items: RepresentationItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    /** Opaque keyset token for the next page; null on the last one. */
    nextCursor?: string | null;
    hasMore?: boolean;
};

export type OwnerRepQueueSort = "recent" | "oldest";

export type BrokerInvitationListQuery = {
    /** `pending` (default server-side), `accepted`, `rejected`, `closed`, or `all`. */
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
};

export type OwnerRepQueueQuery = {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    /** Previous page's `nextCursor`; omit for the first page. */
    cursor?: string;
    sort?: OwnerRepQueueSort;
};

export type OwnerBrokersSort = "relevance" | "experience" | "deals" | "name";

export type OwnerBrokersQuery = {
    search?: string;
    city?: string;
    verifiedOnly?: boolean;
    minExperience?: number;
    /** One specialization, matched without regard to case. */
    specialty?: string;
    sort?: OwnerBrokersSort;
    page?: number;
    limit?: number;
    /** Previous page's `nextCursor`; omit for the first page. */
    cursor?: string;
};

export type OwnerBrokersPage = Omit<RepresentationListPage, "items"> & {
    items: BrokerProfile[];
    /** Whole-pool specializations, most common first — first page only. */
    specialties?: { label: string; count: number }[];
};

function queueQuery(params?: OwnerRepQueueQuery): string {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    if (params?.page != null && params.page > 1) q.set("page", String(params.page));
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.cursor) q.set("cursor", params.cursor);
    if (params?.sort) q.set("sort", params.sort);
    return q.toString();
}

export const representativeApi = {
    requestRepresentation(propertyId: string, message?: string) {
        if (isMockMode()) {
            return Promise.resolve({
                id: `rep_${propertyId}`,
                propertyId,
                status: "pending",
                initiatedBy: "broker",
                message: message ?? null,
                createdAt: new Date().toISOString(),
            } satisfies RepresentationItem);
        }
        return apiFetch<RepresentationItem>("/representative/broker/request", {
            method: "POST",
            body: JSON.stringify({ propertyId, ...(message ? { message } : {}) }),
        });
    },

    /** Broker-side representations (outbound requests + inbound invites). */
    brokerList(status?: string) {
        if (isMockMode()) return Promise.resolve([]);
        const qs = status ? `?status=${encodeURIComponent(status)}` : "";
        return apiFetch<RepresentationItem[]>(`/representative/broker/list${qs}`);
    },

    /**
     * Owner → broker invitations for this agency.
     * Without page/limit the API returns the full array; with either it pages.
     */
    brokerInvitationList(params?: BrokerInvitationListQuery) {
        if (isMockMode()) return Promise.resolve([]);
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
        if (isMockMode()) {
            return Promise.resolve({
                id: representationId,
                propertyId: "",
                status: "pending",
                initiatedBy: "broker",
            } satisfies RepresentationItem);
        }
        return apiFetch<RepresentationItem>(`/representative/${representationId}/remind`, {
            method: "POST",
        });
    },

    withdraw(representationId: string) {
        if (isMockMode()) {
            return Promise.resolve({
                id: representationId,
                propertyId: "",
                status: "withdrawn",
                initiatedBy: "broker",
            } satisfies RepresentationItem);
        }
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
        if (isMockMode()) {
            return Promise.resolve({
                id: representationId,
                propertyId: "",
                status: body.status === "accepted" ? "accepted" : "rejected",
                initiatedBy: "owner",
            } satisfies RepresentationItem);
        }
        return apiFetch<RepresentationItem>(`/representative/${representationId}/broker/respond`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },

    messages(representationId: string) {
        return apiFetch<RepresentationMessage[]>(`/representative/${representationId}/messages`);
    },

    /**
     * Text and/or document. JSON when text-only; multipart when a file is attached
     * so the old text contract still works.
     */
    addMessage(representationId: string, input: { message?: string; file?: File }) {
        if (input.file) {
            const form = new FormData();
            if (input.message?.trim()) form.append("message", input.message.trim());
            form.append("file", input.file);
            return apiFetch<RepresentationMessage>(`/representative/${representationId}/message`, {
                method: "POST",
                body: form,
            });
        }

        return apiFetch<RepresentationMessage>(`/representative/${representationId}/message`, {
            method: "POST",
            body: JSON.stringify({ message: input.message?.trim() ?? "" }),
        });
    },

    /** Owner: full representation list (badge counts). */
    ownerList(status?: string) {
        if (isMockMode()) return Promise.resolve([]);
        const qs = status ? `?status=${encodeURIComponent(status)}` : "";
        return apiFetch<RepresentationItem[]>(`/representative/owner/list${qs}`);
    },

    ownerRequestList(status?: string) {
        if (isMockMode()) return Promise.resolve([]);
        const qs = status ? `?status=${encodeURIComponent(status)}` : "";
        return apiFetch<RepresentationItem[]>(`/representative/owner/request/list${qs}`);
    },

    ownerRequestPage(params?: OwnerRepQueueQuery, signal?: AbortSignal) {
        if (isMockMode()) {
            return Promise.resolve<RepresentationListPage>({
                items: [],
                total: 0,
                page: 1,
                limit: 12,
                totalPages: 0,
                nextCursor: null,
                hasMore: false,
            });
        }
        return apiFetch<RepresentationListPage>(
            `/representative/owner/request/list?${queueQuery(params)}`,
            { signal },
        );
    },

    ownerInvitationList(status?: string) {
        if (isMockMode()) return Promise.resolve([]);
        const qs = status ? `?status=${encodeURIComponent(status)}` : "";
        return apiFetch<RepresentationItem[]>(`/representative/owner/invitation/list${qs}`);
    },

    ownerInvitationPage(params?: OwnerRepQueueQuery, signal?: AbortSignal) {
        if (isMockMode()) {
            return Promise.resolve<RepresentationListPage>({
                items: [],
                total: 0,
                page: 1,
                limit: 12,
                totalPages: 0,
                nextCursor: null,
                hasMore: false,
            });
        }
        return apiFetch<RepresentationListPage>(
            `/representative/owner/invitation/list?${queueQuery(params)}`,
            { signal },
        );
    },

    ownerActiveList() {
        if (isMockMode()) return Promise.resolve([]);
        return apiFetch<RepresentationItem[]>(`/representative/owner/active/list`);
    },

    ownerActivePage(params?: Omit<OwnerRepQueueQuery, "status">, signal?: AbortSignal) {
        if (isMockMode()) {
            return Promise.resolve<RepresentationListPage>({
                items: [],
                total: 0,
                page: 1,
                limit: 12,
                totalPages: 0,
                nextCursor: null,
                hasMore: false,
            });
        }
        return apiFetch<RepresentationListPage>(
            `/representative/owner/active/list?${queueQuery(params)}`,
            { signal },
        );
    },

    ownerBrokers(params?: OwnerBrokersQuery, signal?: AbortSignal) {
        if (isMockMode()) {
            return Promise.resolve<OwnerBrokersPage>({
                items: [],
                total: 0,
                page: 1,
                limit: 12,
                totalPages: 0,
                nextCursor: null,
                hasMore: false,
            });
        }
        const q = new URLSearchParams();
        if (params?.search) q.set("search", params.search);
        if (params?.city) q.set("city", params.city);
        if (params?.verifiedOnly) q.set("verifiedOnly", "true");
        if (params?.minExperience) q.set("minExperience", String(params.minExperience));
        if (params?.specialty) q.set("specialty", params.specialty);
        if (params?.sort) q.set("sort", params.sort);
        if (params?.page != null && params.page > 1) q.set("page", String(params.page));
        if (params?.limit != null) q.set("limit", String(params.limit));
        if (params?.cursor) q.set("cursor", params.cursor);
        const qs = q.toString();
        return apiFetch<OwnerBrokersPage>(`/representative/owner/brokers${qs ? `?${qs}` : ""}`, {
            signal,
        });
    },

    ownerBrokerProfile(brokerId: string) {
        return apiFetch<BrokerProfile>(`/representative/owner/brokers/${brokerId}`);
    },

    ownerInvite(body: { propertyId: string; brokerId: string; message?: string }) {
        return apiFetch("/representative/owner/invite", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },
};

function representationListItems(
    result: RepresentationItem[] | RepresentationListPage | unknown,
): RepresentationItem[] {
    if (Array.isArray(result)) return result;
    if (
        result &&
        typeof result === "object" &&
        "items" in result &&
        Array.isArray((result as RepresentationListPage).items)
    ) {
        return (result as RepresentationListPage).items;
    }
    return [];
}

/** Browse payloads sometimes omit `representation.id` on pending rows. */
export async function findPendingBrokerRepresentationId(
    propertyId: string,
): Promise<string | undefined> {
    const items = representationListItems(await representativeApi.brokerList("pending"));
    const match = items.find((row) => {
        const extra = row as RepresentationItem & { property_id?: string };
        const rowPropertyId = row.propertyId?.trim() || extra.property_id?.trim();
        if (rowPropertyId !== propertyId) return false;
        return row.initiatedBy !== "owner";
    });
    return match?.id;
}

/** Browse payloads sometimes omit `representation.id` on owner invites. */
export async function findPendingOwnerInvitationId(
    propertyId: string,
): Promise<string | undefined> {
    const items = representationListItems(
        await representativeApi.brokerInvitationList({ status: "pending" }),
    );
    const match = items.find((row) => {
        const extra = row as RepresentationItem & { property_id?: string };
        const rowPropertyId = row.propertyId?.trim() || extra.property_id?.trim();
        return rowPropertyId === propertyId;
    });
    return match?.id;
}
