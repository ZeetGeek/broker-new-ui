"use client";

import { Suspense } from "react";

import { LoadingCenter } from "@/components/shared/loading-spinner";

import { VerifyEmailPanel } from "@/features/auth/verify-email-panel";

export default function Page() {
    return (
        <Suspense fallback={<LoadingCenter />}>
            <VerifyEmailPanel />
        </Suspense>
    );
}
