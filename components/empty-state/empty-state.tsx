import type { ComponentType, ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

import type { AppIcon } from "@/components/shared/icons";

import { EmptyStateAction, type EmptyStateActionProps } from "./empty-state-action";

import styles from "./empty-state.module.css";

type EmptyStateIcon = AppIcon | ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

export type EmptyStateProps = {
    icon: EmptyStateIcon;
    heading: ReactNode;
    description?: string;
    /** Preferred action API: the component owns the button appearance. */
    action?: EmptyStateActionProps;
    /** Legacy custom content. Prefer action for a single next step. */
    children?: ReactNode;
    className?: string;
    headingId?: string;
    /** Page results get a bounded surface; embedded cards stay compact. */
    size?: "compact" | "page" | "card";
    variant?: "default" | "filtered" | "error";
    /** Use on a dark brand surface, such as the featured visit card. */
    tone?: "default" | "inverse";
};

/**
 * Shared empty, no-results and load-failure state with an optional recovery action.
 * See docs/EMPTY_STATES.md § Anatomy.
 */
export function EmptyState({
    icon: Icon,
    heading,
    description,
    action,
    children,
    className,
    headingId,
    size = "compact",
    variant = "default",
    tone = "default",
}: EmptyStateProps) {
    const Heading = size === "card" ? "h3" : "h2";
    return (
        <div
            className={cn(
                styles.root,
                size === "page" && styles.page,
                size === "card" && styles.card,
                tone === "inverse" && styles.inverse,
                className,
            )}
            data-variant={variant}
            role={variant === "error" ? "alert" : "status"}
            aria-live={variant === "error" ? "assertive" : "polite"}
        >
            <div className={styles.visual} aria-hidden="true">
                <Icon className={styles.icon} strokeWidth={1.5} />
            </div>
            <div className={styles.copy}>
                <Heading
                    id={headingId}
                    className={cn(
                        size === "card" ? "body-sm font-semibold" : "h3",
                        "text-balance text-ink",
                    )}
                >
                    {heading}
                </Heading>
                {description ? (
                    <p className="body-sm text-pretty text-ink-muted">{description}</p>
                ) : null}
            </div>

            {action || children ? (
                <div className={styles.actions}>
                    {action ? <EmptyStateAction {...action} tone={tone} /> : children}
                </div>
            ) : null}
        </div>
    );
}
