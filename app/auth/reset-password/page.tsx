"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AuthPageFallback } from "@/features/auth/auth-busy-state";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

function ResetPasswordInner() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token")?.trim() ?? "";
    return <ResetPasswordForm token={token} />;
}

export default function Page() {
    return (
        <Suspense fallback={<AuthPageFallback title="Loading" description="Please wait." />}>
            <ResetPasswordInner />
        </Suspense>
    );
}
