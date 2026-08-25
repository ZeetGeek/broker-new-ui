"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DashEnterProps = {
    children: ReactNode;
    /** 0-based stagger index — delay = index × `--dash-enter-stagger`. Cap ~8. */
    index: number;
    className?: string;
};

/** Staggered card enter on dashboard load — opacity + Y only (page-slide distance). */
export function DashEnter({ children, index, className }: DashEnterProps) {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        node.classList.remove("is-shown");
        void node.offsetWidth;
        node.classList.add("is-shown");
    }, []);

    return (
        <div
            ref={ref}
            className={cn("t-dash-enter", className)}
            style={{ "--dash-enter-index": index } as CSSProperties}
        >
            {children}
        </div>
    );
}
