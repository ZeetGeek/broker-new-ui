"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import SimpleBar from "simplebar-react";

import { cn } from "@/lib/utils";

import { XIcon } from "@/components/shared/icons";
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
    nativeScroll?: boolean;
    /** Temporarily release modal focus when a nested external lightbox owns it. */
    modal?: boolean;
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
    nativeScroll = false,
    modal = true,
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
    const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [hasMoreBelow, setHasMoreBelow] = useState(false);
    useEffect(() => {
        if (!open || !nativeScroll) return;
        const content = contentRef.current;
        if (!viewport || !content) return;
        const update = () =>
            setHasMoreBelow(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 2);
        const observer = new ResizeObserver(update);
        observer.observe(viewport);
        observer.observe(content);
        viewport.addEventListener("scroll", update, { passive: true });
        update();
        return () => {
            observer.disconnect();
            viewport.removeEventListener("scroll", update);
        };
    }, [open, nativeScroll, viewport]);
    const pad = PAD_VALUE[padding];
    const showDescription = hasVisibleDescription(description);
    const titleClass = cn("font-display text-lg font-medium text-ink", titleClassName);
    const titleIsSrOnly = typeof titleClassName === "string" && /\bsr-only\b/.test(titleClassName);
    /** Custom `header` owns the chrome — keep DialogTitle for a11y only. */
    const customHeaderOnly = Boolean(header) && titleIsSrOnly && !showDescription;

    return (
        <Dialog open={open} modal={modal} onOpenChange={onOpenChange}>
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
                    {customHeaderOnly ? (
                        <DialogTitle className={titleClass}>{title}</DialogTitle>
                    ) : (
                        <div className="flex items-start justify-between gap-3">
                            <DialogHeader className="flex-1 gap-1.5 pe-0 text-start min-inline-0">
                                <DialogTitle className={titleClass}>{title}</DialogTitle>
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
                    )}
                    {header}
                </div>

                <div
                    ref={setViewport}
                    className={cn(
                        "relative flex-1 min-block-0",
                        nativeScroll ? "overflow-y-auto overscroll-contain" : "overflow-hidden",
                    )}
                >
                    {nativeScroll ? (
                        <div ref={contentRef} className={cn("p-(--dialog-pad)", bodyClassName)}>
                            {children}
                        </div>
                    ) : (
                        <SimpleBar
                            className="app-modal-simplebar block-full"
                            style={{ maxHeight: "100%" }}
                            autoHide
                        >
                            <div className={cn("p-(--dialog-pad)", bodyClassName)}>{children}</div>
                        </SimpleBar>
                    )}
                </div>

                {footer ? (
                    <div
                        className={cn(
                            "shrink-0 px-(--dialog-pad) pbs-3 pbe-(--dialog-pad)",
                            nativeScroll &&
                                hasMoreBelow &&
                                "shadow-[0_-6px_16px_-8px_rgb(0_0_0/0.2)]",
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
