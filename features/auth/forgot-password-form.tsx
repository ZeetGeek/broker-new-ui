"use client";

import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";

import {
    forgotPasswordSchema,
    type ForgotPasswordValues,
} from "@/lib/validation/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthFormFrame } from "./auth-back-link";
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
    const [step, setStep] = React.useState<Step>("request");
    const [isSending, setIsSending] = React.useState(false);
    const [secondsLeft, setSecondsLeft] = React.useState(0);
    const [sentEmail, setSentEmail] = React.useState("");
    const slideRef = React.useRef<HTMLDivElement>(null);
    const pageId = step === "request" ? "1" : "2";

    const {
        control,
        handleSubmit,
        getValues,
        formState: { isSubmitting, errors },
    } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: "onTouched",
        reValidateMode: "onChange",
        defaultValues: {
            email: "",
        },
    });

    const emailValue = useWatch({ control, name: "email" }) ?? "";

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
    }, [pageId, emailValue, isSending, secondsLeft, sentEmail, errors]);

    async function sendReset(email: string) {
        setIsSending(true);
        await new Promise((resolve) => window.setTimeout(resolve, 720));
        setSentEmail(email);
        setIsSending(false);
        setStep("sent");
        setSecondsLeft(RESEND_WAIT_SEC);
    }

    function onSubmit(values: ForgotPasswordValues) {
        void sendReset(values.email);
    }

    function handleUseDifferentEmail() {
        setStep("request");
        setSecondsLeft(0);
    }

    function handleResend() {
        const email = sentEmail || getValues("email");
        if (!email) {
            return;
        }
        void sendReset(email);
    }

    return (
        <AuthFormFrame>
            <div className="mx-auto flex flex-col gap-6 inline-full max-inline-96">
                <div ref={slideRef} className="t-page-slide" data-page={pageId}>
                    <section className="t-page flex flex-col gap-6" data-page-id="1">
                        <AuthHeading
                            title="Reset password"
                            description="Enter the email on the account. A reset link is sent to that address."
                        />

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
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            startIcon={Mail}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            errorText={fieldState.error?.message}
                                            helperText={
                                                fieldState.error
                                                    ? undefined
                                                    : "The email used at sign up."
                                            }
                                            success={
                                                fieldState.isTouched &&
                                                !fieldState.invalid &&
                                                field.value.length > 0
                                            }
                                        />
                                    </div>
                                )}
                            />

                            <Button
                                size="lg"
                                variant="accent"
                                type="submit"
                                loading={isSending || isSubmitting}
                                className="inline-full"
                            >
                                Send reset link
                            </Button>
                        </form>

                        <p className="body text-center text-ink-muted">
                            Remember your password?{" "}
                            <Link
                                href="/login"
                                className="body font-medium text-brand underline underline-offset-4"
                            >
                                Log in
                            </Link>
                        </p>
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
                                <span className="font-medium text-ink">{sentEmail}</span>, a
                                reset link is on its way. Look in spam if it is not in the inbox.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 inline-full">
                            <Button
                                size="lg"
                                variant="outline"
                                type="button"
                                loading={isSending}
                                disabled={secondsLeft > 0}
                                onClick={handleResend}
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
