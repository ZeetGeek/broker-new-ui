export const BROKER_OWNER_LISTINGS_HREF = "/broker/owner-listings";
export const BROKER_YOUR_LISTINGS_HREF = "/broker/your-listings";
export const BROKER_MY_DEALS_HREF = "/broker/my-deals";
export const BROKER_PIPELINE_HREF = "/broker/pipeline";
export const BROKER_CONTACTS_HREF = "/broker/contacts";
export const BROKER_PROPERTIES_NEW_HREF = "/broker/properties/new";

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

export function brokerYourListingsHref(tab?: "representing" | "requests"): string {
    if (!tab || tab === "representing") return BROKER_YOUR_LISTINGS_HREF;
    return `${BROKER_YOUR_LISTINGS_HREF}?tab=${tab}`;
}

/** Broker-facing owner profile — the person who listed the property. */
export function brokerOwnerProfileHref(ownerUserId: string): string {
    return `/broker/owners/${ownerUserId}`;
}
