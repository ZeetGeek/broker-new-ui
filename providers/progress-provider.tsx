"use client";

import { ProgressProvider as BProgressProvider } from "@bprogress/next/app";

/**
 * Route-change progress bar. Lives in its own client boundary so the root
 * layout stays a server component.
 */
export function ProgressProvider({ children }: { children: React.ReactNode }) {
    return (
        <BProgressProvider
            height="3px"
            color="#1b7a5a"
            options={{ showSpinner: false }}
            startPosition={0.12}
        >
            {children}
        </BProgressProvider>
    );
}
