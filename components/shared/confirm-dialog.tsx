"use client";

import type { ReactNode } from "react";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";

export type ConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** A question: "Cancel this visit?" */
    title: string;
    /** One line under the title naming what is affected. */
    description?: ReactNode;
    /** Optional body: consequences the user should know before confirming. */
    children?: ReactNode;
    /** Verb + object: "Cancel visit", "Log out". */
    confirmLabel: string;
    /** Safe choice: "Keep visit", "Stay signed in". */
    cancelLabel?: string;
    busy?: boolean;
    onConfirm: () => void;
};

/**
 * Plain click-then-confirm for destructive actions. Danger primary, ghost
 * escape. The button that opens this should be a normal click, not a hold.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    confirmLabel,
    cancelLabel = "Cancel",
    busy = false,
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (!next && busy) return;
                onOpenChange(next);
            }}
            size="sm"
            title={title}
            description={description}
            footer={
                <div className="flex flex-row flex-wrap items-center justify-end gap-2 inline-full">
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => onOpenChange(false)}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={busy}
                        loading={busy}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            }
        >
            {children ?? null}
        </AppModal>
    );
}
