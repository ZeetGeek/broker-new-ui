export const BROKER_OWNER_LISTINGS_HREF = "/broker/owner-listings";
export const BROKER_YOUR_LISTINGS_HREF = "/broker/your-listings";
export const BROKER_PROPERTIES_NEW_HREF = "/broker/properties/new";

export function brokerPropertyDetailHref(propertyId: string): string {
    return `/broker/properties/${propertyId}`;
}

export function brokerPropertyEditHref(propertyId: string): string {
    return `/broker/properties/${propertyId}/edit`;
}

export function brokerYourListingsHref(tab?: "representing" | "requests"): string {
    if (!tab || tab === "representing") return BROKER_YOUR_LISTINGS_HREF;
    return `${BROKER_YOUR_LISTINGS_HREF}?tab=${tab}`;
}
