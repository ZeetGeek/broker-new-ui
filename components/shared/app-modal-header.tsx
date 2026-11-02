"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { XIcon } from "@/components/shared/icons";
import { DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type AppModalHeaderProps = Omit<ComponentProps<"div">, "title"> & {
    title: ReactNode;
    description?: ReactNode;
    showCloseButton?: boolean;
    closeDisabled?: boolean;
    titleClassName?: string;
    descriptionClassName?: string;
};

/** Use inside DialogPopup with showCloseButton={false} to avoid duplicate controls. */
export function AppModalHeader({
    title,
    description,
    showCloseButton = true,
    closeDisabled = false,
    titleClassName,
    descriptionClassName,
    className,
    children,
    ...props
}: AppModalHeaderProps) {
    return (
        <div
            data-slot="app-modal-header"
            className={cn(
                "shrink-0 border-be border-(--dialog-divider) bg-surface px-(--dialog-pad) py-3",
                className,
            )}
            {...props}
        >
            <div className="flex items-center justify-between gap-4">
                <DialogTitle className={cn("flex-1 text-start min-inline-0", titleClassName)}>
                    {title}
                </DialogTitle>
                {showCloseButton ? (
                    <DialogClose
                        disabled={closeDisabled}
                        aria-label="Close"
                        className="flex shrink-0 items-center justify-center rounded-control border border-border-warm bg-surface text-ink-muted outline-none block-9 inline-9 hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50"
                    >
                        <XIcon className="block-4 inline-4" strokeWidth={2} aria-hidden />
                    </DialogClose>
                ) : null}
            </div>
            {description ? (
                <DialogDescription className={cn("mbs-1.5", descriptionClassName)}>
                    {description}
                </DialogDescription>
            ) : null}
            {children}
        </div>
    );
}
