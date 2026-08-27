"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { authApi } from "@/lib/api/auth";
import { clearSession, portalHomeForRole } from "@/lib/auth/session";

import { LoadingSpinner } from "@/components/shared/loading-spinner";

import { AuthFormFrame } from "@/features/auth/auth-back-link";
import { AuthHeading } from "@/features/auth/auth-heading";
import { useAppDispatch } from "@/store/hooks";
import { establishSession } from "@/store/slices/auth-slice";

export function AuthCallbackPanel() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const [message, setMessage] = React.useState("Completing Google sign-in...");

    React.useEffect(() => {
        const token = searchParams.get("accessToken");
        if (!token) {
            router.replace("/login?error=google");
            return;
        }

        let cancelled = false;

        void (async () => {
            try {
                localStorage.setItem("broker_access_token", token);
                const user = await authApi.profile(token);
                if (cancelled) return;
                dispatch(establishSession({ accessToken: token, user }));
                setMessage("Signed in. Redirecting...");
                router.replace(portalHomeForRole(user.role));
            } catch {
                clearSession();
                if (!cancelled) {
                    router.replace("/login?error=google");
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [searchParams, router, dispatch]);

    return (
        <AuthFormFrame>
            <div
                className="
              mx-auto flex flex-col items-center gap-6 text-center inline-full max-inline-96
            "
            >
                <LoadingSpinner />
                <AuthHeading title="Signing you in" description={message} />
            </div>
        </AuthFormFrame>
    );
}
