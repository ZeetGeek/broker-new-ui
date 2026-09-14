"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export type AppModalFooterProps = {
    /** Primary action on the trailing edge. */
    primaryLabel: ReactNode;
    onPrimary?: () => void;
    primaryType?: "button" | "submit";
    /** Set when the primary button submits a form rendered outside the footer. */
    primaryFormId?: string;
    primaryDisabled?: boolean;
    primaryIcon?: ReactNode;
    /** Secondary action — ghost, leading. */
    secondaryLabel?: ReactNode;
    onSecondary?: () => void;
    secondaryDisabled?: boolean;
    secondaryIcon?: ReactNode;
    /** Extra content between the two actions (a "skip" link, a count, etc.). */
    children?: ReactNode;
    className?: string;
};

/**
 * Modal actions matching compound Dialog: right-aligned, auto width,
 * ghost cancel + accent (brand) primary (`Button` size default).
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
                "flex flex-row flex-wrap items-center justify-end gap-2 inline-full",
                className,
            )}
        >
            {children}
            {secondaryLabel ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="default"
                    disabled={secondaryDisabled}
                    onClick={onSecondary}
                    className="inline-auto"
                >
                    {secondaryIcon}
                    {secondaryLabel}
                </Button>
            ) : null}
            <Button
                type={primaryType}
                form={primaryFormId}
                variant="accent"
                size="default"
                disabled={primaryDisabled}
                onClick={onPrimary}
                className="inline-auto"
            >
                {primaryLabel}
                {primaryIcon}
            </Button>
        </div>
    );
}
