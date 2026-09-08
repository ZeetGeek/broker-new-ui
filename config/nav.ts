import {
    BROKER_CONTACTS_HREF,
    BROKER_DEALS_HREF,
    BROKER_OWNER_LISTINGS_HREF,
    BROKER_PIPELINE_HREF,
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
    { label: "Visits", href: "/owner/visits" },
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
        // Covers both directions — requests the broker sent and invites owners
        // sent them. "Requests" only named half the page.
        label: "Deals",
        href: BROKER_DEALS_HREF,
        shortcutId: "my_requests",
    },
    {
        label: "Your listings",
        mobileLabel: "Yours",
        href: BROKER_YOUR_LISTINGS_HREF,
        shortcutId: "your_listings",
        activePrefixes: ["/broker/my-properties", "/broker/properties"],
    },
    { label: "Pipeline", href: BROKER_PIPELINE_HREF, shortcutId: "pipeline" },
    { label: "Contacts", href: BROKER_CONTACTS_HREF, shortcutId: "contacts" },
    { label: "Visits", href: "/broker/visits", shortcutId: "visits" },
];
