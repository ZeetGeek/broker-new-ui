import type { ComponentType, ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

import type { AppIcon } from "@/components/shared/icons";

type EmptyStateIcon = AppIcon | ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

export type EmptyStateProps = {
    icon: EmptyStateIcon;
    heading: ReactNode;
    description: string;
    children?: ReactNode;
    className?: string;
    headingId?: string;
};

/**
 * First-run empty state — icon, headline, one line, optional action.
 * See docs/EMPTY_STATES.md § Anatomy.
 */
export function EmptyState({
    icon: Icon,
    heading,
    description,
    children,
    className,
    headingId,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                `
                  flex flex-1 flex-col items-center justify-center gap-5 px-4 text-center
                  min-block-0
                `,
                className,
            )}
            aria-live="polite"
        >
            <div className="flex max-w-sm flex-col items-center gap-3.5">
                <Icon
                    aria-hidden
                    className="text-brand-text/70 block-10 inline-10"
                    strokeWidth={1.5}
                />

                <div className="flex flex-col gap-1.5">
                    <h2 id={headingId} className="h3 text-ink text-balance">
                        {heading}
                    </h2>
                    <p className="body-sm text-pretty text-ink-muted">{description}</p>
                </div>
            </div>

            {children ? <div className="flex flex-col items-center pt-1">{children}</div> : null}
        </div>
    );
}
