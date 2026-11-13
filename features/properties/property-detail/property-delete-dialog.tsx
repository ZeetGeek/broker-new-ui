"use client";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";

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
                <div className="flex flex-row flex-wrap items-center justify-end gap-2 inline-full">
                    <Button
                        type="button"
                        variant="ghost"
                        size="default"
                        disabled={busy}
                        onClick={() => onOpenChange(false)}
                        className="inline-auto"
                    >
                        Keep it
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="default"
                        disabled={busy}
                        onClick={onConfirm}
                        className="inline-auto"
                    >
                        {busy ? "Removing…" : permanent ? "Delete permanently" : "Delete property"}
                    </Button>
                </div>
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
