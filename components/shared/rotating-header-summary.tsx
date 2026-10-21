"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { Skeleton } from "@/components/shared/skeleton";

/** Shared by marketplace and CRM headings; every message occupies the same stable slot. */
export function RotatingHeaderSummary({
    lines,
    isLoading = false,
    loadingLabel = "Loading summary",
    loadingPlaceholder,
    errorMessage,
    reservePlaceholder = false,
}: {
    lines: string[];
    isLoading?: boolean;
    loadingLabel?: string;
    loadingPlaceholder: string;
    errorMessage?: string;
    /** Keep the loading slot as a minimum after data arrives. */
    reservePlaceholder?: boolean;
}) {
    const [isPaused, setIsPaused] = useState(false);
    const reduceMotion = useReducedMotion();
    const visibleLines = errorMessage
        ? [errorMessage]
        : lines.length
          ? lines
          : [loadingPlaceholder];

    return (
        <span
            aria-live="polite"
            aria-atomic="true"
            aria-busy={isLoading}
            className="relative inline-grid grid-cols-[minmax(0,1fr)] align-bottom text-ink-muted max-inline-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {(isLoading
                ? [loadingPlaceholder]
                : reservePlaceholder
                  ? [loadingPlaceholder, ...visibleLines]
                  : visibleLines
            ).map((line, index) => (
                <span
                    key={index}
                    aria-hidden
                    className="invisible col-start-1 row-start-1 text-pretty"
                >
                    {line}
                </span>
            ))}
            {isLoading ? (
                <>
                    <span className="sr-only">{loadingLabel}</span>
                    <span
                        aria-hidden
                        className="absolute inset-s-0 inset-bs-[0.12em] overflow-hidden rounded-control bg-border-warm block-[0.8em] inline-full"
                    >
                        <Skeleton className="bg-ink/3 block-full inline-full" />
                    </span>
                </>
            ) : reduceMotion || errorMessage || visibleLines.length === 1 ? (
                <span className="col-start-1 row-start-1 text-pretty">{visibleLines[0]}</span>
            ) : (
                <TextLoop
                    key={visibleLines.length}
                    interval={6.5}
                    trigger={!isPaused}
                    className="absolute inset-0 whitespace-normal"
                >
                    {visibleLines.map((line, index) => (
                        <span key={index} className="text-pretty">
                            {line}
                        </span>
                    ))}
                </TextLoop>
            )}
        </span>
    );
}
