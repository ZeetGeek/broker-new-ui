"use client";

import { useEffect, useRef } from "react";

import { tinykeys } from "tinykeys";

import { getShortcut, type ShortcutId, type ShortcutPortal } from "@/lib/shortcuts";

import {
    isShortcutEventBlocked,
    type ShortcutGuardOptions,
} from "@/features/shortcuts/shortcut-event";

export type UseShortcutOptions = ShortcutGuardOptions & {
    enabled?: boolean;
    portal?: ShortcutPortal;
    shouldHandle?: (event: KeyboardEvent) => boolean;
};

/** Register one registry-backed shortcut and always clean it up on unmount. */
export function useShortcut(
    id: ShortcutId,
    handler: (event: KeyboardEvent) => void,
    {
        enabled = true,
        portal = "broker",
        allowInDialog = false,
        allowInEditable = false,
        shouldHandle,
    }: UseShortcutOptions = {},
) {
    const handlerRef = useRef(handler);
    const shouldHandleRef = useRef(shouldHandle);
    useEffect(() => {
        handlerRef.current = handler;
        shouldHandleRef.current = shouldHandle;
    }, [handler, shouldHandle]);

    useEffect(() => {
        if (!enabled) return undefined;
        const shortcut = getShortcut(id, portal);
        if (!shortcut) return undefined;

        return tinykeys(window, {
            [shortcut.keys]: (event) => {
                if (isShortcutEventBlocked(event, { allowInDialog, allowInEditable })) return;
                if (shouldHandleRef.current && !shouldHandleRef.current(event)) return;
                event.preventDefault();
                handlerRef.current(event);
            },
        });
    }, [allowInDialog, allowInEditable, enabled, id, portal]);
}
