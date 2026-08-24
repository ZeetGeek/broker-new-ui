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
    { label: "Dashboard", href: "/broker/dashboard" },
    { label: "Properties", href: "/broker/properties" },
    { label: "Clients", href: "/broker/clients" },
    { label: "Visits", href: "/broker/visits" },
    { label: "Referrals & Credits", href: "/broker/referrals" },
];
