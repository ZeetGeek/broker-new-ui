"use client";

import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";

import { perspective, slide } from "./anim";

/**
 * "Inner Perspective" page transition (after Alex Tkachev's portfolio).
 *
 * 1. Slide       — a panel sweeps up to cover the outgoing page, then fades
 *                  away once the new one has painted.
 * 2. Perspective — while the panel covers, the page scales down and lifts,
 *                  so it reads as a card falling back into a dark void.
 *
 * The overlay's own fade is the reveal; the content underneath does not
 * animate, so nothing moves once it is uncovered.
 *
 * The cover is driven by `isCovering`, not by `AnimatePresence`'s exit,
 * because navigation is held until the cover finishes — see
 * `useInterceptedNavigation`. The reveal is a fade rather than a reversal:
 * sliding the panel back down drags it across the viewport and reads as a
 * bounce.
 */
export function Inner({
    children,
    isCovering = false,
    isShrunk = false,
    contentKey,
    backgroundColor = "var(--color-surface-muted)",
    className,
}: {
    children: React.ReactNode;
    /** True while the overlay is present — covering, or fading off. */
    isCovering?: boolean;
    /** True while the page is scaled back. Released one frame before
     *  `isCovering`, so the overlay never uncovers a moving page. */
    isShrunk?: boolean;
    /** Changes when the route does, so the incoming content replays its fade. */
    contentKey?: string;
    /** Colour of the sliding cover panel. Matches the page background by
     *  default, as in the reference — the dark gap does the visible work. */
    backgroundColor?: string;
    className?: string;
}) {
    return (
        <div className="relative isolate overflow-hidden bg-brand-ink min-block-screen">
            <AnimatePresence>
                {isCovering && (
                    <motion.div
                        key="cover"
                        className="
                          pointer-events-none fixed inset-s-0 inset-bs-0 z-50 block-screen
                          inline-screen
                        "
                        style={{ backgroundColor }}
                        variants={slide}
                        initial="initial"
                        animate="cover"
                        exit="reveal"
                    />
                )}
            </AnimatePresence>
            <motion.div
                className="origin-top bg-surface-muted min-block-screen"
                variants={perspective}
                initial="initial"
                animate={isShrunk ? "cover" : "rest"}
            >
                <div key={contentKey} className={cn(className)}>
                    {children}
                </div>
            </motion.div>
        </div>
    );
}
