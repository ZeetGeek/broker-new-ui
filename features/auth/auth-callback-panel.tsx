"use client";

import * as React from "react";

import { authApi } from "@/lib/api/auth";
import { isOwnerUnavailable, OWNER_UNAVAILABLE_HREF } from "@/lib/auth/launch-policy";
import { clearSession, GOOGLE_ONBOARDING_KEY, portalHomeForRole } from "@/lib/auth/session";
import { useRouter, useSearchParams } from "@/lib/navigation";
import { APP_NAME } from "@/config";

import { AuthFormFrame } from "@/features/auth/auth-back-link";
import { AuthBusyState } from "@/features/auth/auth-busy-state";
import { useAppDispatch } from "@/store/hooks";
import { establishSession } from "@/store/slices/auth-slice";

export function AuthCallbackPanel() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const [message, setMessage] = React.useState("Completing Google sign-in.");

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
                if (isOwnerUnavailable(user.role)) {
                    sessionStorage.removeItem(GOOGLE_ONBOARDING_KEY);
                    router.replace(OWNER_UNAVAILABLE_HREF);
                    return;
                }

                // Backend sets this only for a new Google account from the login
                // page. Register already chose a role, so those users skip this —
                // unless Google left the account without a country, which every
                // portal screen is scoped to.
                const isNewUser = searchParams.get("isNewUser") === "1";
                const needsCountry = searchParams.get("needsCountry") === "1" || !user.country;
                if (isNewUser || needsCountry) {
                    sessionStorage.setItem(GOOGLE_ONBOARDING_KEY, "1");
                    setMessage(`Almost there. Pick how you want to use ${APP_NAME}.`);
                    router.replace("/auth/choose-role");
                    return;
                }

                setMessage("Signed in. Taking you to your dashboard.");
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
            <AuthBusyState title="Signing you in" description={message} />
        </AuthFormFrame>
    );
}
