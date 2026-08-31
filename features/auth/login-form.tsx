"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { portalHomeForRole } from "@/lib/auth/session";
import { loginSchema, type LoginValues } from "@/lib/validation/auth";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import { useAppDispatch } from "@/store/hooks";
import { login } from "@/store/slices/auth-slice";

import { AuthFormFrame } from "./auth-back-link";
import { AuthBusyState } from "./auth-busy-state";
import { AuthHeading } from "./auth-heading";
import { OrDivider } from "./or-divider";
import { SocialAuthButtons } from "./social-auth-buttons";

const REMEMBERED_EMAIL_KEY = "remembered-login-email";

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const [unverifiedEmail, setUnverifiedEmail] = React.useState<string | null>(null);
    const [isResending, setIsResending] = React.useState(false);
    const [isRedirecting, setIsRedirecting] = React.useState(false);

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
        setUnverifiedEmail(null);
        if (values.rememberMe) {
            window.localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
        } else {
            window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }

        try {
            const result = await dispatch(
                login({ email: values.email.trim(), password: values.password }),
            ).unwrap();
            setIsRedirecting(true);
            toast.success("Signed in successfully");
            const next = searchParams.get("next");
            const destination =
                next && next.startsWith("/") ? next : portalHomeForRole(result.user.role);
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

    async function handleResendVerification() {
        if (!unverifiedEmail) return;
        setIsResending(true);
        try {
            const res = await authApi.resendVerification(unverifiedEmail);
            toast.success(
                res.message ||
                    "If that email is registered and unverified, a verification link has been sent.",
            );
        } catch (err: unknown) {
            toast.error(err instanceof ApiError ? err.message : "Could not resend verification");
        } finally {
            setIsResending(false);
        }
    }

    const isBusy = isSubmitting || isRedirecting;

    if (isBusy) {
        return (
            <AuthFormFrame>
                <AuthBusyState
                    title={isRedirecting ? "Signed in" : "Signing in"}
                    description={
                        isRedirecting
                            ? "Taking you to your dashboard."
                            : "Checking your email and password."
                    }
                />
            </AuthFormFrame>
        );
    }

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
                                    startIcon={Mail}
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
                                        startIcon={Lock}
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
                        loading={isSubmitting}
                    >
                        {isSubmitting ? "Signing in" : "Sign in"}
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
