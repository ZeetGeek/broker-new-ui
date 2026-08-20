"use client";

import * as React from "react";
import Link from "next/link";

import { Mail01Icon, SquareLock02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthBackLink, AuthFormFrame } from "./auth-back-link";
import { OrDivider } from "./or-divider";
import { type Portal } from "./portal";
import { PortalPicker } from "./portal-picker";
import { SocialAuthButtons } from "./social-auth-buttons";

const PILL_FIELD = "rounded-control!";

export function RegisterWizard({ initialPortal = "owner" }: { initialPortal?: Portal }) {
    const [portal, setPortal] = React.useState<Portal>(initialPortal);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    return (
        <AuthFormFrame>
            <AuthBackLink href="/">Back to home</AuthBackLink>
            <div className="mx-auto flex flex-col gap-6 inline-full max-inline-96">
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="flex flex-col gap-2">
                    <h1 className="h1 text-ink">Sign up</h1>
                    <p className="body text-ink-muted">Enter your details to continue.</p>
                </div>

                <PortalPicker value={portal} onChange={setPortal} ariaLabel="Sign up as" />
            </div>

            <SocialAuthButtons action="Sign up" />

            <OrDivider />

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <input type="hidden" name="portal" value={portal} />
                <div className="flex flex-col gap-2">
                    <label htmlFor="register-email" className="body font-medium text-ink">
                        Email{" "}
                        <span className="text-brand" aria-hidden="true">
                            *
                        </span>
                    </label>
                    <Input
                        id="register-email"
                        size="lg"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        startIcon={Mail01Icon}
                        className={PILL_FIELD}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="register-password" className="body font-medium text-ink">
                        Password{" "}
                        <span className="text-brand" aria-hidden="true">
                            *
                        </span>
                    </label>
                    <Input
                        id="register-password"
                        size="lg"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Enter password"
                        startIcon={SquareLock02Icon}
                        className={PILL_FIELD}
                    />
                </div>

                <Button
                    size="lg"
                    variant="accent"
                    type="submit"
                    className="block-control-xl inline-full"
                >
                    Sign up
                </Button>
            </form>

            <p className="body text-center text-ink-muted">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="body font-medium text-brand underline underline-offset-4"
                >
                    Log in
                </Link>
            </p>
            </div>
        </AuthFormFrame>
    );
}
