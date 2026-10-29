import { FEATURE_PLATFORM_OWNER } from "@/config";

export const BROKER_OWNER_LISTINGS_HREF = "/broker/owner-listings";
export const BROKER_YOUR_LISTINGS_HREF = "/broker/your-listings";
export const BROKER_MY_DEALS_HREF = "/broker/my-deals";
export const BROKER_PIPELINE_HREF = "/broker/pipeline";
export const BROKER_CONTACTS_HREF = "/broker/contacts";
export const BROKER_PROPERTIES_NEW_HREF = "/broker/properties/new";
export const BROKER_ADD_BUYER_HREF = "/broker/contacts?add=buyer";
export const BROKER_ADD_DEAL_HREF = "/broker/contacts?flow=add-deal";
export const BROKER_VISIT_SLOTS_HREF = "/broker/visits?tab=slots";

export function brokerVisitHref(visitId: string): string {
    return `/broker/visits?tab=visits&visit=${encodeURIComponent(visitId)}`;
}

export function brokerPropertyDetailHref(propertyId: string): string {
    return `/broker/properties/${propertyId}`;
}

/** Owner-listed (browse) property detail — not the broker's own inventory. */
export function brokerOwnerListingDetailHref(propertyId: string): string {
    return `/broker/owner-listings/${propertyId}`;
}

export function brokerPropertyEditHref(propertyId: string): string {
    return `/broker/properties/${propertyId}/edit`;
}

/** Lead analytics for one of the broker's own listings. */
export function brokerPropertyAnalyticsHref(propertyId: string): string {
    return `${BROKER_YOUR_LISTINGS_HREF}/${propertyId}/analytics`;
}

export function brokerYourListingsHref(tab?: "representing" | "requests"): string {
    if (!FEATURE_PLATFORM_OWNER || !tab || tab === "representing") return BROKER_YOUR_LISTINGS_HREF;
    return `${BROKER_YOUR_LISTINGS_HREF}?tab=${tab}`;
}

/** Broker-facing owner profile — the person who listed the property. */
export function brokerOwnerProfileHref(ownerUserId: string): string {
    return `/broker/owners/${ownerUserId}`;
}
