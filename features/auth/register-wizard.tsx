"use client";

import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Circle, Gift, Lock, Mail } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { generatePassword } from "@/lib/auth/generate-password";
import { duration, ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { PASSWORD_REQUIREMENTS, registerSchema, type RegisterValues } from "@/lib/validation/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthFormFrame } from "./auth-back-link";
import { AuthBusyState } from "./auth-busy-state";
import { AuthHeading } from "./auth-heading";
import { OrDivider } from "./or-divider";
import { type Portal, PORTAL_OPTIONS } from "./portal";
import { PortalPicker } from "./portal-picker";
import { SocialAuthButtons } from "./social-auth-buttons";

type Step = "role" | "account";

function normalizeReferralCode(value: string): string {
    return value.trim().toUpperCase();
}

function syncSlideHeight(slide: HTMLElement, pageId: "1" | "2") {
    const active = slide.querySelector<HTMLElement>(`.t-page[data-page-id="${pageId}"]`);
    if (!active) {
        return;
    }
    // Absolute pages don't contribute to parent height — measure with a
    // temporary relative layout so a remount (or an inline error) never
    // leaves the slide at 0px / blank.
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

function PasswordRequirements({ password }: { password: string }) {
    const visible = password.length > 0;

    return (
        <AnimatePresence initial={false}>
            {visible ? (
                <motion.ul
                    key="password-requirements"
                    aria-label="Password requirements"
                    className="flex flex-col gap-1.5 overflow-hidden"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: duration.base, ease: ease.inOut }}
                >
                    {PASSWORD_REQUIREMENTS.map((requirement) => {
                        const met = requirement.test(password);
                        const RequirementIcon = met ? CheckCircle2 : Circle;
                        return (
                            <li
                                key={requirement.id}
                                className={cn(
                                    "body flex items-center gap-2",
                                    met ? "text-success" : "text-ink-muted",
                                )}
                                aria-label={`${met ? "Met" : "Needed"}: ${requirement.label}`}
                            >
                                <RequirementIcon
                                    className="shrink-0 block-4 inline-4"
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />
                                <span aria-hidden="true">{requirement.label}</span>
                            </li>
                        );
                    })}
                </motion.ul>
            ) : null}
        </AnimatePresence>
    );
}

export function RegisterWizard({
    initialPortal = "owner",
    initialReferralCode = "",
}: {
    initialPortal?: Portal;
    /** From `/register?ref=CODE` — same as the old frontend invite links. */
    initialReferralCode?: string;
}) {
    const router = useRouter();
    const [portal, setPortal] = React.useState<Portal>(initialPortal);
    const [step, setStep] = React.useState<Step>("role");
    const [isRedirecting, setIsRedirecting] = React.useState(false);
    const [referralCode, setReferralCode] = React.useState(() =>
        normalizeReferralCode(initialReferralCode),
    );
    const slideRef = React.useRef<HTMLDivElement>(null);
    const pageId = step === "role" ? "1" : "2";
    const selected = PORTAL_OPTIONS.find((option) => option.value === portal) ?? PORTAL_OPTIONS[0];
    const resolvedReferralCode = normalizeReferralCode(referralCode);

    const {
        control,
        handleSubmit,
        setValue,
        setError,
        clearErrors,
        formState: { isSubmitting, errors },
    } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        mode: "onTouched",
        reValidateMode: "onChange",
        defaultValues: {
            portal: initialPortal,
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const password = useWatch({ control, name: "password" }) ?? "";
    const submitError = errors.root?.message;

    React.useEffect(() => {
        setValue("portal", portal);
    }, [portal, setValue]);

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

        const active = slide.querySelector<HTMLElement>(`.t-page[data-page-id="${pageId}"]`);
        if (!active || typeof ResizeObserver === "undefined") {
            return;
        }
        const observer = new ResizeObserver(() => {
            syncSlideHeight(slide, pageId);
        });
        observer.observe(active);
        return () => observer.disconnect();
    }, [pageId, portal, password, errors, isSubmitting, submitError]);

    function goToAccount() {
        setStep("account");
    }

    function goToRole() {
        setStep("role");
    }

    function handleGeneratePassword() {
        const nextPassword = generatePassword();
        setValue("password", nextPassword, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
        setValue("confirmPassword", nextPassword, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    }

    async function onSubmit(values: RegisterValues) {
        clearErrors("root");

        try {
            await authApi.register({
                email: values.email.trim(),
                password: values.password,
                role: values.portal,
                ...(resolvedReferralCode ? { referralCode: resolvedReferralCode } : {}),
            });
            toast.success("Account created. Check your email to verify.");
            setIsRedirecting(true);
            router.push(`/verify-pending?email=${encodeURIComponent(values.email.trim())}`);
        } catch (err: unknown) {
            // Keep the form mounted — swapping it for a busy screen unmounts
            // the absolute page slide and comes back blank after a 409.
            if (err instanceof ApiError && err.status === 409) {
                setError("email", {
                    type: "server",
                    message: "This email already has an account. Log in instead.",
                });
                return;
            }

            setError("root", {
                type: "server",
                message:
                    err instanceof ApiError
                        ? err.message
                        : "Could not create your account. Try again.",
            });
        }
    }

    // Only leave the form after a real success. Errors must stay on the form
    // (docs/MESSAGES.md — never toast an error the user must act on).
    if (isRedirecting) {
        return (
            <AuthFormFrame>
                <AuthBusyState
                    title="Account created"
                    description="Taking you to verify your email."
                />
            </AuthFormFrame>
        );
    }

    return (
        <AuthFormFrame>
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
                                  rounded-full
                                  focus-visible:ring-3 focus-visible:ring-ring/30
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

                        <SocialAuthButtons
                            action="Sign up"
                            role={portal}
                            referralCode={resolvedReferralCode || undefined}
                        />

                        <OrDivider />

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
                                            size="lg"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            startIcon={Mail}
                                            value={field.value}
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                if (fieldState.error?.type === "server") {
                                                    clearErrors("email");
                                                }
                                            }}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            errorText={fieldState.error?.message}
                                            success={
                                                fieldState.isTouched &&
                                                !fieldState.invalid &&
                                                field.value.length > 0
                                            }
                                        />
                                    </div>
                                )}
                            />

                            <Controller
                                name="password"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <label
                                                htmlFor="register-password"
                                                className="body font-medium text-ink"
                                            >
                                                Password{" "}
                                                <span className="text-brand" aria-hidden="true">
                                                    *
                                                </span>
                                            </label>
                                            <Button
                                                type="button"
                                                variant="link"
                                                onClick={handleGeneratePassword}
                                                className="
                                                  body-sm px-0 font-medium text-brand block-auto
                                                "
                                            >
                                                Generate password
                                            </Button>
                                        </div>
                                        <Input
                                            id="register-password"
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
                                        <PasswordRequirements password={field.value} />
                                    </div>
                                )}
                            />

                            <Controller
                                name="confirmPassword"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <div className="flex flex-col gap-2">
                                        <label
                                            htmlFor="register-confirm-password"
                                            className="body font-medium text-ink"
                                        >
                                            Confirm password{" "}
                                            <span className="text-brand" aria-hidden="true">
                                                *
                                            </span>
                                        </label>
                                        <Input
                                            id="register-confirm-password"
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
                                            success={
                                                fieldState.isTouched &&
                                                !fieldState.invalid &&
                                                field.value.length > 0
                                            }
                                        />
                                    </div>
                                )}
                            />

                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="register-referral-code"
                                    className="body font-medium text-ink"
                                >
                                    Referral code{" "}
                                    <span className="font-normal text-ink-subtle">(optional)</span>
                                </label>
                                <Input
                                    id="register-referral-code"
                                    size="lg"
                                    type="text"
                                    autoComplete="off"
                                    placeholder="e.g. YB-NIVEDITA"
                                    startIcon={Gift}
                                    value={referralCode}
                                    onValueChange={(value) =>
                                        setReferralCode(normalizeReferralCode(value))
                                    }
                                    maxLength={40}
                                />
                                {initialReferralCode ? (
                                    <p className="body-xs text-ink-subtle">
                                        Filled from your invite link. You can change it if needed.
                                    </p>
                                ) : null}
                            </div>

                            {submitError ? (
                                <p role="alert" className="body-sm text-danger">
                                    {submitError}
                                </p>
                            ) : null}

                            <Button
                                size="lg"
                                variant="accent"
                                type="submit"
                                className="inline-full"
                                loading={isSubmitting}
                            >
                                {isSubmitting ? "Creating account" : "Sign up"}
                            </Button>
                        </form>

                        <RegisterLoginHint />
                    </section>
                </div>
            </div>
        </AuthFormFrame>
    );
}
