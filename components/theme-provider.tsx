"use client";

import * as React from "react";
import { Toaster } from "react-hot-toast";

import { MotionConfig } from "motion/react";

/**
 * App chrome wrapper. Theme is fixed to light (see `html` in `app/layout.tsx`) —
 * next-themes is intentionally not used: its inline script trips React 19’s
 * “script tag while rendering” console error under Next 16.
 */
function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <MotionConfig reducedMotion="user">
            {children}
            <Toaster
                position="bottom-center"
                toastOptions={{
                    className: "body font-sans!",
                    style: {
                        background: "var(--color-surface)",
                        color: "var(--color-ink)",
                        border: "1px solid var(--color-border-warm)",
                        borderRadius: "var(--radius-inner)",
                        boxShadow: "var(--shadow-md)",
                    },
                }}
            />
        </MotionConfig>
    );
}

export { ThemeProvider };
