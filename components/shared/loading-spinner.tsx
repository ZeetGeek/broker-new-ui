"use client";

import { Tailspin } from "ldrs/react";

import { cn } from "@/lib/utils";

import "ldrs/react/Tailspin.css";

export function LoadingSpinner({
    label = "Loading",
    className,
}: {
    label?: string;
    className?: string;
}) {
    return (
        <span
            className={cn("inline-flex shrink-0 text-brand block-8 inline-8", className)}
            role="status"
            aria-label={label}
        >
            <Tailspin size="32" stroke="3" speed="0.9" color="currentColor" />
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
