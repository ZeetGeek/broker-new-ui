"use client";

import * as React from "react";

export function AuthFormEnter({ children }: { children: React.ReactNode }) {
    const ref = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        const node = ref.current;
        if (!node) {
            return;
        }
        node.classList.remove("is-shown");
        void node.offsetWidth;
        node.classList.add("is-shown");
    }, []);

    return (
        <div ref={ref} className="t-auth-enter inline-full">
            {children}
        </div>
    );
}
