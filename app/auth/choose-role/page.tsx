"use client";

import { Suspense } from "react";

import { LoadingCenter } from "@/components/shared/loading-spinner";

import { GoogleRolePickerPanel } from "@/features/auth/google-role-picker-panel";

export default function Page() {
    return (
        <Suspense fallback={<LoadingCenter />}>
            <GoogleRolePickerPanel />
        </Suspense>
    );
}
