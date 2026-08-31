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
                `
                  fixed inset-0 z-50 bg-ink/40 duration-150
                  data-open:animate-in data-open:fade-in-0
                  data-closed:animate-out data-closed:fade-out-0
                `,
                className,
            )}
            {...props}
        />
    );
}

function DialogPopup({ className, children, ...props }: DialogPrimitive.Popup.Props) {
    return (
        <DialogPortal>
            <DialogBackdrop />
            <DialogPrimitive.Popup
                data-slot="dialog-popup"
                className={cn(
                    `
                      fixed top-1/2 left-1/2 z-50 grid w-full max-w-md -translate-x-1/2
                      -translate-y-1/2 gap-4 rounded-3xl border border-border-warm bg-surface p-6
                      shadow-lg duration-150 outline-none
                      data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
                      data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95
                    `,
                    className,
                )}
                {...props}
            >
                {children}
                <DialogClose
                    className="
                    absolute inset-block-start-4 inset-inline-end-4 rounded-full p-1
                    text-ink-muted opacity-70 outline-none
                    hover:bg-surface-muted hover:opacity-100
                  "
                >
                    <XIcon className="block-4 inline-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>
            </DialogPrimitive.Popup>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={cn("flex flex-col gap-1.5 text-center sm:text-start", className)}
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
