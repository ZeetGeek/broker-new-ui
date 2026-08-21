"use client";

import * as React from "react";

export function AuthSuccessCheck() {
    const checkRef = React.useRef<HTMLSpanElement>(null);

    React.useLayoutEffect(() => {
        const check = checkRef.current;
        if (!check) {
            return;
        }
        const path = check.querySelector("path");
        if (path) {
            const length = Math.ceil(path.getTotalLength());
            path.style.strokeDasharray = String(length);
            path.style.strokeDashoffset = String(length);
        }
        check.setAttribute("data-state", "out");
        void check.offsetWidth;
        check.setAttribute("data-state", "in");
    }, []);

    return (
        <span
            className="
              flex items-center justify-center rounded-full bg-brand-soft text-brand-text
              block-16 inline-16
            "
        >
            <span ref={checkRef} className="t-success-check" data-state="out" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none" className="block-8 inline-8">
                    <path
                        d="M12 24.5 20.5 33 36 15.5"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>
        </span>
    );
}
