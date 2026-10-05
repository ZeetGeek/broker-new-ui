"use client";

import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** ~40px/s reads comfortably; clamp so short overflows don't jerk and long ones don't crawl. */
function marqueeDuration(distancePx: number): number {
    return Math.min(12, Math.max(3, distancePx / 40));
}

/**
 * Single line of text with an ellipsis. When it overflows, it scrolls to reveal
 * the end while an ancestor `group/marquee` is hovered or focused (styles in
 * globals.css). Reduced motion keeps the ellipsis.
 */
export function MarqueeText({ text, className }: { text: string; className?: string }) {
    const containerRef = useRef<HTMLSpanElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [distance, setDistance] = useState(0);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        function measure() {
            const box = containerRef.current;
            const label = textRef.current;
            if (!box || !label) return;
            setDistance(Math.max(0, label.scrollWidth - box.clientWidth));
        }

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(container);
        return () => observer.disconnect();
    }, [text]);

    const overflows = distance > 2;
    const style = overflows
        ? ({
              "--marquee-distance": `${distance}px`,
              "--marquee-duration": `${marqueeDuration(distance)}s`,
          } as CSSProperties)
        : undefined;

    return (
        <span
            ref={containerRef}
            data-overflow={overflows ? "true" : undefined}
            title={overflows ? text : undefined}
            className={cn("marquee-text", className)}
            style={style}
        >
            <span ref={textRef} className="marquee-text-inner">
                {text}
            </span>
        </span>
    );
}
