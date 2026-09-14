"use client";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";

export type PropertyDeleteDialogProps = {
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
            title="Delete this property?"
            description={`“${title}” will be removed permanently.`}
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
                        {busy ? "Removing…" : "Delete property"}
                    </Button>
                </div>
            }
        >
            <p className="body text-ink-muted">
                This cannot be undone. If you only want to hide it from brokers, unpublish it
                instead — the listing and its photos stay in your account.
            </p>
        </AppModal>
    );
}
