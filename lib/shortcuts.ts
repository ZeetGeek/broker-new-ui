export type ShortcutId =
    | "command_palette"
    | "dashboard"
    | "listings"
    | "clients"
    | "requests"
    | "visits"
    | "profile"
    | "settings"
    | "new_client"
    | "shortcuts_cheatsheet"
    | "logout";

export type ShortcutDef = {
    id: ShortcutId;
    /** Display keys shown in hints and the cheatsheet (e.g. ["G", "P"]). */
    keys: readonly string[];
    label: string;
    /** Render as kbd hints inside the profile dropdown (desktop only). */
    showInProfileMenu?: boolean;
};

/**
 * Single source for keyboard shortcuts. The global listener and cheatsheet
 * dialog should consume this list — profile menu hints read from here too.
 */
export const SHORTCUTS: readonly ShortcutDef[] = [
    { id: "command_palette", keys: ["⌘", "K"], label: "Command palette" },
    { id: "dashboard", keys: ["G", "D"], label: "Dashboard" },
    { id: "listings", keys: ["G", "L"], label: "Listings" },
    { id: "clients", keys: ["G", "C"], label: "Clients" },
    { id: "requests", keys: ["G", "R"], label: "Requests" },
    { id: "visits", keys: ["G", "V"], label: "Visits" },
    { id: "profile", keys: ["G", "P"], label: "My profile", showInProfileMenu: true },
    { id: "settings", keys: ["G", "S"], label: "Settings", showInProfileMenu: true },
    { id: "new_client", keys: ["N"], label: "New client" },
    { id: "shortcuts_cheatsheet", keys: ["?"], label: "Keyboard shortcuts", showInProfileMenu: true },
    { id: "logout", keys: ["⇧", "Q"], label: "Log out", showInProfileMenu: true },
] as const;

export function getShortcut(id: ShortcutId): ShortcutDef | undefined {
    return SHORTCUTS.find((shortcut) => shortcut.id === id);
}
