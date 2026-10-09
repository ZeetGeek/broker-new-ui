"use client";

import type { ReactNode } from "react";

import { motion } from "motion/react";

import { duration, ease, scale } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

const hoverScaleTransition = {
    duration: duration.fast,
    ease: ease.out,
} as const;

const hoverScaleVariants = {
    rest: { scale: 1 },
    hover: { scale: scale.imageHover },
} as const;

/**
 * Hover target for a clipped photo. Put overlays (badges, carousel chrome)
 * as siblings of `HoverScaleLayer` so they stay put while the image zooms.
 */
export function HoverScaleRoot({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div className={className} initial="rest" whileHover="hover">
            {children}
        </motion.div>
    );
}

export function HoverScaleLayer({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            className={cn("relative block-full inline-full", className)}
            variants={hoverScaleVariants}
            transition={hoverScaleTransition}
        >
            {children}
        </motion.div>
    );
}

/** The hovered element is also the thing that scales — thumbs, request photos. */
export function HoverScaleMedia({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <HoverScaleRoot className={cn("relative overflow-hidden", className)}>
            <HoverScaleLayer>{children}</HoverScaleLayer>
        </HoverScaleRoot>
    );
}
