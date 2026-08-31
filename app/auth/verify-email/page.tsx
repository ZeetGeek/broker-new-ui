"use client";

import { Suspense } from "react";

import { AuthPageFallback } from "@/features/auth/auth-busy-state";
import { VerifyEmailPanel } from "@/features/auth/verify-email-panel";

export default function Page() {
    return (
        <Suspense
            fallback={
                <AuthPageFallback
                    title="Verifying your email"
                    description="Checking your verification link."
                />
            }
        >
            <VerifyEmailPanel />
        </Suspense>
    );
}
