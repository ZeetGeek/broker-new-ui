"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { LoadingCenter } from "@/components/shared/loading-spinner";

import { ResetPasswordForm } from "@/features/auth/reset-password-form";

function ResetPasswordInner() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token")?.trim() ?? "";
    return <ResetPasswordForm token={token} />;
}

export default function Page() {
    return (
        <Suspense fallback={<LoadingCenter />}>
            <ResetPasswordInner />
        </Suspense>
    );
}
