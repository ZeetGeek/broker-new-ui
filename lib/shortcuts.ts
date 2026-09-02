export type ShortcutId =
    | "dashboard"
    | "owner_listings"
    | "your_listings"
    | "clients"
    | "visits"
    | "referrals"
    | "notifications"
    | "profile"
    | "settings"
    | "shortcuts_cheatsheet"
    | "logout";

export type ShortcutScope = "global" | "list" | "form" | "dialog";

export type ShortcutDef = {
    id: ShortcutId;
    /** tinykeys binding string, e.g. "g d" or "$mod+KeyK". Prefer the `code` form. */
    keys: string;
    /** Display keys shown in hints and the cheatsheet (e.g. ["G", "D"]). */
    displayKeys: readonly string[];
    label: string;
    group: string;
    scope: ShortcutScope;
    /** Render as kbd hints inside the profile dropdown (desktop only). */
    showInProfileMenu?: boolean;
};

/**
 * Single source for keyboard shortcuts. The global listener and cheatsheet
 * dialog consume this list — profile menu hints read from here too.
 */
export const SHORTCUTS: readonly ShortcutDef[] = [
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
        keys: "g d",
        displayKeys: ["G", "D"],
        label: "Dashboard",
        group: "Go to",
        scope: "global",
    },
    {
        id: "owner_listings",
        keys: "g o",
        displayKeys: ["G", "O"],
        label: "Owner listings",
        group: "Go to",
        scope: "global",
    },
    {
        id: "your_listings",
        keys: "g p",
        displayKeys: ["G", "P"],
        label: "Your listings",
        group: "Go to",
        scope: "global",
    },
    {
        id: "clients",
        keys: "g c",
        displayKeys: ["G", "C"],
        label: "Clients",
        group: "Go to",
        scope: "global",
    },
    {
        id: "visits",
        keys: "g v",
        displayKeys: ["G", "V"],
        label: "Visits",
        group: "Go to",
        scope: "global",
    },
    {
        id: "referrals",
        keys: "g r",
        displayKeys: ["G", "R"],
        label: "Referrals",
        group: "Go to",
        scope: "global",
    },
    {
        id: "notifications",
        keys: "g n",
        displayKeys: ["G", "N"],
        label: "Notifications",
        group: "Go to",
        scope: "global",
    },
    {
        id: "profile",
        keys: "g m",
        displayKeys: ["G", "M"],
        label: "My profile",
        group: "Go to",
        scope: "global",
        showInProfileMenu: true,
    },
    {
        id: "settings",
        keys: "g s",
        displayKeys: ["G", "S"],
        label: "Settings",
        group: "Go to",
        scope: "global",
        showInProfileMenu: true,
    },
    {
        id: "logout",
        keys: "Shift+KeyQ",
        displayKeys: ["⇧", "Q"],
        label: "Log out",
        group: "Account",
        scope: "global",
        showInProfileMenu: true,
    },
] as const;

export function getShortcut(id: ShortcutId): ShortcutDef | undefined {
    return SHORTCUTS.find((shortcut) => shortcut.id === id);
}

if (process.env.NODE_ENV !== "production") {
    const seen = new Map<string, string>();
    for (const s of SHORTCUTS) {
        const keysInScope = s.scope === "global" ? ["*"] : [s.scope, "*"];
        for (const scope of keysInScope) {
            const key = `${scope}:${s.keys.toLowerCase()}`;
            const existing = seen.get(key);
            if (existing) {
                throw new Error(`Shortcut conflict: "${s.keys}" used by ${existing} and ${s.id}`);
            }
            seen.set(key, s.id);
        }
    }

    const firstKeys = new Set(
        SHORTCUTS.filter((s) => s.keys.includes(" ")).map((s) => s.keys.split(" ")[0].toLowerCase()),
    );
    for (const s of SHORTCUTS) {
        if (!s.keys.includes(" ") && firstKeys.has(s.keys.toLowerCase())) {
            throw new Error(`Shortcut "${s.keys}" (${s.id}) is shadowed by a sequence starting with it`);
        }
    }
}
