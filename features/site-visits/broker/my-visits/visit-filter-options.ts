import type { ApiLeadOption, ApiOwnerOption } from "@/lib/api/broker-visits-map";

import type { BrokerSiteVisit, PersonSummary } from "@/features/site-visits/broker/model";

export type VisitPeopleFilter = {
    buyerId?: string;
    ownerId?: string;
    leadId?: string;
};

/** Buyer / owner / lead options taken from the visits themselves, so every pick has results. */
export function visitFilterOptions(visits: BrokerSiteVisit[]) {
    const buyers = new Map<string, PersonSummary>();
    const owners = new Map<string, ApiOwnerOption>();
    const leads = new Map<string, ApiLeadOption>();

    for (const visit of visits) {
        for (const buyer of visit.buyers) {
            if (!buyers.has(buyer.id)) buyers.set(buyer.id, { id: buyer.id, name: buyer.name });
        }
        if (visit.ownerId && !owners.has(visit.ownerId)) {
            owners.set(visit.ownerId, { id: visit.ownerId, name: visit.owner.name });
        }
        const buyer = visit.buyers[0];
        if (visit.leadId && buyer && !leads.has(visit.leadId)) {
            leads.set(visit.leadId, {
                id: visit.leadId,
                clientId: buyer.id,
                buyerName: buyer.name,
                propertyId: visit.propertyId,
                propertyTitle: visit.property.title,
                ownerOptionId: visit.ownerId || null,
            });
        }
    }

    const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);
    return {
        buyers: [...buyers.values()].sort(byName),
        ownerOptions: [...owners.values()].sort(byName),
        leadOptions: [...leads.values()].sort(
            (a, b) =>
                a.buyerName.localeCompare(b.buyerName) ||
                a.propertyTitle.localeCompare(b.propertyTitle),
        ),
    };
}

export function matchesVisitPeople(visit: BrokerSiteVisit, filter: VisitPeopleFilter) {
    if (filter.buyerId && !visit.buyerIds.includes(filter.buyerId)) return false;
    if (filter.ownerId && visit.ownerId !== filter.ownerId) return false;
    if (filter.leadId && visit.leadId !== filter.leadId) return false;
    return true;
}

export function countVisitPeopleFilters(filter: VisitPeopleFilter) {
    return (
        Number(Boolean(filter.buyerId)) +
        Number(Boolean(filter.ownerId)) +
        Number(Boolean(filter.leadId))
    );
}
