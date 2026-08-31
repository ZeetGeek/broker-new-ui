"use client";

import type { ReactElement } from "react";

import { getShortcut, type ShortcutId } from "@/lib/shortcuts";

import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type ShortcutTooltipProps = {
    /** Registry id — the tooltip renders that shortcut's own label unless overridden. */
    shortcutId: ShortcutId;
    /** Override the registry label, e.g. "Add clients" for a button that lands on Clients. */
    label?: string;
    side?: "top" | "bottom" | "inline-start" | "inline-end";
    children: ReactElement;
};

/**
 * Wraps a dashboard trigger with a tooltip naming the keyboard shortcut that
 * lands on the same page. Only use this where the shortcut's route and the
 * trigger's destination genuinely match — see docs/SHORTCUTS.md discoverability.
 */
export function ShortcutTooltip({ shortcutId, label, side = "bottom", children }: ShortcutTooltipProps) {
    const shortcut = getShortcut(shortcutId);
    if (!shortcut) return children;

    return (
        <Tooltip>
            <TooltipTrigger render={children} />
            <TooltipContent side={side}>
                {label ?? shortcut.label}
                <KbdGroup className="gap-0.5">
                    {shortcut.displayKeys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                    ))}
                </KbdGroup>
            </TooltipContent>
        </Tooltip>
    );
}
