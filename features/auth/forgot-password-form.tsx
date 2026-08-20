"use client";

import * as React from "react";

import {
    CheckmarkCircle02Icon,
    Mail01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";

import { duration, ease, spring } from "@/lib/motion/tokens";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthBackLink, AuthFormFrame } from "./auth-back-link";

const RESEND_WAIT_SEC = 30;

const pane = {
    initial: { opacity: 0, y: 8 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: duration.base, ease: ease.out },
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: { duration: duration.fast, ease: ease.in },
    },
};

type Step = "request" | "sent";

export function ForgotPasswordForm() {
    const [email, setEmail] = React.useState("");
    const [step, setStep] = React.useState<Step>("request");
    const [isSending, setIsSending] = React.useState(false);
    const [secondsLeft, setSecondsLeft] = React.useState(0);

    React.useEffect(() => {
        if (secondsLeft <= 0) {
            return;
        }
        const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [secondsLeft]);

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
            <AnimatePresence mode="wait">
                {step === "request" ? (
                    <motion.div
                        key="request"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pane}
                        className="flex flex-col gap-6"
                    >
                        <div className="flex flex-col gap-2 text-center">
                            <h1 className="h1 text-ink">Reset password</h1>
                            <p className="body text-ink-muted">
                                Enter the email on the account. A reset link is sent to that
                                address.
                            </p>
                        </div>

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
                    </motion.div>
                ) : (
                    <motion.div
                        key="sent"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pane}
                        className="flex flex-col items-center gap-6 text-center"
                        role="status"
                        aria-live="polite"
                    >
                        <motion.span
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={spring.snappy}
                            className="
                              flex items-center justify-center rounded-full bg-brand-soft
                              text-brand-text block-16 inline-16
                            "
                        >
                            <HugeiconsIcon
                                icon={CheckmarkCircle02Icon}
                                className="block-8 inline-8"
                            />
                        </motion.span>

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
                    </motion.div>
                )}
            </AnimatePresence>
            </div>
        </AuthFormFrame>
    );
}
