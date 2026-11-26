import { getShortcuts, type ShortcutId, type ShortcutPortal } from "@/lib/shortcuts";

import { isShortcutEventBlocked } from "@/features/shortcuts/shortcut-event";

export type GlobalShortcutRoutes = Partial<Record<ShortcutId, string>>;

export function buildGlobalShortcutBindings({
    routes,
    onNavigate,
    onWorkflowOpen,
    onShortcutsOpen,
    portal = "broker",
}: {
    routes: GlobalShortcutRoutes;
    onNavigate: (href: string) => void;
    onWorkflowOpen?: ((href: string) => boolean) | null;
    onShortcutsOpen: () => void;
    portal?: ShortcutPortal;
}): Record<string, (event: KeyboardEvent) => void> {
    const bindings: Record<string, (event: KeyboardEvent) => void> = {};

    for (const shortcut of getShortcuts(portal)) {
        if (shortcut.scope !== "global") continue;

        const workflowHref = shortcut.workflowHref;
        const routeHref = routes[shortcut.id];
        let action: (() => void) | undefined;
        if (workflowHref) {
            if (onWorkflowOpen) action = () => onWorkflowOpen(workflowHref);
        } else if (routeHref) {
            action = () => onNavigate(routeHref);
        } else if (shortcut.id === "shortcuts_cheatsheet") {
            action = onShortcutsOpen;
        }
        if (!action) continue;

        bindings[shortcut.keys] = (event) => {
            if (isShortcutEventBlocked(event)) return;
            event.preventDefault();
            action();
        };
    }

    return bindings;
}
