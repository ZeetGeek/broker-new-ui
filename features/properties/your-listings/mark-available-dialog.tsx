"use client";

import { useState } from "react";

import { ApiError } from "@/lib/api/client";
import { myListingsApi } from "@/lib/api/my-listings";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import toast from "@/components/shared/app-toast";
import { Info } from "@/components/shared/icons";

/**
 * Confirm putting a sold listing back on the market. Closed contacts stay
 * closed — this only clears sold availability.
 */
export function MarkAvailableDialog({
    open,
    onOpenChange,
    propertyId,
    propertyTitle,
    onAvailable,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    propertyId: string;
    propertyTitle: string;
    onAvailable?: () => void;
}) {
    const [busy, setBusy] = useState(false);

    function handleOpenChange(next: boolean) {
        if (busy) return;
        onOpenChange(next);
    }

    async function confirm() {
        setBusy(true);
        try {
            const updated = await myListingsApi.markAvailable(propertyId);
            if (!updated) {
                throw new Error("Could not publish again. Try again.");
            }
            toast.message("property-available", {
                detail: propertyTitle,
                description: "The property is marked as available again.",
            });
            onOpenChange(false);
            onAvailable?.();
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not publish again. Try again.",
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <AppModal
            open={open}
            onOpenChange={handleOpenChange}
            size="sm"
            title="Publish this property again?"
            description={propertyTitle}
            footer={
                <AppModalFooter
                    className="flex flex-row flex-wrap items-center justify-end gap-2 inline-full"
                    secondaryLabel="Keep sold"
                    secondaryVariant="ghost"
                    secondaryDisabled={busy}
                    onSecondary={() => handleOpenChange(false)}
                    primaryLabel="Publish again"
                    primaryType="button"
                    primaryVariant="accent"
                    primaryDisabled={busy}
                    primaryLoading={busy}
                    onPrimary={() => void confirm()}
                />
            }
        >
            <div className="flex gap-3 rounded-inner border border-border-warm bg-canvas p-3.5">
                <Info
                    aria-hidden
                    className="mbs-0.5 shrink-0 text-brand block-5 inline-5"
                    strokeWidth={1.75}
                />
                <div className="flex flex-col gap-1.5 min-inline-0">
                    <p className="body-sm font-semibold text-ink">Back on the market</p>
                    <p className="body-sm text-ink">
                        It shows as available again. Contacts already marked lost stay as they are.
                    </p>
                </div>
            </div>
        </AppModal>
    );
}
