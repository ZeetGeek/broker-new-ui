import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type EmptyStateProps = {
    icon: LucideIcon;
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
                  flex flex-1 flex-col items-center justify-center gap-4 px-1 text-center
                  min-block-0
                `,
                className,
            )}
            aria-live="polite"
        >
            <div className="flex max-w-prose flex-col items-center gap-3">
                <span
                    aria-hidden
                    className="
                      flex items-center justify-center rounded-full text-ink-subtle block-12
                      inline-12
                    "
                >
                    <Icon className="block-7 inline-7" strokeWidth={1.75} />
                </span>

                <div className="flex flex-col gap-1.5">
                    <h2 id={headingId} className="h5 text-ink">
                        {heading}
                    </h2>
                    <p className="body-sm text-pretty text-ink-muted">{description}</p>
                </div>
            </div>

            {children}
        </div>
    );
}
