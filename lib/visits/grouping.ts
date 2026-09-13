import { formatInrCompact } from "@/lib/format/inr";
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
    return [...map.entries()].map(([key, items]) => ({
        key,
        items,
        totalValue: items.reduce((total, visit) => total + (visit.property.purpose === "sale" ? visit.property.amountInr : 0), 0),
        totalLabel: formatInrCompact(items.reduce((total, visit) => total + (visit.property.purpose === "sale" ? visit.property.amountInr : 0), 0)),
    }));
}

export function sortSlotsForBuyer(properties: PropertyWithSlots[], buyerId?: string) {
    if (!buyerId) return properties;
    return [...properties].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
}

