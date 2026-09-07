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
 * Destructive confirm. Uses its own footer rather than `AppModalFooter`,
 * whose primary button is brand green — the wrong colour for a delete.
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
                <div className="
                  flex flex-col-reverse gap-3 inline-full
                  sm:flex-row sm:items-center sm:justify-between
                ">
                    <Button
                        type="button"
                        variant="link"
                        size="lg"
                        disabled={busy}
                        onClick={() => onOpenChange(false)}
                        className="px-0 text-ink-muted hover:text-ink"
                    >
                        Keep it
                    </Button>
                    <Button
                        type="button"
                        size="lg"
                        disabled={busy}
                        onClick={onConfirm}
                        className="
                          rounded-full bg-danger px-8 text-surface
                          hover:bg-danger/90
                          sm:min-inline-56
                        "
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
