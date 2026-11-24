import type { ComponentType, ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

import type { AppIcon } from "@/components/shared/icons";

import styles from "./empty-state.module.css";

type EmptyStateIcon = AppIcon | ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

export type EmptyStateProps = {
    icon: EmptyStateIcon;
    heading: ReactNode;
    description: string;
    children?: ReactNode;
    className?: string;
    headingId?: string;
    /** Page results get a bounded surface; embedded cards stay compact. */
    size?: "compact" | "page";
    variant?: "default" | "filtered" | "error";
};

/**
 * Shared empty, no-results and load-failure state with an optional recovery action.
 * See docs/EMPTY_STATES.md § Anatomy.
 */
export function EmptyState({
    icon: Icon,
    heading,
    description,
    children,
    className,
    headingId,
    size = "compact",
    variant = "default",
}: EmptyStateProps) {
    return (
        <div
            className={cn(styles.root, size === "page" && styles.page, className)}
            data-variant={variant}
            role={variant === "error" ? "alert" : "status"}
            aria-live={variant === "error" ? "assertive" : "polite"}
        >
            <div className={styles.visual} aria-hidden="true">
                <Icon className={styles.icon} strokeWidth={1.5} />
            </div>
            <div className={styles.copy}>
                <h2 id={headingId} className="h3 text-balance text-ink">
                    {heading}
                </h2>
                <p className="body-sm text-pretty text-ink-muted">{description}</p>
            </div>

            {children ? <div className={styles.actions}>{children}</div> : null}
        </div>
    );
}
