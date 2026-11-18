import type { DealItem } from "@/features/pipeline/types";

/**
 * Visits books only on the broker's own exclusive listings. Owner-listed deals
 * follow the owner's published times, so their cards offer no scheduling.
 */
export function canScheduleVisit(deal: Pick<DealItem, "property">): boolean {
    return deal.property.isExclusiveProperty === true;
}

/**
 * Visits, opened for this deal. `schedule=1` opens the form; Visits moves the
 * deal's booked visit if it has one (`leadId`), otherwise books a new one with
 * the client (`clientId`) and property (`propertyId`) filled in.
 */
export function scheduleVisitHref(deal: Pick<DealItem, "id" | "buyer" | "property">): string {
    const params = new URLSearchParams({
        schedule: "1",
        clientId: deal.buyer.id,
        propertyId: deal.property.id,
        leadId: deal.id,
    });
    return `/broker/visits?${params.toString()}`;
}
