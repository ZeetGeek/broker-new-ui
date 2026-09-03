"use client";

import * as React from "react";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

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
    ...props
}: DialogPrimitive.Popup.Props & {
    showCloseButton?: boolean;
}) {
    return (
        <DialogPortal>
            <DialogBackdrop />
            <DialogPrimitive.Popup
                data-slot="dialog-popup"
                className={cn(
                    `
                      t-modal fixed inset-s-1/2 inset-bs-1/2 z-50 grid -translate-1/2 gap-4
                      rounded-card border border-border-warm bg-surface p-6 shadow-xl outline-none
                      inline-full max-inline-md
                    `,
                    className,
                )}
                {...props}
            >
                {children}
                {showCloseButton ? (
                    <DialogClose
                        className="
                          absolute inset-e-3 inset-bs-3 flex items-center justify-center
                          rounded-full bg-surface-muted text-ink-muted outline-none
                          transition-[background-color,color,transform] duration-160 ease-out
                          block-10 inline-10
                          hover:bg-canvas hover:text-ink
                          focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
                          focus-visible:ring-offset-surface
                          active:scale-[0.94]
                        "
                    >
                        <XIcon className="block-4.5 inline-4.5" strokeWidth={2} />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                ) : null}
            </DialogPrimitive.Popup>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={cn("flex flex-col gap-1.5 pe-10 text-center sm:text-start", className)}
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
