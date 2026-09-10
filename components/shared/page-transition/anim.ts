import type { Variants } from "motion/react";

/**
 * Variants for the "Inner Perspective" page transition, after Alex Tkachev's
 * portfolio.
 *
 * Timings are scaled down from the reference (1.2s / 1s / 0.5s). Navigation is
 * held until the cover finishes, so the cover duration is dead time on every
 * click — a portfolio can afford a full second of it, a CRM cannot.
 */

const EASE = [0.76, 0, 0.24, 1] as const;

/** How long the cover takes to sweep in. Navigation waits exactly this long. */
export const COVER_DURATION = 0.55;

/** How long the cover takes to fade away once the new page has painted. */
export const REVEAL_DURATION = 0.45;

/**
 * The cover panel.
 *
 * In: slides up from below to hide the outgoing page.
 * Out: fades in place. It must NOT slide back down — the panel is already
 * covering the viewport, so animating `y` on the way out drags it across the
 * screen and reads as a bounce.
 */
export const slide: Variants = {
    initial: {
        y: "100vh",
        opacity: 1,
    },
    cover: {
        y: 0,
        opacity: 1,
        transition: {
            duration: COVER_DURATION,
            ease: EASE,
        },
    },
    reveal: {
        y: 0,
        opacity: 0,
        transition: {
            duration: REVEAL_DURATION,
            ease: "easeOut",
        },
    },
};

/**
 * The page falling back in space while the cover comes in.
 *
 * `rest` has `duration: 0` on purpose. The scale-down belongs to the OUTGOING
 * page; the incoming one must already be at rest when the cover fades off it.
 * Animating back to rest would make the new page visibly ride the reversal —
 * sliding down and scaling up from under the overlay.
 */
export const perspective: Variants = {
    initial: {
        scale: 1,
        y: 0,
        opacity: 1,
    },
    rest: {
        scale: 1,
        y: 0,
        opacity: 1,
        transition: { duration: 0 },
    },
    cover: {
        scale: 0.94,
        y: -60,
        opacity: 0.5,
        transition: {
            duration: 0.5,
            ease: EASE,
        },
    },
};
