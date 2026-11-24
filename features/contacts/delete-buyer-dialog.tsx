"use client";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";

export function DeleteBuyerDialog({
    open,
    onOpenChange,
    name,
    busy,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    name: string;
    busy: boolean;
    onConfirm: () => void;
}) {
    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="sm"
            title="Delete this client?"
            description={`“${name}” will be removed from your clients.`}
            footer={
                <AppModalFooter
                    className="flex flex-row flex-wrap items-center justify-end gap-2 inline-full"
                    secondaryLabel="Keep client"
                    secondaryVariant="ghost"
                    secondaryDisabled={busy}
                    onSecondary={() => onOpenChange(false)}
                    primaryLabel="Delete client"
                    primaryType="button"
                    primaryVariant="destructive"
                    primaryDisabled={busy}
                    primaryLoading={busy}
                    onPrimary={onConfirm}
                />
            }
        >
            <p className="body text-ink-muted">
                This cannot be undone. Matched properties stay in your listings — only this client
                is removed.
            </p>
        </AppModal>
    );
}
