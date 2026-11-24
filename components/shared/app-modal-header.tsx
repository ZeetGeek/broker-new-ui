"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { IconButton } from "@/components/shared/icon-button";
import { XIcon } from "@/components/shared/icons";
import { DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AppModalHeaderProps = Omit<ComponentProps<"div">, "title"> & {
    title: ReactNode;
    description?: ReactNode;
    showCloseButton?: boolean;
    closeDisabled?: boolean;
    titleClassName?: string;
    descriptionClassName?: string;
    contentClassName?: string;
    titleExtra?: ReactNode;
    actions?: ReactNode;
    rowClassName?: string;
    actionsClassName?: string;
};

/** Use inside DialogPopup with showCloseButton={false} to avoid duplicate controls. */
export function AppModalHeader({
    title,
    description,
    showCloseButton = true,
    closeDisabled = false,
    titleClassName,
    descriptionClassName,
    contentClassName,
    titleExtra,
    actions,
    rowClassName,
    actionsClassName,
    className,
    children,
    ...props
}: AppModalHeaderProps) {
    return (
        <DialogHeader
            data-slot="app-modal-header"
            className={cn(
                "shrink-0 gap-0 border-be border-(--dialog-divider) bg-surface px-(--dialog-pad) py-3",
                className,
            )}
            {...props}
        >
            <div
                data-slot="dialog-heading-row"
                className={cn("flex items-center justify-between gap-4 inline-full", rowClassName)}
            >
                <div className="flex flex-1 flex-wrap items-center gap-2.5 min-inline-0">
                    <DialogTitle className={cn("flex-1 text-start min-inline-0", titleClassName)}>
                        {title}
                    </DialogTitle>
                    {titleExtra}
                </div>
                {actions || showCloseButton ? (
                    <div className={cn("flex shrink-0 items-center gap-2", actionsClassName)}>
                        {actions}
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
                ) : null}
            </div>
            {description || children ? (
                <div className={cn("space-y-3 pbs-3 inline-full", contentClassName)}>
                    {description ? (
                        <DialogDescription className={descriptionClassName}>
                            {description}
                        </DialogDescription>
                    ) : null}
                    {children}
                </div>
            ) : null}
        </DialogHeader>
    );
}
