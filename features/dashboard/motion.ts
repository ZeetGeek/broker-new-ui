import type { Variants } from "motion/react";

import { duration, ease } from "@/lib/motion/tokens";
import { loadContainer, loadItem } from "@/lib/motion/variants";

export const dashboardLoadContainer = loadContainer;

export const dashboardLoadItem = loadItem;

/** Header greeting lines — slightly longer for emphasis. */
export const dashboardHeaderContainer: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.04,
        },
    },
};

export const dashboardHeaderLine: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: duration.slow, ease: ease.smoothOut },
    },
};

/** Broker status strip (RERA / market focus / snapshot / actions) — L→R stagger. */
export const dashboardMetaContainer: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.04,
            delayChildren: 0.08,
        },
    },
};

export const dashboardMetaItem = loadItem;
