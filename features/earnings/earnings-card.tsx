import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Card frame shared by every section on the earnings page. */
export function EarningsCard({
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
                "flex flex-col gap-5 rounded-card border border-border-warm bg-surface p-5 shadow-sm min-inline-0 md:p-6",
                className,
            )}
        >
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-inline-0">
                    <h2 id={titleId} className="h6 text-ink">
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

/** Small "+12% vs previous period" pill. Up is good unless `invert`. */
export function DeltaPill({
    percent,
    invert = false,
    label = "vs previous period",
}: {
    percent: number | null;
    invert?: boolean;
    label?: string;
}) {
    if (percent == null) return null;
    const flat = percent === 0;
    const good = invert ? percent < 0 : percent > 0;
    return (
        <span className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
            <span
                className={cn(
                    "rounded-full px-2 py-0.5 font-semibold tabular-nums",
                    flat
                        ? "bg-surface-muted text-ink-muted"
                        : good
                          ? "bg-success-soft text-success"
                          : "bg-danger-soft text-danger",
                )}
            >
                {flat ? "No change" : `${percent > 0 ? "↑" : "↓"} ${Math.abs(percent)}%`}
            </span>
            {label}
        </span>
    );
}
