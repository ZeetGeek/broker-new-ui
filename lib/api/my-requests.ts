import { attachedClientsByProperty } from "@/lib/api/clients";
import { dashboardApi, type DashboardRequestQuota } from "@/lib/api/dashboard";
import { isMockMode } from "@/lib/api/mock-mode";
import { representativeApi } from "@/lib/api/representative";
import { formatDateIso } from "@/lib/format/date";

import {
    filterRequests,
    sortRequests,
    summarizeRequests,
} from "@/features/properties/my-requests/filter-requests";
import { mapRepresentationToRequestItem } from "@/features/properties/my-requests/map-my-request";
import { MOCK_REQUESTS, MOCK_REQUESTS_QUOTA } from "@/features/properties/my-requests/mock-requests";
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
        if (isMockMode()) {
            const matched = sortRequests(filterRequests(MOCK_REQUESTS, filters), filters.sort);
            return {
                items: matched,
                total: matched.length,
                page: 1,
                totalPages: 1,
            };
        }
        const [items, attachedByProperty] = await Promise.all([
            loadOutboundRequests(),
            attachedClientsByProperty(),
        ]);
        const live = items.map((item) => withClientCount(item, attachedByProperty));
        const matched = sortRequests(filterRequests(live, filters), filters.sort);
        return {
            items: matched,
            total: matched.length,
            page: 1,
            totalPages: 1,
        };
    },

    /** Summary is over the whole set, not the filtered page. */
    async summary(): Promise<RequestsSummary> {
        if (isMockMode()) {
            return summarizeRequests(MOCK_REQUESTS, MOCK_REQUESTS_QUOTA);
        }
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
    async nudge(_requestId: string): Promise<void> {
        if (isMockMode()) return;
        await representativeApi.remind(_requestId);
    },

    /** Withdraw the current pending attempt. */
    async withdraw(_requestId: string): Promise<void> {
        if (isMockMode()) return;
        await representativeApi.withdraw(_requestId);
    },

    /** Open the next request attempt on the same property. */
    async retry(requestId: string): Promise<void> {
        if (isMockMode()) return;
        const rows = await representativeApi.brokerList();
        const target = rows.find((row) => row.id === requestId);
        if (!target?.propertyId) {
            throw new Error("Request not found");
        }
        await representativeApi.requestRepresentation(target.propertyId);
    },
};
