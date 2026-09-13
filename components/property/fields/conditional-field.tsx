"use client";

import { type ReactNode, useEffect, useState } from "react";

import { useFieldRules } from "@/lib/visibility/use-field-rules";

export function ConditionalField({ path, children }: { path: string; children: ReactNode }) {
    const { isVisible, showHidden } = useFieldRules();
    const fieldIsVisible = isVisible(path);
    const [rendered, setRendered] = useState(fieldIsVisible);
    const [open, setOpen] = useState(fieldIsVisible);

    useEffect(() => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const timers: number[] = [];

        if (fieldIsVisible) {
            timers.push(window.setTimeout(() => setRendered(true), 0));
            timers.push(window.setTimeout(() => setOpen(true), reducedMotion ? 0 : 16));
        } else {
            timers.push(window.setTimeout(() => setOpen(false), 0));
            timers.push(window.setTimeout(() => setRendered(false), reducedMotion ? 0 : 250));
        }

        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, [fieldIsVisible]);

    if (!rendered && !showHidden) return null;

    return (
        <div
            data-field-path={path}
            data-hidden-field={!fieldIsVisible || undefined}
            className={
                !fieldIsVisible && showHidden
                    ? `
                      pointer-events-none rounded-control bg-surface-muted/70 p-2 opacity-45
                      grayscale min-inline-0
                    `
                    : "t-acc min-inline-0"
            }
            data-open={open}
            inert={!fieldIsVisible || undefined}
        >
            {!fieldIsVisible && showHidden ? (
                children
            ) : (
                <div className="t-acc-panel">
                    <div className="t-acc-panel-inner">{children}</div>
                </div>
            )}
            {!fieldIsVisible && showHidden ? (
                <p className="mbs-1 text-xs text-ink-muted">Hidden by the current property rules</p>
            ) : null}
        </div>
    );
}
