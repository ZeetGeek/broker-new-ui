"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StaggerRevealProps = {
    children: ReactNode;
    className?: string;
};

/** transitions.dev texts reveal — add `.is-shown` after mount. */
export function StaggerReveal({ children, className }: StaggerRevealProps) {
    const ref = useRef<HTMLHeadingElement>(null);

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        node.classList.remove("is-hiding", "is-shown");
        void node.offsetHeight;
        node.classList.add("is-shown");
    }, []);

    return (
        <h1 ref={ref} className={cn("t-stagger", className)}>
            {children}
        </h1>
    );
}
