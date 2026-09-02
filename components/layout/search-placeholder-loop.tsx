"use client";

import { ease } from "@/lib/motion/tokens";

import { TextLoop } from "@/components/motion-primitives/text-loop";

/**
 * Rotating hint inside the header search control. Each line names something the
 * user can actually search for, so the control teaches its own scope.
 */
const SEARCH_HINTS = [
    "Search properties",
    "Find a client",
    "Look up a visit",
    "Search by locality",
    "Find an owner",
] as const;

export function SearchPlaceholderLoop() {
    return (
        <TextLoop
            className="body-sm font-medium"
            interval={4}
            transition={{ ease: ease.smoothOut }}
            variants={{
                initial: { y: 12, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: -12, opacity: 0 },
            }}
        >
            {SEARCH_HINTS.map((hint) => (
                <span key={hint}>{hint}</span>
            ))}
        </TextLoop>
    );
}
