"use client";

import * as React from "react";
import Link from "next/link";

import { Mail01Icon, SquareLock02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthBackLink, AuthFormFrame } from "./auth-back-link";
import { OrDivider } from "./or-divider";
import { SocialAuthButtons } from "./social-auth-buttons";

export function LoginForm() {
    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    return (
        <AuthFormFrame>
            <AuthBackLink href="/">Back to home</AuthBackLink>
            <div className="mx-auto flex flex-col gap-6 inline-full max-inline-96">
                <div className="flex flex-col gap-2 text-center">
                    <h1 className="h1 text-ink">Sign in</h1>
                    <p className="body text-ink-muted">
                        Welcome back. Enter your details to continue.
                    </p>
                </div>

                <SocialAuthButtons action="Sign in" />

                <OrDivider />

                <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
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
                            required
                            autoComplete="email"
                            placeholder="you@example.com"
                            startIcon={Mail01Icon}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                            <label htmlFor="login-password" className="body font-medium text-ink">
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
                            required
                            autoComplete="current-password"
                            placeholder="Enter password"
                            startIcon={SquareLock02Icon}
                        />
                    </div>

                    <Button
                        size="lg"
                        variant="accent"
                        type="submit"
                        className="inline-full"
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
