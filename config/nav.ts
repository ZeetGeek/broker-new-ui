import {
    BROKER_OWNER_LISTINGS_HREF,
    BROKER_YOUR_LISTINGS_HREF,
} from "@/lib/routes/broker";
import type { ShortcutId } from "@/lib/shortcuts";

export type NavItem = {
    label: string;
    href: string;
    /** Shorter label for the mobile bottom nav. Falls back to `label`. */
    mobileLabel?: string;
    /** When set, the nav link shows a tooltip naming this shortcut. */
    shortcutId?: ShortcutId;
    /** Additional path prefixes that should mark this nav item active. */
    activePrefixes?: string[];
};

export const OWNER_NAV_ITEMS: NavItem[] = [
    { label: "Overview", href: "/owner" },
    { label: "Properties", href: "/owner/properties" },
    { label: "Requests", href: "/owner/requests" },
    { label: "Calendar", href: "/owner/calendar" },
];

export const BROKER_NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/broker/dashboard", shortcutId: "dashboard" },
    {
        label: "Owner listings",
        mobileLabel: "Owners",
        href: BROKER_OWNER_LISTINGS_HREF,
        shortcutId: "owner_listings",
        activePrefixes: ["/broker/browse-properties"],
    },
    {
        label: "Your listings",
        mobileLabel: "Yours",
        href: BROKER_YOUR_LISTINGS_HREF,
        shortcutId: "your_listings",
        activePrefixes: ["/broker/my-properties", "/broker/properties"],
    },
    { label: "Clients", href: "/broker/clients", shortcutId: "clients" },
    { label: "Visits", href: "/broker/visits", shortcutId: "visits" },
    { label: "Referrals", href: "/broker/referrals", shortcutId: "referrals" },
];
