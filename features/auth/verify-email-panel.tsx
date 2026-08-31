"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

import { Button } from "@/components/ui/button";

import { AuthFormFrame } from "./auth-back-link";
import { AuthBusyState } from "./auth-busy-state";
import { AuthHeading } from "./auth-heading";
import { AuthSuccessCheck } from "./auth-success-check";

type Status = "loading" | "success" | "error";

export function VerifyEmailPanel() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token")?.trim() ?? "";
    const [status, setStatus] = React.useState<Status>(token ? "loading" : "error");
    const [message, setMessage] = React.useState(
        token ? "Verifying your email." : "This verification link is missing or incomplete.",
    );

    React.useEffect(() => {
        if (!token) return;
        let cancelled = false;

        void (async () => {
            try {
                const res = await authApi.verifyEmail(token);
                if (cancelled) return;
                setStatus("success");
                setMessage(res.message || "Email verified successfully");
            } catch (err: unknown) {
                if (cancelled) return;
                setStatus("error");
                setMessage(
                    err instanceof ApiError
                        ? err.message
                        : "Could not verify email. The link may have expired.",
                );
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    React.useEffect(() => {
        if (status !== "success") return;
        const timer = window.setTimeout(() => router.replace("/login"), 1800);
        return () => window.clearTimeout(timer);
    }, [status, router]);

    if (status === "loading") {
        return (
            <AuthFormFrame>
                <AuthBusyState title="Verifying your email" description={message} />
            </AuthFormFrame>
        );
    }

    return (
        <AuthFormFrame>
            <div
                className="
                  mx-auto flex flex-col items-center gap-6 text-center inline-full max-inline-96
                "
            >
                {status === "success" ? <AuthSuccessCheck /> : null}
                <AuthHeading
                    title={status === "success" ? "Email verified" : "Verification failed"}
                    description={message}
                />
                <Button
                    size="lg"
                    variant="accent"
                    nativeButton={false}
                    render={<Link href="/login" />}
                    className="inline-full"
                >
                    Continue to sign in
                </Button>
            </div>
        </AuthFormFrame>
    );
}
