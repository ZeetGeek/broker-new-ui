import { formatPrice } from "@/lib/format/price";
import { isVisitCancelled } from "@/lib/visits/status";
import { istDateKey } from "@/lib/visits/time";

import type { BrokerSiteVisit, PropertyWithSlots } from "@/features/site-visits/broker/model";

export function groupVisitsByDay(visits: BrokerSiteVisit[]) {
    const map = new Map<string, BrokerSiteVisit[]>();
    for (const visit of [...visits].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
        const key = istDateKey(visit.startsAt);
        const list = map.get(key) ?? [];
        list.push(visit);
        map.set(key, list);
    }
    return [...map.entries()].map(([key, items]) => {
        const active = items.filter((visit) => !isVisitCancelled(visit.status));
        const totalValue = active.reduce(
            (total, visit) =>
                total + (visit.property.purpose === "sale" ? visit.property.amountInr : 0),
            0,
        );
        return {
            key,
            items,
            totalValue,
            totalLabel: formatPrice(totalValue),
        };
    });
}

export function sortSlotsForBuyer(properties: PropertyWithSlots[], buyerId?: string) {
    if (!buyerId) return properties;
    return [...properties].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
}
