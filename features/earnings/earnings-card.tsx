import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { TrendingDown, TrendingUp } from "@/components/shared/icons";

import { VIZ_CLASS } from "@/features/earnings/earnings-viz";
import { isSampleDeal } from "@/features/earnings/sample-earnings";

/** White card used by every section on the earnings page except the dark summary. */
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

/**
 * "+18% vs September". Up is good unless `invert`. Words, not just colour,
 * carry the direction so it reads in sunlight and for colour-blind users.
 */
export function DeltaPill({
    percent,
    invert = false,
    label,
    tone = "light",
}: {
    percent: number | null;
    invert?: boolean;
    label?: string;
    tone?: "light" | "dark";
}) {
    if (percent == null) return null;
    const flat = percent === 0;
    const up = percent > 0;
    const good = invert ? percent < 0 : up;
    const Icon = up ? TrendingUp : TrendingDown;

    const pillClass =
        tone === "dark"
            ? "bg-surface/12 text-surface"
            : flat
              ? "bg-surface-muted text-ink-muted"
              : good
                ? "bg-chart-4/12 text-brand-text"
                : "bg-surface-muted text-ink";

    return (
        <span
            className={cn(
                "body-sm flex flex-wrap items-center gap-x-2 gap-y-1",
                tone === "dark" ? "text-surface/75" : "text-ink-muted",
            )}
        >
            <span
                className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold tabular-nums",
                    pillClass,
                )}
            >
                {flat ? (
                    "No change"
                ) : (
                    <>
                        <Icon aria-hidden className="block-3.5 inline-3.5" />
                        <span className="sr-only">{up ? "Up" : "Down"} </span>
                        {Math.abs(percent)}%
                    </>
                )}
            </span>
            {label}
        </span>
    );
}

/** "+3" / "−2" beside a count. Screen readers hear the full sentence. */
export function CountDelta({
    current,
    previous,
    invert = false,
}: {
    current: number;
    previous: number | null;
    invert?: boolean;
}) {
    if (previous == null) return null;
    const diff = current - previous;
    if (diff === 0) {
        return <span className="body-xs font-medium text-ink-muted">Same as before</span>;
    }
    const good = invert ? diff < 0 : diff > 0;
    return (
        <span
            className={cn(
                "body-xs inline-flex items-center rounded-full px-1.5 py-0.5 font-semibold tabular-nums",
                good ? "bg-chart-4/12 text-brand-text" : "bg-surface-muted text-ink-muted",
            )}
        >
            <span aria-hidden>
                {diff > 0 ? "+" : "−"}
                {Math.abs(diff)}
            </span>
            <span className="sr-only">
                {Math.abs(diff)} {diff > 0 ? "more" : "fewer"} than before
            </span>
        </span>
    );
}

/** "● Sale" / "● Rent" with the same colour the charts use. */
export function DealKind({ isRent }: { isRent: boolean }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span
                aria-hidden
                className={cn(
                    "rounded-full block-2 inline-2",
                    isRent ? VIZ_CLASS.rent.dot : VIZ_CLASS.sale.dot,
                )}
            />
            {isRent ? "Rent" : "Sale"}
        </span>
    );
}

/** Deal title that opens the deal; plain text for sample rows. */
export function EarningsDealLink({
    dealId,
    className,
    style,
    children,
}: {
    dealId: string;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}) {
    if (isSampleDeal(dealId)) {
        return (
            <span className={className} style={style}>
                {children}
            </span>
        );
    }
    return (
        <Link
            href={`/broker/pipeline/${dealId}`}
            className={cn(
                "rounded-sm hover:text-brand-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                className,
            )}
            style={style}
        >
            {children}
        </Link>
    );
}
