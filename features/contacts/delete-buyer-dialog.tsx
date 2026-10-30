"use client";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";

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
                <div className="flex flex-row flex-wrap items-center justify-end gap-2 inline-full">
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => onOpenChange(false)}
                    >
                        Keep client
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={busy}
                        loading={busy}
                        onClick={onConfirm}
                    >
                        Delete client
                    </Button>
                </div>
            }
        >
            <p className="body text-ink-muted">
                This cannot be undone. Matched properties stay in your listings — only this client
                is removed.
            </p>
        </AppModal>
    );
}
