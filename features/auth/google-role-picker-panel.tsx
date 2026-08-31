"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
    getAccessToken,
    getStoredUser,
    GOOGLE_ONBOARDING_KEY,
    portalHomeForRole,
} from "@/lib/auth/session";

import { Button } from "@/components/ui/button";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { establishSession } from "@/store/slices/auth-slice";

import { AuthFormFrame } from "./auth-back-link";
import { AuthBusyState } from "./auth-busy-state";
import { AuthHeading } from "./auth-heading";
import { type Portal } from "./portal";
import { PortalPicker } from "./portal-picker";
export function GoogleRolePickerPanel() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const currentRole = useAppSelector((state) => state.auth.user?.role);
    const [portal, setPortal] = React.useState<Portal>(() => {
        const storedRole = getStoredUser()?.role;
        return storedRole === "owner" ? "owner" : "broker";
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    React.useEffect(() => {
        if (!getAccessToken()) {
            router.replace("/login");
            return;
        }
        if (sessionStorage.getItem(GOOGLE_ONBOARDING_KEY) !== "1") {
            router.replace(portalHomeForRole(currentRole));
        }
    }, [router, currentRole]);

    async function handleContinue() {
        setIsSubmitting(true);
        try {
            const current = currentRole === "owner" ? "owner" : "broker";
            if (portal === current) {
                sessionStorage.removeItem(GOOGLE_ONBOARDING_KEY);
                setIsRedirecting(true);
                router.replace(portalHomeForRole(portal));
                return;
            }
            console.log("portal", portal);
            const result = await authApi.completeGoogleRole(portal);
            console.log("result", result);
            dispatch(
                establishSession({
                    accessToken: result.accessToken,
                    user: result.user,
                }),
            );
            sessionStorage.removeItem(GOOGLE_ONBOARDING_KEY);
            setIsRedirecting(true);
            router.replace(portalHomeForRole(result.user.role));
        } catch (err: unknown) {
            toast.error(err instanceof ApiError ? err.message : "Could not save your role");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isRedirecting) {
        return (
            <AuthFormFrame>
                <AuthBusyState title="All set" description="Taking you to your dashboard." />
            </AuthFormFrame>
        );
    }

    return (
        <AuthFormFrame>
            <div className="mx-auto flex flex-col gap-8 inline-full max-inline-140">
                <div className="mx-auto inline-full max-inline-96">
                    <AuthHeading
                        title="Pick a role"
                        description="This account is for one role. Choose owner or broker to continue."
                    />
                </div>

                <PortalPicker value={portal} onChange={setPortal} ariaLabel="Sign in as" />

                <div className="mx-auto flex flex-col gap-6 inline-full max-inline-96">
                    <Button
                        size="lg"
                        variant="accent"
                        type="button"
                        className="inline-full"
                        loading={isSubmitting}
                        onClick={() => void handleContinue()}
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </AuthFormFrame>
    );
}
