export type NavItem = {
    label: string;
    href: string;
};

export const OWNER_NAV_ITEMS: NavItem[] = [
    { label: "Overview", href: "/owner" },
    { label: "Properties", href: "/owner/properties" },
    { label: "Requests", href: "/owner/requests" },
    { label: "Calendar", href: "/owner/calendar" },
];

export const BROKER_NAV_ITEMS: NavItem[] = [
    { label: "Overview", href: "/broker" },
    { label: "Pipeline", href: "/broker/pipeline" },
    { label: "Listings", href: "/broker/listings" },
    { label: "Transactions", href: "/broker/transactions" },
    { label: "Calendar", href: "/broker/calendar" },
];
