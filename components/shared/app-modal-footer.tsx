"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export type AppModalFooterProps = {
    /** Primary action — the pill button on the trailing edge. */
    primaryLabel: ReactNode;
    onPrimary?: () => void;
    primaryType?: "button" | "submit";
    /** Set when the primary button submits a form rendered outside the footer. */
    primaryFormId?: string;
    primaryDisabled?: boolean;
    primaryIcon?: ReactNode;
    /** Secondary action — quiet text button on the leading edge. */
    secondaryLabel?: ReactNode;
    onSecondary?: () => void;
    secondaryDisabled?: boolean;
    secondaryIcon?: ReactNode;
    /** Extra content between the two actions (a "skip" link, a count, etc.). */
    children?: ReactNode;
    className?: string;
};

/**
 * The shared modal action bar: quiet secondary on the leading edge, brand pill
 * on the trailing edge, stacking to full width on small screens.
 *
 * Pass to `AppModal`'s `footer` prop, which supplies the border and inset.
 */
export function AppModalFooter({
    primaryLabel,
    onPrimary,
    primaryType = "button",
    primaryFormId,
    primaryDisabled,
    primaryIcon,
    secondaryLabel,
    onSecondary,
    secondaryDisabled,
    secondaryIcon,
    children,
    className,
}: AppModalFooterProps) {
    return (
        <div
            className={cn(
                `
                  flex flex-col-reverse gap-3 inline-full
                  sm:flex-row sm:items-center sm:justify-between
                `,
                className,
            )}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {secondaryLabel ? (
                    <Button
                        type="button"
                        variant="link"
                        size="lg"
                        disabled={secondaryDisabled}
                        onClick={onSecondary}
                        className="px-0 text-ink-muted hover:text-ink"
                    >
                        {secondaryIcon}
                        {secondaryLabel}
                    </Button>
                ) : null}
                {children}
            </div>

            <Button
                type={primaryType}
                form={primaryFormId}
                size="lg"
                disabled={primaryDisabled}
                onClick={onPrimary}
                className="
                  rounded-full bg-brand px-8 text-surface
                  hover:bg-brand-text
                  sm:min-inline-56
                "
            >
                {primaryLabel}
                {primaryIcon}
            </Button>
        </div>
    );
}
