"use client";

import { memo } from "react";

import { Check, Clock3, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { getSlotVisualState } from "@/lib/visits/status";
import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import type { VisitSlot } from "@/features/site-visits/broker/model";

export const SlotChip = memo(function SlotChip({
    slot,
    propertyName,
    onBook,
    onOpenVisit,
    onOpenRequest,
}: {
    slot: VisitSlot;
    propertyName: string;
    onBook: (slot: VisitSlot) => void;
    onOpenVisit: (id: string) => void;
    onOpenRequest: () => void;
}) {
    const state = getSlotVisualState(slot);
    const spots = Math.max(0, slot.capacity - slot.bookedCount);
    const blocked = state === "full" || state === "too-soon" || state === "cancelled";
    const stateText = state === "last" ? "1 spot left" : state === "booked" ? `booked by you for ${slot.bookedBuyerName ?? "your buyer"}` : state === "requested" ? "requested by you" : state === "full" ? "full" : state === "too-soon" ? "too soon to book because visits need 60 minutes notice" : state === "cancelled" ? "cancelled by owner" : `${spots} spots left`;
    const Icon = state === "booked" ? Check : state === "requested" ? Clock3 : state === "cancelled" ? X : state === "too-soon" ? Info : null;

    const activate = () => {
        if (state === "booked" && slot.bookedVisitId) onOpenVisit(slot.bookedVisitId);
        else if (state === "requested") onOpenRequest();
        else if (!blocked) onBook(slot);
    };

    return (
        <button
            type="button"
            data-slot-chip
            aria-disabled={blocked || undefined}
            aria-label={`${blocked ? "Unavailable" : "Book"} ${formatVisitTime(slot.startsAt)} to ${formatVisitTime(slot.endsAt)}, ${formatVisitDate(slot.startsAt)}, ${stateText}, ${propertyName}`}
            title={state === "too-soon" ? "Visits need at least 60 minutes notice" : `${formatVisitTime(slot.startsAt)}–${formatVisitTime(slot.endsAt)} · ${stateText}${slot.note ? ` · ${slot.note}` : ""}`}
            onClick={activate}
            className={cn(
                `
                  t-slot-chip tabular flex shrink-0 touch-manipulation items-center gap-1.5
                  rounded-control border px-3 py-2 text-sm font-bold
                  transition-[background-color,color,transform] duration-160 outline-none
                  min-block-11
                  focus-visible:ring-3 focus-visible:ring-brand/30
                  active:not-aria-disabled:scale-[0.98]
                `,
                state === "available" && "border-brand bg-brand text-surface hover:bg-brand/90",
                state === "last" && `
                  border-pending bg-urgent-soft text-pending
                  hover:bg-urgent-soft/70
                `,
                state === "booked" && "border-brand-ink bg-brand-ink text-surface",
                state === "requested" && "border-dashed border-brand bg-surface text-brand-text",
                (state === "full" || state === "too-soon" || state === "cancelled") && `
                  cursor-not-allowed border-border-warm bg-surface-muted text-ink-muted
                `,
            )}
        >
            {Icon ? <Icon aria-hidden className="block-3.5 inline-3.5" /> : null}
            <span className={cn((state === "full" || state === "cancelled") && "line-through")}>{formatVisitTime(slot.startsAt)}</span>
            {state === "last" ? <span className="text-[10px]">· 1 left</span> : null}
            {state === "booked" ? <span className="truncate text-[10px] max-inline-16">{slot.bookedBuyerName?.split(" ")[0]}</span> : null}
            {state === "full" ? <span className="text-[10px] no-underline">Full</span> : null}
            {state === "requested" ? <span className="text-[10px]">Asked</span> : null}
            {state === "too-soon" ? <span className="text-[10px]">Too soon</span> : null}
            {state === "cancelled" ? <span className="text-[10px] no-underline">Cancelled</span> : null}
        </button>
    );
});
