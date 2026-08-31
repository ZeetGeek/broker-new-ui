import type { ShortcutId } from "@/lib/shortcuts";

export type NavItem = {
    label: string;
    href: string;
    /** When set, the nav link shows a tooltip naming this shortcut. */
    shortcutId?: ShortcutId;
};

export const OWNER_NAV_ITEMS: NavItem[] = [
    { label: "Overview", href: "/owner" },
    { label: "Properties", href: "/owner/properties" },
    { label: "Requests", href: "/owner/requests" },
    { label: "Calendar", href: "/owner/calendar" },
];

export const BROKER_NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/broker/dashboard", shortcutId: "dashboard" },
    { label: "Properties", href: "/broker/properties", shortcutId: "properties" },
    { label: "Clients", href: "/broker/clients", shortcutId: "clients" },
    { label: "Visits", href: "/broker/visits", shortcutId: "visits" },
    { label: "Referrals", href: "/broker/referrals", shortcutId: "referrals" },
];
