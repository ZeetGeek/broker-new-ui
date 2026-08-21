"use client";

import * as React from "react";

export function AuthHeading({
    title,
    description,
}: {
    title: string;
    description: React.ReactNode;
}) {
    const blockRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        const block = blockRef.current;
        if (!block) {
            return;
        }
        block.classList.remove("is-hiding");
        block.classList.remove("is-shown");
        void block.offsetHeight;
        block.classList.add("is-shown");
    }, []);

    return (
        <div ref={blockRef} className="t-stagger flex flex-col gap-2 text-center">
            <h1 className="t-stagger-line t-stagger-line--1 h1 text-ink">{title}</h1>
            <p className="t-stagger-line t-stagger-line--2 body text-ink-muted">{description}</p>
        </div>
    );
}
