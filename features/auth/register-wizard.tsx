"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { Mail01Icon, SquareLock02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthBackLink, AuthFormFrame } from "./auth-back-link";
import { AuthHeading } from "./auth-heading";
import { OrDivider } from "./or-divider";
import { type Portal, PORTAL_OPTIONS } from "./portal";
import { PortalPicker } from "./portal-picker";
import { SocialAuthButtons } from "./social-auth-buttons";

type Step = "role" | "account";

function syncSlideHeight(slide: HTMLElement, pageId: "1" | "2") {
    const active = slide.querySelector<HTMLElement>(`.t-page[data-page-id="${pageId}"]`);
    if (!active) {
        return;
    }
    const previousPosition = active.style.position;
    const previousInset = active.style.inset;
    const previousHeight = active.style.height;
    slide.style.height = "auto";
    active.style.position = "relative";
    active.style.inset = "auto";
    active.style.height = "auto";
    slide.style.height = `${active.offsetHeight}px`;
    active.style.position = previousPosition;
    active.style.inset = previousInset;
    active.style.height = previousHeight;
}

function RegisterLoginHint() {
    return (
        <p className="body text-center text-ink-muted">
            Already have an account?{" "}
            <Link
                href="/login"
                className="body font-medium text-brand underline underline-offset-4"
            >
                Log in
            </Link>
        </p>
    );
}

export function RegisterWizard({ initialPortal = "owner" }: { initialPortal?: Portal }) {
    const [portal, setPortal] = React.useState<Portal>(initialPortal);
    const [step, setStep] = React.useState<Step>("role");
    const slideRef = React.useRef<HTMLDivElement>(null);
    const pageId = step === "role" ? "1" : "2";
    const selected = PORTAL_OPTIONS.find((option) => option.value === portal) ?? PORTAL_OPTIONS[0];

    React.useLayoutEffect(() => {
        const slide = slideRef.current;
        if (!slide) {
            return;
        }
        if (slide.dataset.exitsReady !== "true") {
            slide.style.setProperty("--page-exit-enabled", "0");
        }
        syncSlideHeight(slide, pageId);
        if (slide.dataset.exitsReady !== "true") {
            void slide.offsetWidth;
            slide.style.setProperty("--page-exit-enabled", "1");
            slide.dataset.exitsReady = "true";
        }
    }, [pageId, portal]);

    function goToAccount() {
        setStep("account");
    }

    function goToRole() {
        setStep("role");
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    return (
        <AuthFormFrame>
            {step === "role" ? (
                <AuthBackLink href="/">Back to home</AuthBackLink>
            ) : (
                <AuthBackLink onClick={goToRole}>Back</AuthBackLink>
            )}

            <div className="mx-auto flex flex-col gap-8 inline-full max-inline-140">
                <div ref={slideRef} className="t-page-slide" data-page={pageId}>
                    <section className="t-page flex flex-col gap-8" data-page-id="1">
                        <div className="mx-auto inline-full max-inline-96">
                            <AuthHeading
                                title="Pick a role"
                                description="This account is for one role. Choose owner or broker."
                            />
                        </div>

                        <PortalPicker value={portal} onChange={setPortal} ariaLabel="Sign up as" />

                        <div className="mx-auto flex flex-col gap-6 inline-full max-inline-96">
                            <Button
                                size="lg"
                                variant="accent"
                                type="button"
                                className="inline-full"
                                onClick={goToAccount}
                            >
                                Continue
                            </Button>
                            <RegisterLoginHint />
                        </div>
                    </section>

                    <section
                        className="t-page mx-auto flex flex-col gap-6 inline-full max-inline-100"
                        data-page-id="2"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <button
                                type="button"
                                onClick={goToRole}
                                aria-label={`Signed up as ${selected.label}. Change role`}
                                className="
                                  rounded-full focus-visible:ring-3 focus-visible:ring-ring/30
                                  focus-visible:outline-none
                                "
                            >
                                <Image
                                    src={selected.avatarSrc}
                                    alt=""
                                    width={120}
                                    height={120}
                                    unoptimized
                                    draggable={false}
                                    className="pointer-events-none rounded-full block-30 inline-30"
                                />
                            </button>
                            <AuthHeading
                                title="Sign up"
                                description="Enter your details to continue."
                            />
                        </div>

                        <SocialAuthButtons action="Sign up" />

                        <OrDivider />

                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            <input type="hidden" name="portal" value={portal} />
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="register-email"
                                    className="body font-medium text-ink"
                                >
                                    Email{" "}
                                    <span className="text-brand" aria-hidden="true">
                                        *
                                    </span>
                                </label>
                                <Input
                                    id="register-email"
                                    name="email"
                                    size="lg"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    startIcon={Mail01Icon}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="register-password"
                                    className="body font-medium text-ink"
                                >
                                    Password{" "}
                                    <span className="text-brand" aria-hidden="true">
                                        *
                                    </span>
                                </label>
                                <Input
                                    id="register-password"
                                    name="password"
                                    size="lg"
                                    type="password"
                                    required
                                    autoComplete="new-password"
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
                                Sign up
                            </Button>
                        </form>

                        <RegisterLoginHint />
                    </section>
                </div>
            </div>
        </AuthFormFrame>
    );
}
