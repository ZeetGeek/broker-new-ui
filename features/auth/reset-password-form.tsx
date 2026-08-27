"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validation/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthFormFrame } from "./auth-back-link";
import { AuthHeading } from "./auth-heading";

export function ResetPasswordForm({ token }: { token: string }) {
    const router = useRouter();
    const {
        control,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        mode: "onTouched",
        reValidateMode: "onChange",
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values: ResetPasswordValues) {
        try {
            const res = await authApi.resetPassword(token, values.password);
            toast.success(res.message || "Password reset successfully");
            router.replace("/login");
        } catch (err: unknown) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : "Could not reset password. The link may have expired.",
            );
        }
    }

    if (!token) {
        return (
            <AuthFormFrame>
                <div className="mx-auto flex flex-col gap-6 inline-full max-inline-96">
                    <AuthHeading
                        title="Link invalid"
                        description="This reset link is missing or incomplete. Request a new one."
                    />
                    <Button
                        size="lg"
                        variant="accent"
                        nativeButton={false}
                        render={<Link href="/forgot-password" />}
                        className="inline-full"
                    >
                        Request a new link
                    </Button>
                </div>
            </AuthFormFrame>
        );
    }

    return (
        <AuthFormFrame>
            <div className="mx-auto flex flex-col gap-6 inline-full max-inline-96">
                <AuthHeading
                    title="Choose a new password"
                    description="Use a strong password you haven't used on this account before."
                />

                <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Controller
                        name="password"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="reset-password"
                                    className="body font-medium text-ink"
                                >
                                    New password{" "}
                                    <span className="text-brand" aria-hidden="true">
                                        *
                                    </span>
                                </label>
                                <Input
                                    id="reset-password"
                                    size="lg"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Create a password"
                                    startIcon={Lock}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    errorText={fieldState.error?.message}
                                />
                            </div>
                        )}
                    />

                    <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="reset-confirm-password"
                                    className="body font-medium text-ink"
                                >
                                    Confirm password{" "}
                                    <span className="text-brand" aria-hidden="true">
                                        *
                                    </span>
                                </label>
                                <Input
                                    id="reset-confirm-password"
                                    size="lg"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Re-enter password"
                                    startIcon={Lock}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    errorText={fieldState.error?.message}
                                />
                            </div>
                        )}
                    />

                    <Button
                        size="lg"
                        variant="accent"
                        type="submit"
                        className="inline-full"
                        loading={isSubmitting}
                    >
                        Reset password
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
            </div>
        </AuthFormFrame>
    );
}
