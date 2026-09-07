import { MOCK_BROKER_REQUESTS } from "@/features/properties/your-listings/mock-my-listings";
import type {
    BrokerRequestItem,
    BrokerRequestStatusFilter,
    BrokerRequestsResult,
} from "@/features/properties/your-listings/types";

function delay(ms = 240): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusMatches(item: BrokerRequestItem, filter: BrokerRequestStatusFilter): boolean {
    if (filter === "all") return true;
    if (filter === "pending") return item.type === "pending" || item.type === "pending_stale";
    if (filter === "approved") {
        return item.type === "approved" || item.type === "approved_untouched";
    }
    return item.type === "declined";
}

export const brokerRequestsApi = {
    async list(status: BrokerRequestStatusFilter = "all"): Promise<BrokerRequestsResult> {
        await delay();
        const items = MOCK_BROKER_REQUESTS.items.filter((item) => statusMatches(item, status));
        return {
            counts: { ...MOCK_BROKER_REQUESTS.counts },
            quota: { ...MOCK_BROKER_REQUESTS.quota },
            items,
        };
    },
};
