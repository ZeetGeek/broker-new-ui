import type { DealItem } from "@/features/pipeline/types";

/**
 * Visits, opened on its schedule form for this deal's client and property.
 *
 * Contract for the Visits API integration (Visits does not read it yet):
 * `schedule=1` opens the form, `clientId` / `propertyId` prefill it, and
 * `leadId` is the pipeline deal the visit belongs to.
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
