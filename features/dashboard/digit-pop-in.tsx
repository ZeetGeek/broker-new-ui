"use client";

import { useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export type DigitPopInProps = {
    value: number | string;
    className?: string;
};

/** transitions.dev number pop-in — each character rises in with blur on mount / value change. */
export function DigitPopIn({ value, className }: DigitPopInProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const text = String(value);
    const chars = text.split("");

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        node.classList.remove("is-animating");
        void node.offsetWidth;
        node.classList.add("is-animating");
    }, [text]);

    return (
        <span ref={ref} className={cn("t-digit-group", className)} aria-label={text}>
            {chars.map((ch, i) => {
                const fromEnd = chars.length - 1 - i;
                const stagger =
                    fromEnd === 1 ? "1" : fromEnd === 0 && chars.length > 1 ? "2" : undefined;
                return (
                    <span
                        key={`${i}-${ch}`}
                        className="t-digit"
                        data-stagger={stagger}
                        aria-hidden
                    >
                        {ch}
                    </span>
                );
            })}
        </span>
    );
}
