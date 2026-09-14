"use client";

import type { CSSProperties, ReactNode } from "react";

import { XIcon } from "lucide-react";
import SimpleBar from "simplebar-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import "simplebar-react/dist/simplebar.min.css";

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

function hasVisibleDescription(description: ReactNode | undefined): boolean {
    if (description == null || description === false) return false;
    if (typeof description === "string") return description.trim().length > 0;
    return true;
}

export type AppModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    /** Optional — omitted or empty string hides the description entirely */
    description?: ReactNode;
    /** Extra sticky content under the title (tabs, filters, etc.) */
    header?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
    showCloseButton?: boolean;
    /** Horizontal size of the popup */
    size?: "sm" | "md" | "lg" | "xl" | "full";
    /** Controls --dialog-pad (header/body/footer inset) */
    padding?: "sm" | "md" | "lg" | "xl";
    className?: string;
    bodyClassName?: string;
    headerClassName?: string;
    footerClassName?: string;
    titleClassName?: string;
    descriptionClassName?: string;
};

/**
 * Product modal shell — same look as compound Dialog:
 * one surface, content-height, no header/footer dividers, quiet close.
 */
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
    const showDescription = hasVisibleDescription(description);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup
                showCloseButton={false}
                style={{ "--dialog-pad": pad } as CSSProperties}
                className={cn(
                    `
                      flex flex-col gap-0 overflow-hidden bg-surface p-0
                      max-block-[min(88dvh,calc(100%-1.5rem))]
                    `,
                    SIZE_CLASS[size],
                    className,
                )}
            >
                <div
                    className={cn(
                        "shrink-0 space-y-3 px-(--dialog-pad) pbs-(--dialog-pad) pbe-2",
                        headerClassName,
                    )}
                >
                    <div className="flex items-start justify-between gap-3">
                        <DialogHeader className="flex-1 gap-1.5 pe-0 text-start min-inline-0">
                            <DialogTitle
                                className={cn(
                                    "font-display text-lg font-medium text-ink",
                                    titleClassName,
                                )}
                            >
                                {title}
                            </DialogTitle>
                            {showDescription ? (
                                <DialogDescription
                                    className={cn(
                                        "body-sm text-ink-muted",
                                        descriptionClassName,
                                    )}
                                >
                                    {description}
                                </DialogDescription>
                            ) : null}
                        </DialogHeader>

                        {showCloseButton ? (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <DialogClose
                                            render={
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon-sm"
                                                    aria-label="Close"
                                                    className="shrink-0"
                                                />
                                            }
                                        />
                                    }
                                >
                                    <XIcon
                                        className="block-4 inline-4"
                                        strokeWidth={2}
                                        aria-hidden
                                    />
                                    <span className="sr-only">Close</span>
                                </TooltipTrigger>
                                <TooltipContent side="inline-start">
                                    Close
                                    <Kbd className="px-1.5 text-[10px] min-inline-4">Esc</Kbd>
                                </TooltipContent>
                            </Tooltip>
                        ) : null}
                    </div>
                    {header}
                </div>

                <div className="relative min-block-0 flex-1 overflow-hidden">
                    <SimpleBar
                        className="app-modal-simplebar block-full"
                        style={{ maxHeight: "100%" }}
                        autoHide
                    >
                        <div className={cn("px-(--dialog-pad) py-2", bodyClassName)}>
                            {children}
                        </div>
                    </SimpleBar>
                </div>

                {footer ? (
                    <div
                        className={cn(
                            "shrink-0 px-(--dialog-pad) pbs-3 pbe-(--dialog-pad)",
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
