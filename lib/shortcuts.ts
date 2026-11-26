import {
    BROKER_ADD_BUYER_HREF,
    BROKER_ADD_OWNER_HREF,
    BROKER_PROPERTIES_NEW_HREF,
} from "@/lib/routes/broker";

import { FEATURE_SAVED_PROPERTIES } from "@/config";

export type ShortcutPortal = "broker" | "owner";

export type ShortcutId =
    | "shortcuts_cheatsheet"
    | "dashboard"
    | "owner_listings"
    | "my_deals"
    | "your_listings"
    | "pipeline"
    | "contacts"
    | "visits"
    | "tasks"
    | "earnings"
    | "referrals"
    | "notifications"
    | "recent_updates"
    | "saved_properties"
    | "profile"
    | "settings"
    | "add_property"
    | "add_contact"
    | "add_owner"
    | "schedule_visit"
    | "add_task"
    | "form_primary"
    | "form_submit_another";

export type ShortcutScope = "global" | "page" | "list" | "form" | "dialog";

export type ShortcutDef = {
    id: ShortcutId;
    /** tinykeys binding string. Prefer KeyboardEvent.code names for letter keys. */
    keys: string;
    /** Keys shown in UI. Use "$mod" for the platform Control/Command key. */
    displayKeys: readonly string[];
    label: string;
    group: string;
    scope: ShortcutScope;
    /** Open an existing workflow over the current page instead of navigating. */
    workflowHref?: string;
    /** Render as a kbd hint inside the account menu. */
    showInProfileMenu?: boolean;
};

/**
 * The broker registry is the source of truth for behavior and every visible
 * hint. Global navigation uses G, create actions use A, and consequential
 * actions deliberately have no shortcut.
 */
const BROKER_SHORTCUT_DEFINITIONS: readonly ShortcutDef[] = [
    {
        id: "shortcuts_cheatsheet",
        keys: "Shift+Slash",
        displayKeys: ["?"],
        label: "Keyboard shortcuts",
        group: "General",
        scope: "global",
        showInProfileMenu: true,
    },
    {
        id: "dashboard",
        keys: "KeyG KeyD",
        displayKeys: ["G", "D"],
        label: "Dashboard",
        group: "Go to",
        scope: "global",
    },
    {
        id: "contacts",
        keys: "KeyG KeyC",
        displayKeys: ["G", "C"],
        label: "Clients",
        group: "Go to",
        scope: "global",
    },
    {
        id: "your_listings",
        keys: "KeyG KeyL",
        displayKeys: ["G", "L"],
        label: "My Listings",
        group: "Go to",
        scope: "global",
    },
    {
        id: "pipeline",
        keys: "KeyG KeyP",
        displayKeys: ["G", "P"],
        label: "Pipeline",
        group: "Go to",
        scope: "global",
    },
    {
        id: "visits",
        keys: "KeyG KeyV",
        displayKeys: ["G", "V"],
        label: "Visits",
        group: "Go to",
        scope: "global",
    },
    {
        id: "tasks",
        keys: "KeyG KeyT",
        displayKeys: ["G", "T"],
        label: "Tasks",
        group: "Go to",
        scope: "global",
    },
    {
        id: "earnings",
        keys: "KeyG KeyE",
        displayKeys: ["G", "E"],
        label: "Earnings",
        group: "Go to",
        scope: "global",
    },
    {
        id: "owner_listings",
        keys: "KeyG KeyM",
        displayKeys: ["G", "M"],
        label: "Marketplace",
        group: "Go to",
        scope: "global",
    },
    {
        id: "my_deals",
        keys: "KeyG KeyR",
        displayKeys: ["G", "R"],
        label: "Requests & Invitations",
        group: "Go to",
        scope: "global",
    },
    {
        id: "notifications",
        keys: "KeyG KeyN",
        displayKeys: ["G", "N"],
        label: "Notification history",
        group: "Go to",
        scope: "global",
        showInProfileMenu: true,
    },
    {
        id: "recent_updates",
        keys: "KeyG KeyH",
        displayKeys: ["G", "H"],
        label: "Recent updates",
        group: "Go to",
        scope: "global",
        showInProfileMenu: true,
    },
    {
        id: "saved_properties",
        keys: "KeyG KeyS",
        displayKeys: ["G", "S"],
        label: "Saved properties",
        group: "Go to",
        scope: "global",
        showInProfileMenu: true,
    },
    {
        id: "profile",
        keys: "KeyG KeyU",
        displayKeys: ["G", "U"],
        label: "My profile",
        group: "Go to",
        scope: "global",
        showInProfileMenu: true,
    },
    {
        id: "referrals",
        keys: "KeyG KeyF",
        displayKeys: ["G", "F"],
        label: "Referrals",
        group: "Go to",
        scope: "global",
        showInProfileMenu: true,
    },
    {
        id: "add_contact",
        keys: "KeyA KeyC",
        displayKeys: ["A", "C"],
        label: "Add client",
        group: "Quick actions",
        scope: "global",
        workflowHref: BROKER_ADD_BUYER_HREF,
    },
    {
        id: "add_owner",
        keys: "KeyA KeyO",
        displayKeys: ["A", "O"],
        label: "Add owner",
        group: "Quick actions",
        scope: "global",
        workflowHref: BROKER_ADD_OWNER_HREF,
    },
    {
        id: "add_property",
        keys: "KeyA KeyL",
        displayKeys: ["A", "L"],
        label: "Add listing",
        group: "Quick actions",
        scope: "global",
        workflowHref: BROKER_PROPERTIES_NEW_HREF,
    },
    {
        id: "schedule_visit",
        keys: "KeyA KeyV",
        displayKeys: ["A", "V"],
        label: "Schedule visit",
        group: "Quick actions",
        scope: "global",
        workflowHref: "/broker/visits?view=schedule",
    },
    {
        id: "add_task",
        keys: "KeyA KeyT",
        displayKeys: ["A", "T"],
        label: "Add task",
        group: "Quick actions",
        scope: "global",
        workflowHref: "/broker/tasks?view=create",
    },
    {
        id: "form_primary",
        keys: "$mod+Enter",
        displayKeys: ["$mod", "Enter"],
        label: "Save or continue",
        group: "Form",
        scope: "form",
    },
    {
        id: "form_submit_another",
        keys: "$mod+Shift+Enter",
        displayKeys: ["$mod", "Shift", "Enter"],
        label: "Save and add another",
        group: "Form",
        scope: "form",
    },
] as const;

export const BROKER_SHORTCUTS = BROKER_SHORTCUT_DEFINITIONS.filter(
    (shortcut) => FEATURE_SAVED_PROPERTIES || shortcut.id !== "saved_properties",
);

/**
 * Owner shortcuts are intentionally kept separate. Broker key changes must not
 * silently rewrite the owner portal while that surface is outside this task.
 */
export const OWNER_SHORTCUTS: readonly ShortcutDef[] = [
    {
        id: "shortcuts_cheatsheet",
        keys: "Shift+Slash",
        displayKeys: ["?"],
        label: "Keyboard shortcuts",
        group: "General",
        scope: "global",
        showInProfileMenu: true,
    },
    {
        id: "dashboard",
        keys: "KeyG KeyD",
        displayKeys: ["G", "D"],
        label: "Overview",
        group: "Go to",
        scope: "global",
    },
    {
        id: "owner_listings",
        keys: "KeyG KeyO",
        displayKeys: ["G", "O"],
        label: "Browse brokers",
        group: "Go to",
        scope: "global",
    },
    {
        id: "my_deals",
        keys: "KeyG KeyQ",
        displayKeys: ["G", "Q"],
        label: "Requests",
        group: "Go to",
        scope: "global",
    },
    {
        id: "your_listings",
        keys: "KeyG KeyP",
        displayKeys: ["G", "P"],
        label: "My properties",
        group: "Go to",
        scope: "global",
    },
    {
        id: "pipeline",
        keys: "KeyG KeyC",
        displayKeys: ["G", "C"],
        label: "Requests",
        group: "Go to",
        scope: "global",
    },
    {
        id: "contacts",
        keys: "KeyG KeyB",
        displayKeys: ["G", "B"],
        label: "Leads",
        group: "Go to",
        scope: "global",
    },
    {
        id: "visits",
        keys: "KeyG KeyV",
        displayKeys: ["G", "V"],
        label: "Visits",
        group: "Go to",
        scope: "global",
    },
    {
        id: "referrals",
        keys: "KeyG KeyR",
        displayKeys: ["G", "R"],
        label: "Referrals",
        group: "Go to",
        scope: "global",
        showInProfileMenu: true,
    },
    {
        id: "notifications",
        keys: "KeyG KeyN",
        displayKeys: ["G", "N"],
        label: "Notifications",
        group: "Go to",
        scope: "global",
    },
    {
        id: "profile",
        keys: "KeyG KeyM",
        displayKeys: ["G", "M"],
        label: "My profile",
        group: "Go to",
        scope: "global",
        showInProfileMenu: true,
    },
    {
        id: "settings",
        keys: "KeyG KeyS",
        displayKeys: ["G", "S"],
        label: "Settings",
        group: "Go to",
        scope: "global",
    },
    {
        id: "add_property",
        keys: "KeyN",
        displayKeys: ["N"],
        label: "Add property",
        group: "Properties",
        scope: "list",
    },
] as const;

/** Broker-default alias retained for existing broker-facing consumers. */
export const SHORTCUTS = BROKER_SHORTCUTS;

export function getShortcuts(portal: ShortcutPortal = "broker"): readonly ShortcutDef[] {
    return portal === "owner" ? OWNER_SHORTCUTS : BROKER_SHORTCUTS;
}

export function getShortcut(
    id: ShortcutId,
    portal: ShortcutPortal = "broker",
): ShortcutDef | undefined {
    return getShortcuts(portal).find((shortcut) => shortcut.id === id);
}

export function getBrokerContextShortcutIds(pathname: string): readonly ShortcutId[] {
    if (
        pathname === "/broker/properties/new" ||
        /^\/broker\/properties\/[^/]+\/edit$/.test(pathname)
    ) {
        return ["form_primary"];
    }
    return [];
}

export type ShortcutKeyboardEvent = Pick<
    KeyboardEvent,
    "altKey" | "code" | "ctrlKey" | "key" | "metaKey" | "shiftKey"
>;

/** Match a single chord from the registry. Sequences remain tinykeys-owned. */
export function shortcutMatchesEvent(event: ShortcutKeyboardEvent, keys: string): boolean {
    if (keys.includes(" ")) return false;

    const tokens = keys.split("+");
    const primary = tokens.at(-1);
    if (!primary) return false;

    const expectsMod = tokens.includes("$mod");
    const expectsControl = tokens.includes("Control");
    const expectsMeta = tokens.includes("Meta");
    const expectsAlt = tokens.includes("Alt");
    const expectsShift = tokens.includes("Shift");

    const modifierMatches = expectsMod
        ? event.ctrlKey || event.metaKey
        : event.ctrlKey === expectsControl && event.metaKey === expectsMeta;
    if (!modifierMatches || event.altKey !== expectsAlt || event.shiftKey !== expectsShift) {
        return false;
    }

    if (/^(Key|Digit|Numpad)/.test(primary)) {
        return event.code.toLowerCase() === primary.toLowerCase();
    }
    return event.key.toLowerCase() === primary.toLowerCase();
}

function validateShortcutRegistry(portal: ShortcutPortal, shortcuts: readonly ShortcutDef[]) {
    const seen = new Map<string, ShortcutId>();
    for (const shortcut of shortcuts) {
        const key = shortcut.keys.toLowerCase();
        const existing = seen.get(key);
        if (existing) {
            throw new Error(
                `${portal} shortcut conflict: "${shortcut.keys}" used by ${existing} and ${shortcut.id}`,
            );
        }
        seen.set(key, shortcut.id);
    }

    const firstKeys = new Set(
        shortcuts
            .filter((shortcut) => shortcut.keys.includes(" "))
            .map((shortcut) => shortcut.keys.split(" ")[0]!.toLowerCase()),
    );
    for (const shortcut of shortcuts) {
        if (!shortcut.keys.includes(" ") && firstKeys.has(shortcut.keys.toLowerCase())) {
            throw new Error(
                `${portal} shortcut "${shortcut.keys}" (${shortcut.id}) is shadowed by a sequence`,
            );
        }
    }
}

if (process.env.NODE_ENV !== "production") {
    validateShortcutRegistry("broker", BROKER_SHORTCUTS);
    validateShortcutRegistry("owner", OWNER_SHORTCUTS);
}
