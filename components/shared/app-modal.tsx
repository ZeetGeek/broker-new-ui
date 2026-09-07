"use client";

import type { CSSProperties, ReactNode } from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

import { cn } from "@/lib/utils";

import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";

const SIZE_CLASS: Record<NonNullable<AppModalProps["size"]>, string> = {
    sm: `
      inline-[min(24rem,calc(100vw-1.5rem))]
      max-inline-[min(24rem,calc(100vw-1.5rem))]
    `,
    md: `
      inline-[min(32rem,calc(100vw-1.5rem))]
      max-inline-[min(32rem,calc(100vw-1.5rem))]
    `,
    lg: `
      inline-[min(48rem,calc(100vw-1.5rem))]
      max-inline-[min(48rem,calc(100vw-1.5rem))]
      sm:inline-[min(48rem,calc(100vw-2rem))]
      sm:max-inline-[min(48rem,calc(100vw-2rem))]
    `,
    xl: `
      inline-[min(76rem,calc(100vw-1rem))]
      max-inline-[min(76rem,calc(100vw-1rem))]
      sm:inline-[min(76rem,calc(100vw-2rem))]
      sm:max-inline-[min(76rem,calc(100vw-2rem))]
    `,
    full: `
      inline-[calc(100vw-1rem)]
      max-inline-[calc(100vw-1rem)]
      sm:inline-[calc(100vw-2rem)]
      sm:max-inline-[calc(100vw-2rem)]
    `,
};

const PAD_VALUE: Record<NonNullable<AppModalProps["padding"]>, string> = {
    sm: "1rem",
    md: "1.25rem",
    lg: "1.5rem",
    xl: "2rem",
};

export type AppModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    /** Extra sticky content under the title (tabs, filters, etc.) */
    header?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
    showCloseButton?: boolean;
    /** Horizontal size of the popup */
    size?: "sm" | "md" | "lg" | "xl" | "full";
    /** Controls --dialog-pad (header/body/footer + close inset) */
    padding?: "sm" | "md" | "lg" | "xl";
    className?: string;
    bodyClassName?: string;
    headerClassName?: string;
    footerClassName?: string;
    /** Visually hide title (still required for a11y when passed) */
    titleClassName?: string;
    descriptionClassName?: string;
};

export function AppModal({
    open,
    onOpenChange,
    title,
    description,
    header,
    footer,
    children,
    showCloseButton = true,
    size = "md",
    padding = "lg",
    className,
    bodyClassName,
    headerClassName,
    footerClassName,
    titleClassName,
    descriptionClassName,
}: AppModalProps) {
    const pad = PAD_VALUE[padding];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup
                showCloseButton={showCloseButton}
                style={{ "--dialog-pad": pad } as CSSProperties}
                className={cn(
                    `
                      flex flex-col gap-0 overflow-hidden p-0
                      block-[min(92dvh,calc(100%-1rem))]
                    `,
                    SIZE_CLASS[size],
                    className,
                )}
            >
                <div
                    className={cn(
                        `
                          shrink-0 space-y-4 border-be border-border-warm/50
                          px-(--dialog-pad) pb-4 pe-[calc(var(--dialog-pad)+1.75rem)]
                          pt-(--dialog-pad)
                        `,
                        headerClassName,
                    )}
                >
                    <DialogHeader className="gap-1 pe-0 text-start">
                        <DialogTitle className={cn("display-md font-display", titleClassName)}>
                            {title}
                        </DialogTitle>
                        {description ? (
                            <DialogDescription className={cn("body-sm", descriptionClassName)}>
                                {description}
                            </DialogDescription>
                        ) : null}
                    </DialogHeader>
                    {header}
                </div>

                <div className="min-block-0 flex-1 overflow-hidden">
                    <SimpleBar
                        className="app-modal-simplebar block-full"
                        style={{ maxHeight: "100%", height: "100%" }}
                        autoHide={false}
                    >
                        <div
                            className={cn(
                                "px-(--dialog-pad) py-(--dialog-pad)",
                                bodyClassName,
                            )}
                        >
                            {children}
                        </div>
                    </SimpleBar>
                </div>

                {footer ? (
                    <div
                        className={cn(
                            `
                              flex shrink-0 flex-wrap items-center justify-between gap-3 border-bs
                              border-border-warm/50 bg-surface px-(--dialog-pad) py-4
                            `,
                            footerClassName,
                        )}
                    >
                        {footer}
                    </div>
                ) : null}
            </DialogPopup>
        </Dialog>
    );
}
