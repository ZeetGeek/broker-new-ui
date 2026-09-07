"use client";
import React, { type ElementType, type JSX, useMemo } from "react";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export type TextShimmerProps = {
    children: string;
    as?: ElementType;
    className?: string;
    duration?: number;
    spread?: number;
};

/** Module-scope motion tags — avoid `motion.create` during render. */
const MOTION_TAGS = {
    p: motion.p,
    span: motion.span,
    div: motion.div,
    h1: motion.h1,
    h2: motion.h2,
    h3: motion.h3,
    h4: motion.h4,
    h5: motion.h5,
    h6: motion.h6,
} as const satisfies Partial<Record<keyof JSX.IntrinsicElements, typeof motion.p>>;

function TextShimmerComponent({
    children,
    as: Component = "p",
    className,
    duration = 2,
    spread = 2,
}: TextShimmerProps) {
    const tag =
        typeof Component === "string" && Component in MOTION_TAGS
            ? (Component as keyof typeof MOTION_TAGS)
            : "p";
    const MotionComponent = MOTION_TAGS[tag];

    const dynamicSpread = useMemo(() => {
        return children.length * spread;
    }, [children, spread]);

    return (
        <MotionComponent
            className={cn(
                "relative inline-block bg-size-[250%_100%,auto] bg-clip-text",
                "text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]",
                `
          [background-repeat:no-repeat,padding-box]
          [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]
        `,
                `
          dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff]
          dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]
        `,
                className,
            )}
            initial={{ backgroundPosition: "100% center" }}
            animate={{ backgroundPosition: "0% center" }}
            transition={{
                repeat: Infinity,
                duration,
                ease: "linear",
            }}
            style={
                {
                    "--spread": `${dynamicSpread}px`,
                    backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
                } as React.CSSProperties
            }
        >
            {children}
        </MotionComponent>
    );
}

export const TextShimmer = React.memo(TextShimmerComponent);
