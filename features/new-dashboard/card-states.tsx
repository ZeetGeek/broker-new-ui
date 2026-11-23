import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { AppIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

/** A card's data failed to load: say what, and offer a retry. */
export function CardError({
    what,
    onRetry,
    retrying = false,
    className,
}: {
    /** Names the data, e.g. "your visits". */
    what: string;
    onRetry: () => void;
    retrying?: boolean;
    className?: string;
}) {
    return (
        <div
            role="alert"
            className={cn("flex flex-col items-center gap-3 py-6 text-center", className)}
        >
            <p className="body-sm text-pretty text-ink-muted">
                Couldn&apos;t load {what}. Check your connection and try again.
            </p>
            <Button variant="outline" size="sm" disabled={retrying} onClick={onRetry}>
                {retrying ? "Trying again…" : "Try again"}
            </Button>
        </div>
    );
}

/** A card with nothing to show yet: a small icon, one line, one next step. */
export function CardEmpty({
    icon: Icon,
    title,
    description,
    action,
    className,
}: {
    icon: AppIcon;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col items-center gap-2 py-6 text-center", className)}>
            <Icon aria-hidden className="text-brand-text/70 block-8 inline-8" strokeWidth={1.5} />
            <p className="body-sm font-semibold text-ink">{title}</p>
            {description ? (
                <p className="body-sm text-pretty text-ink-muted max-inline-xs">{description}</p>
            ) : null}
            {action ? <div className="pbs-1">{action}</div> : null}
        </div>
    );
}
