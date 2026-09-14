"use client";

import { memo } from "react";

import { Check, Clock3, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { getSlotVisualState } from "@/lib/visits/status";
import { formatVisitA11yDate, formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

import type { VisitSlot } from "@/features/site-visits/broker/model";

export const SlotChip = memo(function SlotChip({ slot, propertyName, canBook, onBook, onOpenVisit, onOpenRequest, tabIndex }: {
    slot: VisitSlot;
    propertyName: string;
    canBook: boolean;
    onBook: (slot: VisitSlot) => void;
    onOpenVisit: (id: string) => void;
    onOpenRequest: () => void;
    tabIndex?: number;
}) {
    const state = getSlotVisualState(slot);
    const spots = Math.max(0, slot.capacity - slot.bookedCount);
    const permissionBlocked = !canBook && state !== "booked" && state !== "requested";
    const blocked = state === "full" || state === "too-soon" || state === "cancelled" || permissionBlocked;
    const stateText = permissionBlocked ? "owner approval is required before booking" : state === "last" ? "1 spot left" : state === "booked" ? `booked by you for ${slot.bookedBuyerName ?? "your buyer"}` : state === "requested" ? "requested by you" : state === "full" ? "full" : state === "too-soon" ? "too soon to book because visits need 60 minutes notice" : state === "cancelled" ? "cancelled by owner" : `${spots} spots left`;
    const Icon = state === "booked" ? Check : state === "requested" ? Clock3 : state === "cancelled" ? X : state === "too-soon" || permissionBlocked ? Info : null;

    const activate = () => {
        if (state === "booked" && slot.bookedVisitId) onOpenVisit(slot.bookedVisitId);
        else if (state === "requested") onOpenRequest();
        else if (!blocked) onBook(slot);
    };

    const chip = <button
        type="button"
        data-slot-chip
        tabIndex={tabIndex}
        aria-disabled={blocked || undefined}
        aria-label={`${blocked ? "Unavailable" : "Book"} ${formatVisitTime(slot.startsAt)} to ${formatVisitTime(slot.endsAt)}, ${formatVisitA11yDate(slot.startsAt)}, ${stateText}, ${propertyName}`}
        onClick={(event) => {
            if (event.detail === 0 || window.matchMedia("(hover: none)").matches) {
                event.preventDefault();
                activate();
            }
        }}
        className={cn(
            `
              t-slot-chip tabular flex shrink-0 touch-manipulation items-center gap-1.5
              rounded-control border p-3 text-sm font-bold
              transition-[background-color,color,transform] duration-160 outline-none min-block-12
              focus-visible:ring-3 focus-visible:ring-brand/30
              active:not-aria-disabled:scale-[0.98]
              sm:py-2 sm:min-block-11
            `,
            state === "available" && !permissionBlocked && `
              border-brand bg-brand text-surface
              hover:bg-brand/90
            `,
            state === "last" && !permissionBlocked && `
              border-pending bg-urgent-soft text-pending
              hover:bg-urgent-soft/70
            `,
            state === "booked" && "border-brand-ink bg-brand-ink text-surface",
            state === "requested" && "border-dashed border-brand bg-surface text-brand-text",
            (state === "full" || state === "too-soon" || state === "cancelled" || permissionBlocked) && `
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
        {permissionBlocked ? <span className="text-[10px]">Approval needed</span> : null}
    </button>;

    return (
        <Popover>
            <PopoverTrigger openOnHover delay={180} closeDelay={120} render={chip} />
            <PopoverContent side="top" align="start" className="hidden gap-3 p-3 inline-64 sm:flex">
                <PopoverHeader>
                    <PopoverTitle className="body-sm font-bold text-ink">{formatVisitTime(slot.startsAt)} to {formatVisitTime(slot.endsAt)}</PopoverTitle>
                    <PopoverDescription className="body-xs text-ink-muted">{formatVisitDate(slot.startsAt)} · {propertyName}</PopoverDescription>
                </PopoverHeader>
                <div className="body-xs space-y-1 text-ink-muted"><p>{stateText}</p>{slot.note ? <p>Owner note: {slot.note}</p> : null}</div>
                <Button type="button" size="md" onClick={activate} disabled={blocked}>{state === "booked" ? "View visit" : state === "requested" ? "View request" : permissionBlocked ? "Approval needed" : "Book this time"}</Button>
            </PopoverContent>
        </Popover>
    );
});
