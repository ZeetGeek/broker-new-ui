"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tinykeys } from "tinykeys";

function isEditable(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable ||
        el.getAttribute("role") === "textbox" ||
        el.closest("[contenteditable='true']") !== null
    );
}

function guarded(handler: (event: KeyboardEvent) => void) {
    return (event: KeyboardEvent) => {
        if (isEditable(event.target)) return;
        handler(event);
    };
}

export type GlobalShortcutRoutes = {
    dashboard: string;
    properties: string;
    clients: string;
    visits: string;
    referrals: string;
    profile: string;
    settings: string;
};

export type UseGlobalShortcutsOptions = {
    routes: GlobalShortcutRoutes;
    onShortcutsOpen: () => void;
    /** Focuses the hold-to-logout control rather than logging out directly. */
    onLogoutFocus?: () => void;
};

/**
 * Global keyboard shortcuts for the broker/owner portals. See
 * docs/SHORTCUTS.md for the map, reserved keys, and the guard rules this
 * hook must follow.
 */
export function useGlobalShortcuts({ routes, onShortcutsOpen, onLogoutFocus }: UseGlobalShortcutsOptions) {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = tinykeys(window, {
            "g d": guarded(() => router.push(routes.dashboard)),
            "g p": guarded(() => router.push(routes.properties)),
            "g c": guarded(() => router.push(routes.clients)),
            "g v": guarded(() => router.push(routes.visits)),
            "g r": guarded(() => router.push(routes.referrals)),
            "g m": guarded(() => router.push(routes.profile)),
            "g s": guarded(() => router.push(routes.settings)),
            "Shift+Slash": guarded(() => onShortcutsOpen()),
            "Shift+KeyQ": guarded(() => onLogoutFocus?.()),
        });

        return () => unsubscribe();
    }, [router, routes, onShortcutsOpen, onLogoutFocus]);
}
