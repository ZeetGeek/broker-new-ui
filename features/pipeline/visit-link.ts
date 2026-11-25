import type { DealItem } from "@/features/pipeline/types";

/**
 * Visits books only on the broker's own exclusive listings. Owner-listed deals
 * follow the owner's published times, so their cards offer no scheduling.
 */
export function canScheduleVisit(deal: Pick<DealItem, "property">): boolean {
    return deal.property.isExclusiveProperty === true;
}

/**
 * A booked visit always exposes its workflow entry point, even when the lead's
 * listing summary omits the exclusive flag. Visits resolves the actual booking
 * and verifies its eligibility before offering any reschedule mutation.
 * Creating a new booking still requires the existing exclusive-listing check.
 */
export function canOpenVisitAction(deal: Pick<DealItem, "property" | "nextVisitAt">): boolean {
    return (
        canScheduleVisit(deal) ||
        Boolean(deal.nextVisitAt && Number.isFinite(Date.parse(deal.nextVisitAt)))
    );
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
