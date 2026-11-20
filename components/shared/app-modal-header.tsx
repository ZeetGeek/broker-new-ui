"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { IconButton } from "@/components/shared/icon-button";
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
                        render={<IconButton size="md" />}
                        disabled={closeDisabled}
                        aria-label="Close"
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
