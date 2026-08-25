import type { Variants } from "motion/react";

import { duration, ease } from "@/lib/motion/tokens";

/** Shared mount enter — opacity + Y (page-slide distance). */
export const loadItem: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: duration.tabs, ease: ease.smoothOut },
    },
};

/** Portal chrome slides in from above. */
export const loadItemFromTop: Variants = {
    hidden: { opacity: 0, y: -8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: duration.tabs, ease: ease.smoothOut },
    },
};

export const loadContainer: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.04,
            delayChildren: 0.02,
        },
    },
};
