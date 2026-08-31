"use client";

import { Suspense } from "react";

import { AuthPageFallback } from "@/features/auth/auth-busy-state";
import { VerifyPendingPanel } from "@/features/auth/verify-pending-panel";

export default function Page() {
    return (
        <Suspense fallback={<AuthPageFallback title="Loading" description="Please wait." />}>
            <VerifyPendingPanel />
        </Suspense>
    );
}
