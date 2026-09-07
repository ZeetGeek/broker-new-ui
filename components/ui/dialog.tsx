"use client";

import * as React from "react";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Padding + close-button inset. Change once — both stay in sync. */
const DIALOG_PAD = "1.5rem";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
    return (
        <DialogPrimitive.Backdrop
            data-slot="dialog-backdrop"
            className={cn(
                `t-modal-backdrop fixed inset-0 z-50 bg-ink/50 backdrop-blur-[3px]`,
                className,
            )}
            {...props}
        />
    );
}

function DialogPopup({
    className,
    children,
    showCloseButton = true,
    style,
    ...props
}: DialogPrimitive.Popup.Props & {
    showCloseButton?: boolean;
}) {
    return (
        <DialogPortal>
            <DialogBackdrop />
            <DialogPrimitive.Popup
                data-slot="dialog-popup"
                style={
                    {
                        "--dialog-pad": DIALOG_PAD,
                        ...style,
                    } as unknown as React.CSSProperties
                }
                className={cn(
                    `
                      t-modal fixed inset-s-1/2 inset-bs-1/2 z-50 grid -translate-1/2 gap-4
                      rounded-card border border-border-warm bg-surface p-(--dialog-pad) shadow-xl
                      outline-none inline-full max-inline-md
                    `,
                    className,
                )}
                {...props}
            >
                {children}
                {showCloseButton ? (
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <DialogClose
                                    className="
                                      absolute inset-e-(--dialog-pad) inset-bs-(--dialog-pad) flex
                                      items-center justify-center text-ink-muted
                                      transition-[color,transform] duration-160 ease-out
                                      outline-none
                                      hover:text-ink
                                      focus-visible:ring-2 focus-visible:ring-brand
                                      focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                                      active:scale-[0.94]
                                    "
                                />
                            }
                        >
                            <XIcon className="block-4.5 inline-4.5" strokeWidth={2} aria-hidden />
                            <span className="sr-only">Close</span>
                        </TooltipTrigger>
                        <TooltipContent side="inline-start">
                            Close
                            <Kbd className="px-1.5 text-[10px] min-inline-4">Esc</Kbd>
                        </TooltipContent>
                    </Tooltip>
                ) : null}
            </DialogPrimitive.Popup>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={cn(
                `
                  flex flex-col gap-1.5 pe-[calc(var(--dialog-pad)+1.25rem)] text-center
                  sm:text-start
                `,
                className,
            )}
            {...props}
        />
    );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn("font-display text-lg font-medium text-ink", className)}
            {...props}
        />
    );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn("body-sm text-ink-muted", className)}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogBackdrop,
    DialogClose,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
