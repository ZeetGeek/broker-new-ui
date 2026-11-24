"use client";

import { useId, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { representativeApi } from "@/lib/api/representative";
import { MAX_CHARS } from "@/lib/validation/text-limits";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import toast from "@/components/shared/app-toast";
import { CharacterCount } from "@/components/shared/character-count";
import { TriangleAlert } from "@/components/shared/icons";
import { Textarea } from "@/components/ui/textarea";

const REASON_MAX = MAX_CHARS.endRepresentationReason;

export type CancelRepresentationSide = "broker" | "owner";

/**
 * Strong confirm for ending an accepted representation. Cancel is immediate —
 * no approval from the other side — so the dialog spells out what is lost.
 */
export function CancelRepresentationDialog({
    open,
    onOpenChange,
    representationId,
    side,
    propertyTitle,
    counterpartName,
    onCancelled,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    representationId: string;
    /** Which side is cancelling. */
    side: CancelRepresentationSide;
    propertyTitle: string;
    /** The owner (broker side) or the broker (owner side). */
    counterpartName: string;
    onCancelled?: () => void;
}) {
    const reasonId = useId();
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const isBroker = side === "broker";

    function handleOpenChange(next: boolean) {
        if (busy) return;
        if (!next) setReason("");
        onOpenChange(next);
    }

    async function confirm() {
        setBusy(true);
        try {
            await representativeApi.cancel(representationId, reason);
            toast.success(
                isBroker
                    ? `You stopped selling ${propertyTitle}`
                    : `${counterpartName} no longer represents ${propertyTitle}`,
            );
            setReason("");
            onOpenChange(false);
            onCancelled?.();
        } catch (error) {
            toast.error(error instanceof ApiError ? error.message : "Could not cancel. Try again.");
        } finally {
            setBusy(false);
        }
    }

    const losses = isBroker
        ? [
              `${counterpartName}'s phone number and the chat on this deal`,
              "Every open deal on this property — each one is closed as lost with your reason in its note",
              "The card leaves your Representing tab",
          ]
        : [
              `${counterpartName}'s access to your phone number and the chat on this deal`,
              "Every open deal this broker has on the property — closed as lost with your reason in the note",
          ];

    return (
        <AppModal
            open={open}
            onOpenChange={handleOpenChange}
            size="sm"
            title={isBroker ? "Stop selling this property?" : "Remove this broker?"}
            description={
                isBroker
                    ? `You will stop representing ${propertyTitle}. This happens right away — the owner does not need to approve it.`
                    : `${counterpartName} will stop representing ${propertyTitle}. This happens right away.`
            }
            footer={
                <AppModalFooter
                    className="flex flex-row flex-wrap items-center justify-end gap-2 inline-full"
                    secondaryLabel={isBroker ? "Keep representing" : "Keep broker"}
                    secondaryVariant="ghost"
                    secondaryDisabled={busy}
                    onSecondary={() => handleOpenChange(false)}
                    primaryLabel={isBroker ? "Stop selling" : "Remove broker"}
                    primaryType="button"
                    primaryVariant="destructive"
                    primaryDisabled={busy}
                    primaryLoading={busy}
                    onPrimary={() => void confirm()}
                />
            }
        >
            <div className="flex flex-col gap-4">
                <div
                    className="
                  flex gap-3 rounded-inner border border-danger/30 bg-danger-soft p-3.5
                "
                >
                    <TriangleAlert
                        aria-hidden
                        className="mbs-0.5 shrink-0 text-danger block-5 inline-5"
                        strokeWidth={1.75}
                    />
                    <div className="flex flex-col gap-1.5 min-inline-0">
                        <p className="body-sm font-semibold text-danger">You will lose</p>
                        <ul className="body-sm flex list-disc flex-col gap-1 ps-4 text-ink">
                            {losses.map((line) => (
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
                        placeholder={
                            isBroker ? "e.g. Owner is not responding" : "e.g. Found a buyer myself"
                        }
                        className="border-2 border-border-warm bg-surface"
                    />
                    <CharacterCount
                        id={`${reasonId}-count`}
                        value={reason}
                        maxChars={REASON_MAX}
                        hint={`Shared with ${isBroker ? "the owner" : "the broker"} and saved on the lost deals.`}
                    />
                </div>
            </div>
        </AppModal>
    );
}
