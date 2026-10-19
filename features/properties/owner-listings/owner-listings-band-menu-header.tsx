"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export type OwnerListingsBandMenuHeaderProps = {
    description: string;
    /** Shown only when the selection is no longer the default. */
    showReset?: boolean;
    onClear: () => void;
    className?: string;
};

/** Hint on the left, Reset on the right — label lives on the band trigger only. */
export function OwnerListingsBandMenuHeader({
    description,
    showReset = false,
    onClear,
    className,
}: OwnerListingsBandMenuHeaderProps) {
    return (
        <div className={cn("flex items-center justify-between gap-3", className)}>
            <p className="body-sm text-pretty text-ink-muted min-inline-0">{description}</p>
            {showReset ? (
                <Button
                    type="button"
                    variant="link"
                    size="xs"
                    onClick={onClear}
                    className="shrink-0 px-0 text-brand"
                >
                    Reset
                </Button>
            ) : null}
        </div>
    );
}
