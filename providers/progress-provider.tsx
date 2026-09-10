"use client";

import { ProgressProvider as BProgressProvider } from "@bprogress/next/app";

/**
 * Route-change progress bar. Lives in its own client boundary so the root
 * layout stays a server component.
 */
export function ProgressProvider({ children }: { children: React.ReactNode }) {
    return (
        <BProgressProvider
            height="4px"
            color="linear-gradient(90deg,rgba(44, 121, 90, 0) 0%, rgba(44, 121, 90, 1) 100%)"
            options={{ showSpinner: false }}
            shallowRouting
        >
            {children}
        </BProgressProvider>
    );
}
