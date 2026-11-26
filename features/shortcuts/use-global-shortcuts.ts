"use client";

import { useEffect } from "react";

import { tinykeys } from "tinykeys";

import { useRouter } from "@/lib/navigation";
import type { ShortcutPortal } from "@/lib/shortcuts";

import { useWorkflow } from "@/components/shared/workflow-context";

import {
    buildGlobalShortcutBindings,
    type GlobalShortcutRoutes,
} from "@/features/shortcuts/global-shortcut-bindings";

export type { GlobalShortcutRoutes } from "@/features/shortcuts/global-shortcut-bindings";

export type UseGlobalShortcutsOptions = {
    routes: GlobalShortcutRoutes;
    onShortcutsOpen: () => void;
    portal?: ShortcutPortal;
};

/**
 * Registry-backed navigation and quick actions for a portal. Shortcuts pause while the
 * user types or a modal owns focus; Escape remains owned by the topmost layer.
 */
export function useGlobalShortcuts({
    routes,
    onShortcutsOpen,
    portal = "broker",
}: UseGlobalShortcutsOptions) {
    const router = useRouter();
    const openWorkflow = useWorkflow();

    useEffect(() => {
        const bindings = buildGlobalShortcutBindings({
            routes,
            onNavigate: (href) => router.push(href),
            onWorkflowOpen: openWorkflow,
            onShortcutsOpen,
            portal,
        });

        return tinykeys(window, bindings);
    }, [onShortcutsOpen, openWorkflow, portal, router, routes]);
}
