"use client";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";

export type PropertyDeleteDialogProps = {
    permanent?: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    busy: boolean;
    onConfirm: () => void;
};

/**
 * Destructive confirm. Own footer — primary is danger, not brand.
 */
export function PropertyDeleteDialog({
    permanent = false,
    open,
    onOpenChange,
    title,
    busy,
    onConfirm,
}: PropertyDeleteDialogProps) {
    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="sm"
            title={permanent ? "Delete this property permanently?" : "Delete this property?"}
            description={
                permanent
                    ? `"${title}" will be removed permanently.`
                    : `"${title}" will move to Deleted.`
            }
            footer={
                <AppModalFooter
                    className="flex flex-row flex-wrap items-center justify-end gap-2 inline-full"
                    secondaryLabel="Keep it"
                    secondaryVariant="ghost"
                    secondaryDisabled={busy}
                    onSecondary={() => onOpenChange(false)}
                    primaryLabel={
                        busy ? "Removing…" : permanent ? "Delete permanently" : "Delete property"
                    }
                    primaryType="button"
                    primaryVariant="destructive"
                    primarySize="default"
                    primaryDisabled={busy}
                    onPrimary={onConfirm}
                />
            }
        >
            <p className="body text-ink-muted">
                {permanent
                    ? "This cannot be undone. The property, its photos, its visits and its client links will be permanently removed. Your clients stay."
                    : "It comes off the market straight away: brokers can no longer find it, pending broker requests are declined and open visit times are closed. You can restore it as a draft from Deleted."}
            </p>
        </AppModal>
    );
}
