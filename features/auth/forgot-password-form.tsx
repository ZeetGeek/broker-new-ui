"use client";

import * as React from "react";

import { Mail01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthBackLink, AuthFormFrame } from "./auth-back-link";
import { AuthHeading } from "./auth-heading";
import { AuthSuccessCheck } from "./auth-success-check";

const RESEND_WAIT_SEC = 30;

type Step = "request" | "sent";

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

export function ForgotPasswordForm() {
    const [email, setEmail] = React.useState("");
    const [step, setStep] = React.useState<Step>("request");
    const [isSending, setIsSending] = React.useState(false);
    const [secondsLeft, setSecondsLeft] = React.useState(0);
    const slideRef = React.useRef<HTMLDivElement>(null);
    const pageId = step === "request" ? "1" : "2";

    React.useEffect(() => {
        if (secondsLeft <= 0) {
            return;
        }
        const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [secondsLeft]);

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
    }, [pageId, email, isSending, secondsLeft]);

    async function sendReset() {
        setIsSending(true);
        await new Promise((resolve) => window.setTimeout(resolve, 720));
        setIsSending(false);
        setStep("sent");
        setSecondsLeft(RESEND_WAIT_SEC);
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        void sendReset();
    }

    function handleUseDifferentEmail() {
        setStep("request");
        setSecondsLeft(0);
    }

    return (
        <AuthFormFrame>
            <AuthBackLink href="/login">Back to sign in</AuthBackLink>

            <div className="mx-auto flex flex-col gap-6 inline-full max-inline-96">
                <div
                    ref={slideRef}
                    className="t-page-slide"
                    data-page={pageId}
                >
                    <section className="t-page flex flex-col gap-6" data-page-id="1">
                        <AuthHeading
                            title="Reset password"
                            description="Enter the email on the account. A reset link is sent to that address."
                        />

                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="forgot-password-email"
                                    className="body font-medium text-ink"
                                >
                                    Email{" "}
                                    <span className="text-brand" aria-hidden="true">
                                        *
                                    </span>
                                </label>
                                <Input
                                    id="forgot-password-email"
                                    size="lg"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    startIcon={Mail01Icon}
                                    value={email}
                                    onValueChange={(value) => setEmail(value)}
                                />
                                <p className="body-sm text-ink-muted">
                                    The email used at sign up.
                                </p>
                            </div>

                            <Button
                                size="lg"
                                variant="accent"
                                type="submit"
                                loading={isSending}
                                className="inline-full"
                            >
                                Send reset link
                            </Button>
                        </form>
                    </section>

                    <section
                        className="t-page flex flex-col items-center gap-6 text-center"
                        data-page-id="2"
                        role="status"
                        aria-live="polite"
                    >
                        {step === "sent" ? <AuthSuccessCheck /> : null}

                        <div className="flex flex-col gap-2">
                            <h1 className="h1 text-ink">Check your email</h1>
                            <p className="body text-ink-muted">
                                If an account exists for{" "}
                                <span className="font-medium text-ink">{email}</span>, a reset
                                link is on its way. Look in spam if it is not in the inbox.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 inline-full">
                            <Button
                                size="lg"
                                variant="outline"
                                type="button"
                                loading={isSending}
                                disabled={secondsLeft > 0}
                                onClick={() => void sendReset()}
                                className="border-border-warm bg-surface inline-full"
                            >
                                {secondsLeft > 0
                                    ? `Resend in ${secondsLeft}s`
                                    : "Resend link"}
                            </Button>
                            <Button
                                size="lg"
                                variant="ghost"
                                type="button"
                                onClick={handleUseDifferentEmail}
                                className="inline-full"
                            >
                                Use a different email
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </AuthFormFrame>
    );
}
