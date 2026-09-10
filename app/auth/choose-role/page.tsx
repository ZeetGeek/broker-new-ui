"use client";

import { Suspense } from "react";


import { GoogleRolePickerPanel } from "@/features/auth/google-role-picker-panel";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <GoogleRolePickerPanel />
        </Suspense>
    );
}
