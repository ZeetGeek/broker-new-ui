"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

export type AppModalFooterProps = ComponentProps<"div"> & {
    /** Primary action on the trailing edge. */
    primaryLabel?: ReactNode;
    onPrimary?: () => void;
    primaryType?: "button" | "submit";
    /** Set when the primary button submits a form rendered outside the footer. */
    primaryFormId?: string;
    primaryDisabled?: boolean;
    primaryIcon?: ReactNode;
    primaryLoading?: boolean;
    primaryVariant?: ComponentProps<typeof Button>["variant"];
    primarySize?: ComponentProps<typeof Button>["size"];
    /** Secondary action — ghost, leading. */
    secondaryLabel?: ReactNode;
    onSecondary?: () => void;
    secondaryDisabled?: boolean;
    secondaryIcon?: ReactNode;
    secondaryVariant?: ComponentProps<typeof Button>["variant"];
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
    primaryLoading,
    primaryVariant = "accent",
    primarySize = "default",
    secondaryLabel,
    onSecondary,
    secondaryDisabled,
    secondaryIcon,
    secondaryVariant = "ghost",
    children,
    className,
    ...props
}: AppModalFooterProps) {
    return (
        <DialogFooter
            className={cn(
                "flex flex-row flex-wrap items-center justify-end gap-2 inline-full",
                className,
            )}
            {...props}
        >
            {children}
            {secondaryLabel ? (
                <Button
                    type="button"
                    variant={secondaryVariant}
                    size="default"
                    disabled={secondaryDisabled}
                    onClick={onSecondary}
                    className="inline-auto"
                >
                    {secondaryIcon}
                    {secondaryLabel}
                </Button>
            ) : null}
            {primaryLabel != null ? (
                <Button
                    type={primaryType}
                    form={primaryFormId}
                    variant={primaryVariant}
                    size={primarySize}
                    loading={primaryLoading}
                    disabled={primaryDisabled}
                    onClick={onPrimary}
                    className="inline-auto"
                >
                    {primaryLabel}
                    {primaryIcon}
                </Button>
            ) : null}
        </DialogFooter>
    );
}
