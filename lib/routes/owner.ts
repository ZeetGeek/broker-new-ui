export const OWNER_OVERVIEW_HREF = "/owner";
export const OWNER_PROPERTIES_HREF = "/owner/properties";
export const OWNER_BROKERS_HREF = "/owner/brokers";
export const OWNER_REQUESTS_HREF = "/owner/requests";
export const OWNER_VISITS_HREF = "/owner/visits";
export const OWNER_LEADS_HREF = "/owner/leads";
export const OWNER_REFERRALS_HREF = "/owner/referrals";
export const OWNER_NOTIFICATIONS_HREF = "/owner/notifications";
export const OWNER_PROFILE_HREF = "/owner/profile";
export const OWNER_PROPERTIES_NEW_HREF = "/owner/properties/new";

export function ownerPropertyDetailHref(propertyId: string): string {
    return `/owner/properties/${propertyId}`;
}

export function ownerPropertyEditHref(propertyId: string): string {
    return `/owner/properties/${propertyId}/edit`;
}

export function ownerBrokersHref(tab?: "browse" | "active"): string {
    if (!tab || tab === "browse") return OWNER_BROKERS_HREF;
    return `${OWNER_BROKERS_HREF}?tab=${tab}`;
}

export function ownerRequestsHref(tab?: "requests" | "invitations"): string {
    if (!tab || tab === "requests") return OWNER_REQUESTS_HREF;
    return `${OWNER_REQUESTS_HREF}?tab=${tab}`;
}

export function ownerVisitsHref(tab?: "availability" | "scheduled"): string {
    if (!tab || tab === "availability") return OWNER_VISITS_HREF;
    return `${OWNER_VISITS_HREF}?tab=${tab}`;
}
