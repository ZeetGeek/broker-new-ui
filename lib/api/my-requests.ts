import { attachedClientsByProperty } from "@/lib/api/clients";
import { dashboardApi, type DashboardRequestQuota } from "@/lib/api/dashboard";
import { representativeApi } from "@/lib/api/representative";
import { formatDateIso } from "@/lib/format/date";

import {
    filterRequests,
    sortRequests,
    summarizeRequests,
} from "@/features/properties/my-requests/filter-requests";
import { mapRepresentationToRequestItem } from "@/features/properties/my-requests/map-my-request";
import type {
    RequestItem,
    RequestsFilters,
    RequestsResult,
    RequestsSummary,
} from "@/features/properties/my-requests/types";

async function loadOutboundRequests() {
    const rows = await representativeApi.brokerList();
    return rows
        .map((row) => mapRepresentationToRequestItem(row))
        .filter((item): item is NonNullable<typeof item> => item != null);
}

async function loadQuota(): Promise<RequestsSummary["quota"]> {
    try {
        const dashboard = await dashboardApi.get();
        const quota = dashboard.summary?.requestQuota as DashboardRequestQuota | undefined;
        if (quota && typeof quota === "object") {
            return {
                limit: Number(quota.limit) || 10,
                used: Number(quota.used) || 0,
                remaining: Number(quota.remaining) || 0,
                resetsOn: String(quota.resetsOn || formatDateIso(new Date())),
            };
        }
    } catch {
        // Fall through to a safe default when dashboard is unavailable.
    }
    return {
        limit: 10,
        used: 0,
        remaining: 10,
        resetsOn: formatDateIso(new Date()),
    };
}

function withClientCount(
    item: RequestItem,
    attachedByProperty: Map<string, { id: string; name: string }[]>,
): RequestItem {
    const attached = attachedByProperty.get(item.propertyId) ?? [];
    return {
        ...item,
        clientsAttached: attached.length,
        attachedClients: attached.map((client) => ({ id: client.id, name: client.name })),
    };
}

export const myRequestsApi = {
    async list(filters: RequestsFilters): Promise<RequestsResult> {
        const [items, attachedByProperty] = await Promise.all([
            loadOutboundRequests(),
            attachedClientsByProperty(),
        ]);
        const live = items.map((item) => withClientCount(item, attachedByProperty));
        const matched = sortRequests(filterRequests(live, filters), filters.sort);
        const totalPages = Math.max(1, Math.ceil(matched.length / filters.limit));
        const page = Math.min(Math.max(1, filters.page), totalPages);
        const start = (page - 1) * filters.limit;

        return {
            items: matched.slice(start, start + filters.limit),
            total: matched.length,
            page,
            totalPages,
        };
    },

    /** Summary is over the whole set, not the filtered page. */
    async summary(): Promise<RequestsSummary> {
        const [items, quota, attachedByProperty] = await Promise.all([
            loadOutboundRequests(),
            loadQuota(),
            attachedClientsByProperty(),
        ]);
        return summarizeRequests(
            items.map((item) => withClientCount(item, attachedByProperty)),
            quota,
        );
    },

    /** Send a reminder to the owner (max REMINDER_LIMIT per pending attempt). */
    async nudge(requestId: string): Promise<void> {
        await representativeApi.remind(requestId);
    },

    /** Withdraw the current pending attempt. */
    async withdraw(requestId: string): Promise<void> {
        await representativeApi.withdraw(requestId);
    },

    /** Open the next request attempt on the same property. */
    async retry(requestId: string): Promise<void> {
        const rows = await representativeApi.brokerList();
        const target = rows.find((row) => row.id === requestId);
        if (!target?.propertyId) {
            throw new Error("Request not found");
        }
        await representativeApi.requestRepresentation(target.propertyId);
    },
};
