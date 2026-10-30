"use client";

import * as React from "react";
import toast from "react-hot-toast";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { isOwnerUnavailable, OWNER_UNAVAILABLE_HREF, signupPortal } from "@/lib/auth/launch-policy";
import {
    getAccessToken,
    getStoredUser,
    GOOGLE_ONBOARDING_KEY,
    portalHomeForRole,
} from "@/lib/auth/session";
import { useRouter } from "@/lib/navigation";

import { Button } from "@/components/ui/button";

import { FEATURE_PLATFORM_OWNER } from "@/config";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { establishSession } from "@/store/slices/auth-slice";

import { AuthFormFrame } from "./auth-back-link";
import { AuthBusyState } from "./auth-busy-state";
import { AuthHeading } from "./auth-heading";
import { CountryPicker, useSuggestedCountryIso2 } from "./country-picker";
import { type Portal } from "./portal";
import { PortalPicker } from "./portal-picker";
export function GoogleRolePickerPanel() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const currentRole = useAppSelector((state) => state.auth.user?.role);
    const hydrated = useAppSelector((state) => state.auth.hydrated);
    // Google tells us no country. Ask only when the account has none yet —
    // a register-page signup already carried it through.
    const hasCountry = useAppSelector((state) => Boolean(state.auth.user?.country));
    const suggestedCountryIso2 = useSuggestedCountryIso2();
    // `null` until the user touches the picker, so clearing it stays cleared.
    const [pickedCountryIso2, setCountryIso2] = React.useState<string | null>(null);
    const countryIso2 = pickedCountryIso2 ?? suggestedCountryIso2;
    const [countryError, setCountryError] = React.useState<string | undefined>();
    const [portal, setPortal] = React.useState<Portal>(() => {
        const storedRole = getStoredUser()?.role;
        return signupPortal(storedRole === "owner" ? "owner" : "broker");
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    React.useEffect(() => {
        if (!hydrated) return;
        if (!getAccessToken()) {
            router.replace("/login");
            return;
        }
        if (isOwnerUnavailable(currentRole ?? getStoredUser()?.role)) {
            sessionStorage.removeItem(GOOGLE_ONBOARDING_KEY);
            router.replace(OWNER_UNAVAILABLE_HREF);
            return;
        }
        if (sessionStorage.getItem(GOOGLE_ONBOARDING_KEY) !== "1") {
            router.replace(portalHomeForRole(currentRole));
        }
    }, [router, currentRole, hydrated]);

    async function handleContinue() {
        if (!hydrated) return;
        if (isOwnerUnavailable(currentRole ?? getStoredUser()?.role)) {
            sessionStorage.removeItem(GOOGLE_ONBOARDING_KEY);
            router.replace(OWNER_UNAVAILABLE_HREF);
            return;
        }
        if (!hasCountry && !countryIso2) {
            setCountryError("Choose the country you work in");
            return;
        }
        setIsSubmitting(true);
        try {
            const current = currentRole === "owner" ? "owner" : "broker";
            if (portal === current && hasCountry) {
                sessionStorage.removeItem(GOOGLE_ONBOARDING_KEY);
                setIsRedirecting(true);
                router.replace(portalHomeForRole(portal));
                return;
            }
            const result = await authApi.completeGoogleRole(
                signupPortal(portal),
                hasCountry ? undefined : countryIso2,
            );
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

    if (!hydrated || isRedirecting || isOwnerUnavailable(currentRole)) {
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
                        title={
                            FEATURE_PLATFORM_OWNER ? "Pick a role" : "Finish your broker account"
                        }
                        description={
                            FEATURE_PLATFORM_OWNER
                                ? "This account is for one role. Choose owner or broker to continue."
                                : "Confirm your country to continue."
                        }
                    />
                </div>

                {FEATURE_PLATFORM_OWNER ? (
                    <PortalPicker value={portal} onChange={setPortal} ariaLabel="Sign in as" />
                ) : null}

                {hasCountry ? null : (
                    <div className="mx-auto flex flex-col gap-2 inline-full max-inline-96">
                        <label htmlFor="google-country" className="body font-medium text-ink">
                            Country{" "}
                            <span className="text-brand" aria-hidden="true">
                                *
                            </span>
                        </label>
                        <CountryPicker
                            id="google-country"
                            value={countryIso2}
                            onValueChange={(next) => {
                                setCountryIso2(next);
                                setCountryError(undefined);
                            }}
                            errorText={countryError}
                        />
                    </div>
                )}

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
