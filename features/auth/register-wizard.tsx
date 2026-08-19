"use client";

import * as React from "react";
import Link from "next/link";

import { Mail01Icon, SquareLock02Icon } from "@hugeicons/core-free-icons";
import { addCollection, Icon } from "@iconify/react/offline";

import { cn } from "@/lib/utils";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import brands from "./thesvg-color-brands.json";

addCollection(brands as Parameters<typeof addCollection>[0]);

type Portal = "owner" | "broker";

const PORTAL_OPTIONS: { value: Portal; label: string }[] = [
    { value: "owner", label: "As an owner" },
    { value: "broker", label: "As a broker" },
];

const PILL_FIELD = "rounded-control!";

function BrandIcon({ icon }: { icon: "thesvg-color:google" | "thesvg-color:apple-light" }) {
    return (
        <Icon icon={icon} width={20} height={20} className="block-5 inline-5" aria-hidden="true" />
    );
}

function PortalPicker({ value, onChange }: { value: Portal; onChange: (portal: Portal) => void }) {
    return (
        <div
            role="radiogroup"
            aria-label="Sign up as"
            className="flex items-center justify-center gap-8"
        >
            {PORTAL_OPTIONS.map((option) => {
                const selected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(option.value)}
                        className="flex items-center gap-2 py-3"
                    >
                        <span
                            className={cn(
                                `
                                  flex items-center justify-center rounded-full border-2 block-5
                                  inline-5
                                `,
                                selected ? "border-brand bg-brand" : "border-ink-subtle bg-surface",
                            )}
                        >
                            {selected ? (
                                <span className="rounded-full bg-surface block-2 inline-2" />
                            ) : null}
                        </span>
                        <span className="body font-medium text-ink">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

function SocialButton({ children, mark }: { children: React.ReactNode; mark: React.ReactNode }) {
    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
            className="
              gap-3 border-border-warm bg-surface font-medium text-ink shadow-sm block-control-xl
              inline-full
              hover:bg-surface-muted
            "
        >
            {mark}
            {children}
        </Button>
    );
}

export function RegisterWizard({ initialPortal = "owner" }: { initialPortal?: Portal }) {
    const [portal, setPortal] = React.useState<Portal>(initialPortal);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    return (
        <div className="mx-auto flex flex-col gap-6 inline-full max-inline-96">
            <div className="flex flex-col items-center gap-6 text-center">
                <Logo />

                <div className="flex flex-col gap-2">
                    <h1 className="h1 text-ink">Sign up</h1>
                    <p className="body text-ink-muted">Enter your details to continue.</p>
                </div>

                <PortalPicker value={portal} onChange={setPortal} />
            </div>

            <div className="flex flex-col gap-3">
                <SocialButton mark={<BrandIcon icon="thesvg-color:google" />}>
                    Sign up with Google
                </SocialButton>
                <SocialButton mark={<BrandIcon icon="thesvg-color:apple-light" />}>
                    Sign up with Apple
                </SocialButton>
            </div>

            <div className="flex items-center gap-4">
                <span className="grow bg-border-warm block-px" />
                <span className="body-sm text-ink-subtle">OR</span>
                <span className="grow bg-border-warm block-px" />
            </div>

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

            <p className="body-sm text-center text-ink-muted">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-brand underline">
                    Log in
                </Link>
            </p>
        </div>
    );
}
