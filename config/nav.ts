import {
    BROKER_CONTACTS_HREF,
    BROKER_MY_DEALS_HREF,
    BROKER_OWNER_LISTINGS_HREF,
    BROKER_PIPELINE_HREF,
    BROKER_YOUR_LISTINGS_HREF,
} from "@/lib/routes/broker";
import {
    OWNER_LEADS_HREF,
    OWNER_OVERVIEW_HREF,
    OWNER_PROPERTIES_HREF,
    OWNER_REQUESTS_HREF,
    OWNER_VISITS_HREF,
} from "@/lib/routes/owner";
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
    { label: "Overview", href: OWNER_OVERVIEW_HREF, mobileLabel: "Home" },
    {
        label: "Properties",
        href: OWNER_PROPERTIES_HREF,
        activePrefixes: ["/owner/properties"],
    },
    {
        label: "Requests",
        href: OWNER_REQUESTS_HREF,
        mobileLabel: "Brokers",
        activePrefixes: ["/owner/requests"],
    },
    { label: "Visits", href: OWNER_VISITS_HREF },
    { label: "Leads", href: OWNER_LEADS_HREF, mobileLabel: "Offers" },
];

export const BROKER_NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/broker/dashboard", shortcutId: "dashboard" },
    {
        label: "Owner listings",
        mobileLabel: "Owners",
        href: BROKER_OWNER_LISTINGS_HREF,
        shortcutId: "owner_listings",
        activePrefixes: ["/broker/browse-properties", "/broker/owner-listings", "/broker/owners"],
    },
    {
        // Covers both directions — requests the broker sent and invites owners
        // sent them. "Requests" only named half the page.
        label: "My Deals",
        mobileLabel: "Deals",
        href: BROKER_MY_DEALS_HREF,
        shortcutId: "my_deals",
        activePrefixes: ["/broker/requests"],
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
