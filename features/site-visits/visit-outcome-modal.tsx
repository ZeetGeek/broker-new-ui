"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";

import type { VisitCancelReason, VisitItem, VisitOutcome } from "@/features/site-visits/types";
import { VISIT_CANCEL_REASON_LABEL, VISIT_OUTCOME_META } from "@/features/site-visits/visit-meta";

const OUTCOME_ORDER: VisitOutcome[] = [
    "made_offer",
    "interested",
    "wants_second_visit",
    "not_interested",
];

const CANCEL_ORDER: VisitCancelReason[] = [
    "buyer_unavailable",
    "owner_unavailable",
    "property_unavailable",
    "rescheduled",
    "weather",
    "other",
];

const CHOICE_CLASS = `
  body-sm flex items-center gap-3 rounded-inner border px-4 py-3 text-start
  transition-colors duration-160
`;

type VisitOutcomeModalProps = {
    visit: VisitItem | null;
    open: boolean;
    isBusy: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (visitId: string, outcome: VisitOutcome) => void;
};

/**
 * "How did it go?" — asked once, right after a visit, with four answers and no
 * free text. A broker on a phone between showings will tap a chip; they will
 * not type a paragraph, and a required textarea is how outcome capture dies.
 */
export function VisitOutcomeModal({
    visit,
    open,
    isBusy,
    onOpenChange,
    onSubmit,
}: VisitOutcomeModalProps) {
    const [selected, setSelected] = useState<VisitOutcome | null>(null);

    if (!visit) return null;

    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (!next) setSelected(null);
                onOpenChange(next);
            }}
            size="sm"
            title="How did it go?"
            description={`${visit.property.configLabel} in ${visit.property.locality}${
                visit.buyer ? ` with ${visit.buyer.name}` : ""
            }.`}
            footer={
                <AppModalFooter
                    primaryLabel="Save"
                    primaryDisabled={selected == null || isBusy}
                    onPrimary={() => selected && onSubmit(visit.id, selected)}
                    secondaryLabel="Not now"
                    onSecondary={() => onOpenChange(false)}
                />
            }
        >
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Visit outcome">
                {OUTCOME_ORDER.map((outcome) => {
                    const meta = VISIT_OUTCOME_META[outcome];
                    const Icon = meta.icon;
                    const isActive = selected === outcome;

                    return (
                        <button
                            key={outcome}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            onClick={() => setSelected(outcome)}
                            className={cn(
                                CHOICE_CLASS,
                                isActive
                                    ? "border-brand bg-brand-soft text-brand-text"
                                    : "border-border-warm bg-surface text-ink hover:border-ink/25",
                            )}
                        >
                            <Icon aria-hidden className="shrink-0 block-4 inline-4" />
                            {meta.label}
                        </button>
                    );
                })}
            </div>
        </AppModal>
    );
}

type VisitCancelModalProps = {
    visit: VisitItem | null;
    open: boolean;
    isBusy: boolean;
    /** "cancel" ends a confirmed visit; "decline" refuses a proposal. */
    intent: "cancel" | "decline" | "withdraw";
    onOpenChange: (open: boolean) => void;
    onSubmit: (visitId: string, reason: VisitCancelReason) => void;
};

const INTENT_COPY: Record<
    VisitCancelModalProps["intent"],
    { title: string; description: string; primary: string }
> = {
    cancel: {
        title: "Cancel this visit",
        description:
            "The other side is told straight away. Tell them why so the next one lands better.",
        primary: "Cancel visit",
    },
    decline: {
        title: "Cannot do this time",
        description: "The broker is told, and can suggest another slot.",
        primary: "Send reply",
    },
    withdraw: {
        title: "Withdraw this request",
        description: "The owner will no longer see this request.",
        primary: "Withdraw",
    },
};

/**
 * A reason is required, not optional. "Cancelled" with no reason is the
 * message that damages the relationship — the whole point of the two-party
 * loop is that each side knows where it stands.
 */
export function VisitCancelModal({
    visit,
    open,
    isBusy,
    intent,
    onOpenChange,
    onSubmit,
}: VisitCancelModalProps) {
    const [selected, setSelected] = useState<VisitCancelReason | null>(null);

    if (!visit) return null;

    const copy = INTENT_COPY[intent];

    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (!next) setSelected(null);
                onOpenChange(next);
            }}
            size="sm"
            title={copy.title}
            description={copy.description}
            footer={
                <AppModalFooter
                    primaryLabel={copy.primary}
                    primaryDisabled={selected == null || isBusy}
                    onPrimary={() => selected && onSubmit(visit.id, selected)}
                    secondaryLabel="Keep it"
                    onSecondary={() => onOpenChange(false)}
                />
            }
        >
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Reason">
                {CANCEL_ORDER.map((reason) => {
                    const isActive = selected === reason;

                    return (
                        <button
                            key={reason}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            onClick={() => setSelected(reason)}
                            className={cn(
                                CHOICE_CLASS,
                                isActive
                                    ? "border-brand bg-brand-soft text-brand-text"
                                    : "border-border-warm bg-surface text-ink hover:border-ink/25",
                            )}
                        >
                            {VISIT_CANCEL_REASON_LABEL[reason]}
                        </button>
                    );
                })}
            </div>
        </AppModal>
    );
}
