"use client";

import { useId, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { MAX_CHARS } from "@/lib/validation/text-limits";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import toast from "@/components/shared/app-toast";
import { CharacterCount } from "@/components/shared/character-count";
import { Info } from "@/components/shared/icons";
import { Textarea } from "@/components/ui/textarea";

const REASON_MAX = MAX_CHARS.markSoldReason;

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
    const reasonId = useId();
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const isOwner = portal === "owner";

    const changes = isOwner
        ? [
              "Brokers selling it for you are told right away",
              "Any buyers still in progress on it are marked as lost",
              "It leaves the listings brokers browse",
          ]
        : ["Any buyers still in progress on it are marked as lost"];

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
                <AppModalFooter
                    className="flex flex-row flex-wrap items-center justify-end gap-2 inline-full"
                    secondaryLabel="Not yet"
                    secondaryVariant="ghost"
                    secondaryDisabled={busy}
                    onSecondary={() => handleOpenChange(false)}
                    primaryLabel="Mark as sold"
                    primaryType="button"
                    primaryVariant="accent"
                    primaryDisabled={busy}
                    primaryLoading={busy}
                    onPrimary={() => void confirm()}
                />
            }
        >
            <div className="flex flex-col gap-4">
                <div className="flex gap-3 rounded-inner border border-border-warm bg-canvas p-3.5">
                    <Info
                        aria-hidden
                        className="mbs-0.5 shrink-0 text-brand block-5 inline-5"
                        strokeWidth={1.75}
                    />
                    <div className="flex flex-col gap-1.5 min-inline-0">
                        <p className="body-sm font-semibold text-ink">This can&apos;t be undone</p>
                        <ul className="body-sm flex list-disc flex-col gap-1 ps-4 text-ink">
                            {changes.map((line) => (
                                <li key={line}>{line}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor={reasonId} className="text-sm font-semibold text-ink">
                        Reason <span className="font-normal text-ink-muted">(optional)</span>
                    </label>
                    <Textarea
                        id={reasonId}
                        aria-describedby={`${reasonId}-count`}
                        value={reason}
                        onChange={(event) => setReason(event.target.value.slice(0, REASON_MAX))}
                        maxLength={REASON_MAX}
                        rows={3}
                        disabled={busy}
                        placeholder="e.g. Sold to a client I found myself"
                        className="border-2 border-border-warm bg-surface"
                    />
                    <CharacterCount
                        id={`${reasonId}-count`}
                        value={reason}
                        maxChars={REASON_MAX}
                        hint={
                            isOwner
                                ? "Shared with your brokers and saved on those contacts."
                                : "Saved on those contacts."
                        }
                    />
                </div>
            </div>
        </AppModal>
    );
}
