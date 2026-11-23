"use client";

import { useSyncExternalStore } from "react";

import type { ShortcutDef } from "@/lib/shortcuts";

function isApplePlatform(): boolean {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    const platform = nav.userAgentData?.platform || navigator.platform || navigator.userAgent;
    return /Mac|iPhone|iPad|iPod/i.test(platform);
}

const subscribe = () => () => {};
const getModifier = () => (isApplePlatform() ? "⌘" : "Ctrl");
const getServerModifier = () => "Ctrl";

export function useShortcutDisplayKeys(shortcut: ShortcutDef | undefined): readonly string[] {
    const modifier = useSyncExternalStore(subscribe, getModifier, getServerModifier);

    return shortcut?.displayKeys.map((key) => (key === "$mod" ? modifier : key)) ?? [];
}
