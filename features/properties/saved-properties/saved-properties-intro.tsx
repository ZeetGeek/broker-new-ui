"use client";

import { type ReactNode, useMemo, useState } from "react";

import { TextLoop } from "@/components/motion-primitives/text-loop";

const SUMMARY_LOOP_INTERVAL_S = 6.5;

function countLabel(count: number) {
    return count === 1 ? "1 saved property" : `${count} saved properties`;
}

function buildSummaryLines(total: number, isLoading: boolean, hasError: boolean): ReactNode[] {
    if (isLoading && total === 0) {
        return ["Finding saved properties…"];
    }

    if (hasError && total === 0) {
        return ["Could not load saved properties"];
    }

    if (total === 0) {
        return ["Save a property to come back to it later"];
    }

    return [countLabel(total)];
}

export function SavedPropertiesIntro({
    total,
    isLoading = false,
    hasError = false,
}: {
    total: number;
    isLoading?: boolean;
    hasError?: boolean;
}) {
    const [isPaused, setIsPaused] = useState(false);
    const lines = useMemo(
        () => buildSummaryLines(total, isLoading, hasError),
        [hasError, isLoading, total],
    );

    return (
        <div className="flex flex-col items-start gap-3 text-start">
            <h1 className="h3 min-inline-0">
                <span className="text-ink">Saved properties</span>
                <span className="text-ink">.</span>{" "}
                <span
                    aria-live="polite"
                    aria-atomic="true"
                    className="text-ink-muted"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <TextLoop interval={SUMMARY_LOOP_INTERVAL_S} trigger={!isPaused}>
                        {lines.map((line, index) => (
                            <span key={index}>{line}</span>
                        ))}
                    </TextLoop>
                </span>
            </h1>
            <p className="body hidden text-ink-muted max-inline-[52ch] sm:block">
                Properties you save from Owner listings and Your listings, in one place.
            </p>
        </div>
    );
}
