"use client";

import * as React from "react";

import { MotionConfig } from "motion/react";

import { AppToaster } from "@/components/shared/app-toast";

/**
 * App chrome wrapper. Theme is fixed to light (see `html` in `app/layout.tsx`) —
 * next-themes is intentionally not used: its inline script trips React 19’s
 * “script tag while rendering” console error under Next 16.
 */
function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <MotionConfig reducedMotion="user">
            {children}
            <AppToaster />
        </MotionConfig>
    );
}

export { ThemeProvider };
