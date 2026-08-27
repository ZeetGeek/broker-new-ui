"use client";

import { Suspense } from "react";

import { LoadingCenter } from "@/components/shared/loading-spinner";

import { VerifyPendingPanel } from "@/features/auth/verify-pending-panel";

export default function Page() {
    return (
        <Suspense fallback={<LoadingCenter />}>
            <VerifyPendingPanel />
        </Suspense>
    );
}
