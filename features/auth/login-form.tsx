"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";

import { loginSchema,type LoginValues } from "@/lib/validation/auth";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import { AuthFormFrame } from "./auth-back-link";
import { AuthHeading } from "./auth-heading";
import { OrDivider } from "./or-divider";
import { SocialAuthButtons } from "./social-auth-buttons";

const REMEMBERED_EMAIL_KEY = "remembered-login-email";

export function LoginForm() {
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

    function onSubmit(values: LoginValues) {
        if (values.rememberMe) {
            window.localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
        } else {
            window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
    }

    return (
        <AuthFormFrame>
            <div className="mx-auto flex flex-col gap-6 inline-full max-inline-96">
                <AuthHeading
                    title="Sign in"
                    description="Welcome back. Enter your details to continue."
                />

                <SocialAuthButtons action="Sign in" />

                <OrDivider />

                <form
                    className="flex flex-col gap-5"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="login-email"
                                    className="body font-medium text-ink"
                                >
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

                    <Button
                        size="lg"
                        variant="accent"
                        type="submit"
                        className="inline-full"
                        loading={isSubmitting}
                    >
                        Sign in
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
