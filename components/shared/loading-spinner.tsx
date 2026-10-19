"use client";

import { Tailspin } from "ldrs/react";

import { cn } from "@/lib/utils";

import "ldrs/react/Tailspin.css";

/**
 * Canonical app spinner — same Tailspin as Button `loading`, Input, Select.
 * Prefer this over Lucide `Loader2` or any ad-hoc ring.
 *
 * - `sm` (16) — chips, inline counts, control end-slots
 * - `md` (32) — page / panel waits (default)
 */
const SPINNER_SIZE = {
    sm: { box: "block-4 inline-4", px: "16", stroke: "2" },
    md: { box: "block-8 inline-8", px: "32", stroke: "3" },
} as const;

export type LoadingSpinnerSize = keyof typeof SPINNER_SIZE;

export function LoadingSpinner({
    label = "Loading",
    size = "md",
    className,
}: {
    label?: string;
    size?: LoadingSpinnerSize;
    className?: string;
}) {
    const spec = SPINNER_SIZE[size];

    return (
        <span
            className={cn("inline-flex shrink-0 text-brand", spec.box, className)}
            role="status"
            aria-label={label}
        >
            <Tailspin size={spec.px} stroke={spec.stroke} speed="0.9" color="currentColor" />
        </span>
    );
}

export function LoadingCenter({
    label = "Loading",
    className,
}: {
    label?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-4 min-block-64",
                className,
            )}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <LoadingSpinner label={label} />
            <p className="body text-ink-muted">{label}</p>
        </div>
    );
}
