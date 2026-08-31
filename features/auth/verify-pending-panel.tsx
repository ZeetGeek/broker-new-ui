"use client";

import * as React from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

import { Button } from "@/components/ui/button";

import { AuthFormFrame } from "./auth-back-link";
import { AuthHeading } from "./auth-heading";
import { AuthSuccessCheck } from "./auth-success-check";

export function VerifyPendingPanel() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email")?.trim() ?? "";
    const [isSending, setIsSending] = React.useState(false);
    const [secondsLeft, setSecondsLeft] = React.useState(0);

    React.useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [secondsLeft]);

    async function handleResend() {
        if (!email) {
            toast.error("Missing email address");
            return;
        }
        setIsSending(true);
        try {
            const res = await authApi.resendVerification(email);
            toast.success(
                res.message ||
                    "If that email is registered and unverified, a verification link has been sent.",
            );
            setSecondsLeft(30);
        } catch (err: unknown) {
            toast.error(err instanceof ApiError ? err.message : "Could not resend verification");
        } finally {
            setIsSending(false);
        }
    }

    return (
        <AuthFormFrame>
            <div
                className="
                  mx-auto flex flex-col items-center gap-6 text-center inline-full max-inline-96
                "
            >
                <AuthSuccessCheck />
                <AuthHeading
                    title="Check your email"
                    description={
                        email
                            ? `We sent a verification link to ${email}. Open it to activate your account.`
                            : "We sent a verification link to your email. Open it to activate your account."
                    }
                />
                <div className="flex flex-col gap-3 inline-full">
                    <Button
                        size="lg"
                        variant="outline"
                        type="button"
                        loading={isSending}
                        disabled={!email || secondsLeft > 0}
                        onClick={() => void handleResend()}
                        className="border-border-warm bg-surface inline-full"
                    >
                        {isSending
                            ? "Sending"
                            : secondsLeft > 0
                              ? `Resend in ${secondsLeft}s`
                              : "Resend verification email"}
                    </Button>
                    <Button
                        size="lg"
                        variant="ghost"
                        nativeButton={false}
                        render={<Link href="/login" />}
                        className="inline-full"
                    >
                        Back to sign in
                    </Button>
                </div>
            </div>
        </AuthFormFrame>
    );
}
