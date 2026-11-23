"use client";

import { useEffect } from "react";

import { tinykeys } from "tinykeys";

import { useRouter } from "@/lib/navigation";
import { getShortcut, type ShortcutId, type ShortcutPortal } from "@/lib/shortcuts";

import { isShortcutEventBlocked } from "@/features/shortcuts/shortcut-event";

export type GlobalShortcutRoutes = Partial<Record<ShortcutId, string>>;

export type UseGlobalShortcutsOptions = {
    routes: GlobalShortcutRoutes;
    onShortcutsOpen: () => void;
    portal?: ShortcutPortal;
};

/**
 * Registry-backed navigation for a portal. Global shortcuts pause while the
 * user types or a modal owns focus; Escape remains owned by the topmost layer.
 */
export function useGlobalShortcuts({
    routes,
    onShortcutsOpen,
    portal = "broker",
}: UseGlobalShortcutsOptions) {
    const router = useRouter();

    useEffect(() => {
        const bindings: Record<string, (event: KeyboardEvent) => void> = {};

        for (const [rawId, href] of Object.entries(routes)) {
            if (!href) continue;
            const id = rawId as ShortcutId;
            const shortcut = getShortcut(id, portal);
            if (!shortcut || shortcut.scope !== "global") continue;

            bindings[shortcut.keys] = (event) => {
                if (isShortcutEventBlocked(event)) return;
                event.preventDefault();
                router.push(href);
            };
        }

        const helpShortcut = getShortcut("shortcuts_cheatsheet", portal);
        if (helpShortcut) {
            bindings[helpShortcut.keys] = (event) => {
                if (isShortcutEventBlocked(event)) return;
                event.preventDefault();
                onShortcutsOpen();
            };
        }

        return tinykeys(window, bindings);
    }, [onShortcutsOpen, portal, router, routes]);
}
