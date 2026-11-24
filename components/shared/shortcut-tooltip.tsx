"use client";

import type { ReactElement } from "react";

import { getShortcut, type ShortcutId, type ShortcutPortal } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useShortcutDisplayKeys } from "@/features/shortcuts/use-shortcut-display-keys";

export type ShortcutTooltipProps = {
    /** Registry id — the tooltip renders that shortcut's own label unless overridden. */
    shortcutId: ShortcutId;
    /** Override the registry label, e.g. "Add contacts" for a button that lands on Contacts. */
    label?: string;
    side?: "top" | "bottom" | "inline-start" | "inline-end";
    portal?: ShortcutPortal;
    children: ReactElement;
};

/**
 * Wraps a trigger with a tooltip naming the keyboard shortcut that lands on
 * the same page. Only use this where the shortcut's route and the trigger's
 * destination genuinely match — see docs/SHORTCUTS.md discoverability.
 */
export function ShortcutTooltip({
    shortcutId,
    label,
    side = "bottom",
    portal = "broker",
    children,
}: ShortcutTooltipProps) {
    const shortcut = getShortcut(shortcutId, portal);
    const displayKeys = useShortcutDisplayKeys(shortcut);
    if (!shortcut) return children;

    return (
        <Tooltip>
            <TooltipTrigger render={children} />
            <TooltipContent side={side}>
                {label ?? shortcut.label}
                <KbdGroup className="gap-0.5">
                    {displayKeys.map((key) => (
                        <Kbd key={key} className="px-1.5 text-[10px] min-inline-4">
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
    portal?: ShortcutPortal;
};

/**
 * Always-visible "Press [G] [P] to browse properties" line — for empty
 * states with nothing to click through to. Not a link: there is no data on
 * the destination page, so the hint teaches the shortcut instead of sending
 * the user to another empty screen.
 */
export function ShortcutKbdMessage({
    shortcutId,
    children,
    className,
    portal = "broker",
}: ShortcutKbdMessageProps) {
    const shortcut = getShortcut(shortcutId, portal);
    const displayKeys = useShortcutDisplayKeys(shortcut);
    if (!shortcut) return null;

    return (
        <p
            className={cn(
                `body-sm inline-flex flex-wrap items-center justify-center gap-1.5 text-ink-subtle pointer-coarse:hidden`,
                className,
            )}
        >
            <span>Press</span>
            <KbdGroup className="gap-0.5">
                {displayKeys.map((key) => (
                    <Kbd key={key} variant="muted" className="px-1.5 text-[10px] min-inline-4">
                        {key}
                    </Kbd>
                ))}
            </KbdGroup>
            <span>{children}</span>
        </p>
    );
}
