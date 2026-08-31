"use client";

import { Suspense } from "react";

import { AuthPageFallback } from "@/features/auth/auth-busy-state";
import { LoginForm } from "@/features/auth/login-form";

export default function Page() {
    return (
        <Suspense
            fallback={<AuthPageFallback title="Loading" description="Getting sign in ready." />}
        >
            <LoginForm />
        </Suspense>
    );
}
