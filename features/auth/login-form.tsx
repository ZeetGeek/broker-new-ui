"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { decodeLoginLinkToken } from "@/lib/auth/login-link";
import { destinationForRole } from "@/lib/auth/session";
import { useRouter, useSearchParams } from "@/lib/navigation";
import { loginSchema, type LoginValues } from "@/lib/validation/auth";

import toast from "@/components/shared/app-toast";
import { EmailFieldIcon, PasswordIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import { useAppDispatch } from "@/store/hooks";
import { login } from "@/store/slices/auth-slice";

import { AuthFormFrame } from "./auth-back-link";
import { AuthHeading } from "./auth-heading";
import { OrDivider } from "./or-divider";
import { SocialAuthButtons } from "./social-auth-buttons";

const REMEMBERED_EMAIL_KEY = "remembered-login-email";

/**
 * Testing aid: `/login?t=<token>` signs in automatically (token from
 * `scripts/make-login-link.ts`). The credentials never touch the form fields.
 * On in development; elsewhere only when NEXT_PUBLIC_ENABLE_QUERY_LOGIN=true.
 * Never enable on production — the token is obfuscated, not encrypted.
 */
const QUERY_LOGIN_ENABLED =
    process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_QUERY_LOGIN === "true";

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const [unverifiedEmail, setUnverifiedEmail] = React.useState<string | null>(null);
    const [isResending, setIsResending] = React.useState(false);
    const [isRedirecting, setIsRedirecting] = React.useState(false);
    // Busy from the first paint when a sign-in link is present, so the empty
    // form never looks idle while the token is used.
    const [isAutoSigningIn, setIsAutoSigningIn] = React.useState(
        () => QUERY_LOGIN_ENABLED && Boolean(searchParams.get("t")),
    );

    const {
        control,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        mode: "onTouched",
        reValidateMode: "onChange",
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
    });

    React.useEffect(() => {
        if (searchParams.get("error") === "google") {
            toast.error("Google sign-in failed. Please try again.");
        }
    }, [searchParams]);

    React.useEffect(() => {
        const savedEmail = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
        if (!savedEmail) {
            return;
        }
        reset({
            email: savedEmail,
            password: "",
            rememberMe: true,
        });
    }, [reset]);

    async function onSubmit(values: LoginValues) {
        if (values.rememberMe) {
            window.localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
        } else {
            window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
        await signIn(values);
    }

    async function signIn(values: LoginValues) {
        setUnverifiedEmail(null);
        try {
            const result = await dispatch(
                login({
                    email: values.email.trim(),
                    password: values.password,
                    rememberMe: values.rememberMe,
                }),
            ).unwrap();
            setIsRedirecting(true);
            toast.message("signed-in");
            const destination = destinationForRole(result.user.role, searchParams.get("next"));
            router.replace(destination);
        } catch (err: unknown) {
            const payload = err as { message?: string; status?: number } | undefined;
            if (payload?.status === 403) {
                setUnverifiedEmail(values.email.trim());
                toast.error(payload.message || "Please verify your email before logging in");
                return;
            }
            toast.error(payload?.message || "Login failed");
        }
    }

    const hasAutoLoginStartedRef = React.useRef(false);

    // Sign in straight from the token; the fields stay empty so the email
    // and password are never shown on screen.
    const signInFromToken = React.useEffectEvent(async (token: string) => {
        try {
            const credentials = decodeLoginLinkToken(token);
            if (!credentials) {
                toast.error(
                    "This sign-in link is not valid. Sign in with your email and password.",
                );
                return;
            }
            await signIn({ ...credentials, rememberMe: false });
        } finally {
            setIsAutoSigningIn(false);
        }
    });

    React.useEffect(() => {
        if (!QUERY_LOGIN_ENABLED || hasAutoLoginStartedRef.current) return;
        const token = searchParams.get("t");
        if (!token) return;
        hasAutoLoginStartedRef.current = true;

        // Drop the token from the address bar and history; keep `next`.
        const url = new URL(window.location.href);
        url.searchParams.delete("t");
        window.history.replaceState(window.history.state, "", url);

        void signInFromToken(token);
    }, [searchParams]);

    async function handleResendVerification() {
        if (!unverifiedEmail) return;
        setIsResending(true);
        try {
            const res = await authApi.resendVerification(unverifiedEmail);
            toast.message("verification-sent", {
                title: "Verification email requested",
                description:
                    res.message ||
                    "If that email is registered and unverified, a verification link has been sent.",
            });
        } catch (err: unknown) {
            toast.error(err instanceof ApiError ? err.message : "Could not resend verification");
        } finally {
            setIsResending(false);
        }
    }

    // Keep the form on screen; the button carries the pending state until the
    // dashboard replaces this page.
    const isBusy = isSubmitting || isRedirecting || isAutoSigningIn;

    return (
        <AuthFormFrame>
            <div className="mx-auto flex flex-col gap-6 inline-full max-inline-96">
                <AuthHeading
                    title="Sign in"
                    description="Welcome back. Enter your details to continue."
                />

                <SocialAuthButtons action="Sign in" role="broker" />

                <OrDivider />

                <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Controller
                        name="email"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <label htmlFor="login-email" className="body font-medium text-ink">
                                    Email{" "}
                                    <span className="text-brand" aria-hidden="true">
                                        *
                                    </span>
                                </label>
                                <Input
                                    id="login-email"
                                    size="lg"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    startIcon={EmailFieldIcon}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    errorText={fieldState.error?.message}
                                    success={
                                        fieldState.isTouched &&
                                        !fieldState.invalid &&
                                        field.value.length > 0
                                    }
                                />
                            </div>
                        )}
                    />

                    <div className="flex flex-col gap-3">
                        <Controller
                            name="password"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <label
                                            htmlFor="login-password"
                                            className="body font-medium text-ink"
                                        >
                                            Password{" "}
                                            <span className="text-brand" aria-hidden="true">
                                                *
                                            </span>
                                        </label>
                                        <Link
                                            href="/forgot-password"
                                            className="
                                              body-sm font-medium text-brand underline-offset-4
                                              hover:underline
                                            "
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <Input
                                        id="login-password"
                                        size="lg"
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="Enter password"
                                        startIcon={PasswordIcon}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        errorText={fieldState.error?.message}
                                    />
                                </div>
                            )}
                        />

                        <Controller
                            name="rememberMe"
                            control={control}
                            render={({ field }) => (
                                <label
                                    htmlFor="login-remember"
                                    className="flex cursor-pointer items-center gap-2 self-start"
                                >
                                    <Checkbox
                                        id="login-remember"
                                        name={field.name}
                                        checked={field.value}
                                        onCheckedChange={(checked) =>
                                            field.onChange(checked === true)
                                        }
                                        onBlur={field.onBlur}
                                    />
                                    <span className="body text-ink">Remember me</span>
                                </label>
                            )}
                        />
                    </div>

                    {unverifiedEmail ? (
                        <div
                            className="
                              flex flex-col gap-3 rounded-inner border border-border-warm bg-surface
                              p-4
                            "
                        >
                            <p className="body-sm text-ink-muted">
                                This account is not verified yet. Resend the verification email to{" "}
                                <span className="font-medium text-ink">{unverifiedEmail}</span>.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="md"
                                loading={isResending}
                                onClick={() => void handleResendVerification()}
                            >
                                {isResending ? "Sending" : "Resend verification email"}
                            </Button>
                        </div>
                    ) : null}

                    <Button
                        size="lg"
                        variant="accent"
                        type="submit"
                        className="inline-full"
                        loading={isBusy}
                    >
                        {isBusy ? "Signing in…" : "Sign in"}
                    </Button>
                </form>

                <p className="body text-center text-ink-muted">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        className="body font-medium text-brand underline underline-offset-4"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </AuthFormFrame>
    );
}
