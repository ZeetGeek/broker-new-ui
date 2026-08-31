"use client";

import type { ReactElement } from "react";

import { getShortcut, type ShortcutId } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

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
 * Wraps a trigger with a tooltip naming the keyboard shortcut that lands on
 * the same page. Only use this where the shortcut's route and the trigger's
 * destination genuinely match — see docs/SHORTCUTS.md discoverability.
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
                        <Kbd key={key} className="min-inline-4 px-1.5 text-[10px]">
                            {key}
                        </Kbd>
                    ))}
                </KbdGroup>
            </TooltipContent>
        </Tooltip>
    );
}

export type ShortcutKbdMessageProps = {
    shortcutId: ShortcutId;
    /** The action phrase, e.g. "to browse properties". */
    children: ReactElement | string;
    className?: string;
};

/**
 * Always-visible "Press [G] [P] to browse properties" line — for empty
 * states with nothing to click through to. Not a link: there is no data on
 * the destination page, so the hint teaches the shortcut instead of sending
 * the user to another empty screen.
 */
export function ShortcutKbdMessage({ shortcutId, children, className }: ShortcutKbdMessageProps) {
    const shortcut = getShortcut(shortcutId);
    if (!shortcut) return null;

    return (
        <p className={cn("body-sm inline-flex flex-wrap items-center justify-center gap-1.5 text-ink-subtle", className)}>
            <span>Press</span>
            <KbdGroup className="gap-0.5">
                {shortcut.displayKeys.map((key) => (
                    <Kbd key={key} variant="muted" className="min-inline-4 px-1.5 text-[10px]">
                        {key}
                    </Kbd>
                ))}
            </KbdGroup>
            <span>{children}</span>
        </p>
    );
}
