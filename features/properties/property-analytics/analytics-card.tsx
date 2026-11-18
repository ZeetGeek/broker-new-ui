import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** White section card on the listing analytics page. Same shell as the earnings cards. */
export function AnalyticsCard({
    title,
    titleId,
    description,
    action,
    className,
    children,
}: {
    title: string;
    titleId: string;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            aria-labelledby={titleId}
            className={cn(
                "flex flex-col gap-4 rounded-card bg-surface p-4 shadow-sm ring-1 ring-border-warm/50 min-inline-0 sm:p-5",
                className,
            )}
        >
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-inline-0">
                    <h2 id={titleId} className="h5 text-ink">
                        {title}
                    </h2>
                    {description ? <p className="body-sm text-ink-muted">{description}</p> : null}
                </div>
                {action}
            </header>
            {children}
        </section>
    );
}
