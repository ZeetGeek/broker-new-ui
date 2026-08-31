"use client";

import { Suspense } from "react";

import { AuthPageFallback } from "@/features/auth/auth-busy-state";
import { AuthCallbackPanel } from "@/features/auth/auth-callback-panel";

export default function Page() {
    return (
        <Suspense
            fallback={
                <AuthPageFallback title="Signing you in" description="Completing Google sign-in." />
            }
        >
            <AuthCallbackPanel />
        </Suspense>
    );
}
