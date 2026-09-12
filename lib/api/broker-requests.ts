import { dashboardApi, type DashboardRequestQuota } from "@/lib/api/dashboard";
import { isMockMode } from "@/lib/api/mock-mode";
import { representativeApi } from "@/lib/api/representative";

import { mapBrokerRequests } from "@/features/properties/your-listings/map-broker-request";
import { MOCK_BROKER_REQUESTS } from "@/features/properties/your-listings/mock-my-listings";
import type {
    BrokerRequestsResult,
    BrokerRequestStatusFilter,
} from "@/features/properties/your-listings/types";

function statusMatches(
    itemType: BrokerRequestsResult["items"][number]["type"],
    filter: BrokerRequestStatusFilter,
): boolean {
    if (filter === "all") return true;
    if (filter === "pending") return itemType === "pending" || itemType === "pending_stale";
    if (filter === "approved") {
        return itemType === "approved" || itemType === "approved_untouched";
    }
    return itemType === "declined";
}

export const brokerRequestsApi = {
    async list(status: BrokerRequestStatusFilter = "all"): Promise<BrokerRequestsResult> {
        if (isMockMode()) {
            return {
                counts: MOCK_BROKER_REQUESTS.counts,
                quota: MOCK_BROKER_REQUESTS.quota,
                items: MOCK_BROKER_REQUESTS.items.filter((item) => statusMatches(item.type, status)),
            };
        }
        const [reps, dashboard] = await Promise.all([
            representativeApi.brokerList(),
            dashboardApi.get().catch(() => null),
        ]);

        const quota = dashboard?.summary?.requestQuota as DashboardRequestQuota | undefined;
        const mapped = mapBrokerRequests(reps, quota);
        return {
            counts: mapped.counts,
            quota: mapped.quota,
            items: mapped.items.filter((item) => statusMatches(item.type, status)),
        };
    },

    async remind(_requestId: string): Promise<void> {
        if (isMockMode()) return;
        await representativeApi.remind(_requestId);
    },
};
