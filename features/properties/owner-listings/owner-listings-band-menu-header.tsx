"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export type OwnerListingsBandMenuHeaderProps = {
    description: string;
    onClear: () => void;
    className?: string;
};

/** Hint on the left, Clear on the right — label lives on the band trigger only. */
export function OwnerListingsBandMenuHeader({
    description,
    onClear,
    className,
}: OwnerListingsBandMenuHeaderProps) {
    return (
        <div className={cn("flex items-center justify-between gap-3", className)}>
            <p className="body-sm min-w-0 text-pretty text-ink-muted">{description}</p>
            <Button
                type="button"
                variant="link"
                size="xs"
                onClick={onClear}
                className="shrink-0 px-0 text-brand"
            >
                Clear
            </Button>
        </div>
    );
}
