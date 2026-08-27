"use client";

import { Suspense } from "react";

import { LoadingCenter } from "@/components/shared/loading-spinner";

import { AuthCallbackPanel } from "@/features/auth/auth-callback-panel";

export default function Page() {
    return (
        <Suspense fallback={<LoadingCenter />}>
            <AuthCallbackPanel />
        </Suspense>
    );
}
