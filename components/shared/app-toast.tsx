"use client";

import { useEffect, useState } from "react";
import toast, { Toaster, type ToastOptions } from "react-hot-toast";

import { cn } from "@/lib/utils";

import { GradientSpinner } from "@/components/shared/gradient-spinner";
import { IconButton } from "@/components/shared/icon-button";
import { ToastStatusIcon, X } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import styles from "./app-toast.module.css";

export type AppToastVariant = "success" | "error" | "warning" | "info" | "loading" | "reminder";

export type AppToastContent = {
    variant: AppToastVariant;
    title: string;
    description?: string;
    detail?: string;
    action?: { label: string; onClick: () => void };
};

const ICONS = {
    success: "checkmark-circle-20",
    error: "dismiss-circle-20",
    warning: "warning-20",
    info: "question-circle-20",
    reminder: "alert-badge-20",
} as const;

/** One visual recipe for both inline specimens and react-hot-toast notifications. */
export function AppToast({
    variant,
    title,
    description,
    detail,
    action,
    onDismiss,
    announce = false,
    className,
}: AppToastContent & { onDismiss?: () => void; announce?: boolean; className?: string }) {
    const statusVariant = variant === "loading" ? "success" : variant;

    return (
        <div className={cn(styles.toast, className)} data-variant={variant}>
            <span
                className={cn("t-icon-swap", styles.icon)}
                data-state={variant === "loading" ? "a" : "b"}
                aria-hidden="true"
            >
                <span className="t-icon" data-icon="a">
                    <GradientSpinner active={variant === "loading"} className={styles.spinner} />
                </span>
                <span className="t-icon" data-icon="b">
                    <ToastStatusIcon name={ICONS[statusVariant]} />
                </span>
            </span>
            <div className={styles.content}>
                <div
                    role={announce ? "status" : undefined}
                    aria-live={announce ? "polite" : undefined}
                    aria-atomic={announce || undefined}
                >
                    <p className={cn("body", styles.title)}>{title}</p>
                    {description && (
                        <p className={cn("body-sm", styles.description)}>{description}</p>
                    )}
                    {detail && <p className={cn("body-xs", styles.detail)}>{detail}</p>}
                </div>
                {action && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={styles.action}
                        onClick={action.onClick}
                    >
                        {action.label}
                    </Button>
                )}
            </div>
            {onDismiss && (
                <IconButton
                    size="sm"
                    appearance="ghost"
                    aria-label={`Dismiss: ${title}`}
                    onClick={onDismiss}
                    className={styles.dismiss}
                >
                    <X aria-hidden="true" />
                </IconButton>
            )}
        </div>
    );
}

function AnimatedToast({
    content,
    id,
    visible,
}: {
    content: AppToastContent;
    id: string;
    visible: boolean;
}) {
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        // Paint the closed state before applying the transition's open hook.
        let secondFrame = 0;
        const firstFrame = requestAnimationFrame(() => {
            secondFrame = requestAnimationFrame(() => setEntered(true));
        });
        return () => {
            cancelAnimationFrame(firstFrame);
            cancelAnimationFrame(secondFrame);
        };
    }, []);

    return (
        <div
            className={cn("t-toast", styles.animated, entered && visible && "is-open")}
            data-open={entered && visible}
            inert={!visible}
        >
            <AppToast
                {...content}
                announce
                action={
                    content.action && {
                        ...content.action,
                        onClick: () => {
                            toast.dismiss(id);
                            content.action?.onClick();
                        },
                    }
                }
                onDismiss={() => toast.dismiss(id)}
            />
        </div>
    );
}

/** Actions and failures stay until dismissed; routine confirmations expire. */
export function showAppToast(
    content: AppToastContent,
    options: ToastOptions & { toasterId: string },
) {
    const duration =
        content.action ||
        content.variant === "loading" ||
        content.variant === "error" ||
        content.variant === "warning"
            ? Infinity
            : content.variant === "reminder"
              ? 12_000
              : 5_000;

    return toast.custom(
        (notification) => (
            <AnimatedToast content={content} id={notification.id} visible={notification.visible} />
        ),
        { duration, removeDelay: 350, ...options },
    );
}

/** An explicit id isolates this viewport from the app's existing notifications. */
export function AppToaster({ toasterId }: { toasterId: string }) {
    return (
        <Toaster
            toasterId={toasterId}
            position="bottom-center"
            gutter={12}
            containerClassName={styles.viewport}
            containerStyle={{
                top: "max(1rem, env(safe-area-inset-top))",
                bottom: "var(--app-toast-bottom)",
                left: "max(1rem, env(safe-area-inset-left))",
                right: "max(1rem, env(safe-area-inset-right))",
            }}
        />
    );
}
