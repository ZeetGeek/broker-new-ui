"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";

import { AppModal } from "@/components/shared/app-modal";
import { TriangleAlert } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const REASON_MAX = 500;

/**
 * Confirm "Mark as sold". Open deals close immediately, so the dialog says so
 * before the caller commits. Marketplace also notify representing brokers.
 * A broker exclusive listing does not — only that broker listed it.
 */
export function MarkSoldDialog({
    open,
    onOpenChange,
    propertyId,
    propertyTitle,
    portal = "owner",
    onSold,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    propertyId: string;
    propertyTitle: string;
    portal?: "owner" | "broker";
    onSold?: () => void;
}) {
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);

    function handleOpenChange(next: boolean) {
        if (busy) return;
        if (!next) setReason("");
        onOpenChange(next);
    }

    async function confirm() {
        setBusy(true);
        try {
            await propertiesApi.markSold(propertyId, reason);
            toast.success(`${propertyTitle} marked as sold`);
            setReason("");
            onOpenChange(false);
            onSold?.();
        } catch (error) {
            toast.error(
                error instanceof ApiError ? error.message : "Could not mark as sold. Try again.",
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
            title="Mark this property as sold?"
            description={propertyTitle}
            footer={
                <div className="flex flex-row flex-wrap items-center justify-end gap-2 inline-full">
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => handleOpenChange(false)}
                    >
                        Not yet
                    </Button>
                    <Button
                        type="button"
                        variant="accent"
                        disabled={busy}
                        loading={busy}
                        onClick={() => void confirm()}
                    >
                        Mark as sold
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                <div
                    className="
                  flex gap-3 rounded-inner border border-amber-300/60 bg-amber-50 p-3.5
                "
                >
                    <TriangleAlert
                        aria-hidden
                        className="mbs-0.5 shrink-0 text-pending block-5 inline-5"
                        strokeWidth={1.75}
                    />
                    <div className="flex flex-col gap-1.5 min-inline-0">
                        <p className="body-sm font-semibold text-ink">This happens right away</p>
                        <ul className="body-sm flex list-disc flex-col gap-1 ps-4 text-ink">
                            <li>Every open deal on this property is closed as lost</li>
                            {portal === "owner" ? (
                                <li>Brokers representing it get a notification</li>
                            ) : (
                                <li>The note is saved on each closed deal</li>
                            )}
                            <li>
                                {portal === "owner"
                                    ? "It stops showing to brokers looking for listings"
                                    : "The listing is marked sold"}
                            </li>
                        </ul>
                    </div>
                </div>

                <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-ink">
                        Reason <span className="font-normal text-ink-muted">(optional)</span>
                    </span>
                    <Textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value.slice(0, REASON_MAX))}
                        maxLength={REASON_MAX}
                        rows={3}
                        disabled={busy}
                        placeholder="e.g. Sold to a client I found myself"
                        className="border-2 border-border-warm bg-surface"
                    />
                    <span className="body-xs text-ink-muted">
                        {portal === "owner"
                            ? "Shared with your brokers and saved on the closed deals."
                            : "Saved on the closed deals."}{" "}
                        {reason.length}/{REASON_MAX}
                    </span>
                </label>
            </div>
        </AppModal>
    );
}
