"use client";

import * as React from "react";

import {
    Call02Icon,
    CheckmarkCircle02Icon,
    Mail01Icon,
    SquareLock02Icon,
    User03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Portal = "owner" | "broker";

const PORTAL_OPTIONS: {
    value: Portal;
    label: string;
    description: string;
}[] = [
    { value: "owner", label: "I'm an owner", description: "List a property to sell or rent" },
    { value: "broker", label: "I'm a broker", description: "Find buyers and tenants" },
];

function PortalPicker({
    value,
    onChange,
}: {
    value: Portal | null;
    onChange: (portal: Portal) => void;
}) {
    return (
        <div role="radiogroup" aria-label="Account type" className="grid grid-cols-2 gap-3">
            {PORTAL_OPTIONS.map((option) => {
                const selected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(option.value)}
                        className={`
                          rounded-inner border-2 p-4 text-start transition-colors duration-160
                          ${
                              selected
                                  ? "border-brand-ink bg-brand-soft"
                                  : "border-border-warm bg-surface hover:border-ink-subtle"
                          }
                        `}
                    >
                        <span className="flex items-center justify-between">
                            <span className="h6 text-ink">{option.label}</span>
                            {selected ? (
                                <HugeiconsIcon
                                    icon={CheckmarkCircle02Icon}
                                    className="block-4.5 inline-4.5 text-brand"
                                />
                            ) : null}
                        </span>
                        <span className="body-sm mt-1 block text-ink-muted">
                            {option.description}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

export function RegisterWizard() {
    const [portal, setPortal] = React.useState<Portal | null>(null);

    return (
        <div className="flex items-center justify-center px-4 py-10 block-full sm:px-8">
            <div className="mx-auto flex flex-col gap-8 inline-full max-inline-105">
                <Logo />

                <div className="flex flex-col gap-1.5">
                    <h1 className="h2 text-ink">Create your account.</h1>
                    <p className="body text-ink-muted">Free to join. Takes about two minutes.</p>
                </div>

                <form className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <span className="eyebrow">Account type</span>
                        <PortalPicker value={portal} onChange={setPortal} />
                    </div>

                    <Input
                        size="lg"
                        type="text"
                        placeholder="Full name"
                        startIcon={User03Icon}
                        autoComplete="name"
                    />
                    <Input
                        size="lg"
                        type="tel"
                        placeholder="+91 98765 43210"
                        startIcon={Call02Icon}
                        autoComplete="tel"
                    />
                    <Input
                        size="lg"
                        type="email"
                        placeholder="you@example.com"
                        startIcon={Mail01Icon}
                        autoComplete="email"
                    />
                    <Input
                        size="lg"
                        type="password"
                        placeholder="Create a password"
                        startIcon={SquareLock02Icon}
                        autoComplete="new-password"
                    />

                    <Button size="lg" variant="default" type="submit" disabled={!portal}>
                        Create account
                    </Button>
                </form>

                <p className="body-sm text-center text-ink-muted">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-brand hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
