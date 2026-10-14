import type { RepresentationItem } from "@/lib/api/representative";

export type PropertyBroker = { id: string; name: string; avatarUrl?: string };

export type PropertyBrokersSummary = {
    brokers: PropertyBroker[];
    pendingInvitations: PropertyBroker[];
    pendingRequests: PropertyBroker[];
};

export function summarizePropertyBrokers(
    representations: RepresentationItem[],
    now = Date.now(),
): Map<string, PropertyBrokersSummary> {
    const properties = new Map<string, PropertyBrokersSummary>();
    const current = representations.filter(
        (row) =>
            (row.status === "accepted" || row.status === "pending") &&
            (!row.endsAt || Date.parse(row.endsAt) > now),
    );

    // Accepted consent wins over a duplicate pending attempt for the same broker.
    current.sort((a, b) => Number(b.status === "accepted") - Number(a.status === "accepted"));
    const seen = new Set<string>();
    for (const row of current) {
        if (!row.propertyId || !row.brokerId) continue;
        const key = JSON.stringify([row.propertyId, row.brokerId]);
        if (seen.has(key)) continue;
        seen.add(key);
        const summary = properties.get(row.propertyId) ?? {
            brokers: [],
            pendingInvitations: [],
            pendingRequests: [],
        };
        const broker = {
            id: row.brokerId,
            name:
                row.brokerDisplayName?.trim() ||
                row.brokerName?.trim() ||
                row.brokerOrgName?.trim() ||
                "Broker",
            avatarUrl: row.brokerAvatarUrl || undefined,
        };
        if (row.status === "accepted") summary.brokers.push(broker);
        else if (row.initiatedBy === "owner") summary.pendingInvitations.push(broker);
        else summary.pendingRequests.push(broker);
        properties.set(row.propertyId, summary);
    }
    return properties;
}
