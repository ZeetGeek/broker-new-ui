"use client";

import type { KeyboardEvent } from "react";

import { formatInTimeZone } from "date-fns-tz";

import { VISITS_TIME_ZONE } from "@/lib/visits/constants";

import type { VisitSlot } from "@/features/site-visits/broker/model";
import { SlotChip } from "@/features/site-visits/broker/open-slots/slot-chip";

export function SlotRail({
    slots,
    propertyName,
    onBook,
    onOpenVisit,
    onRequest,
}: {
    slots: VisitSlot[];
    propertyName: string;
    onBook: (slot: VisitSlot) => void;
    onOpenVisit: (id: string) => void;
    onRequest: () => void;
}) {
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (!["ArrowLeft", "ArrowRight", "Escape", "b", "B"].includes(event.key)) return;
        const chips = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-slot-chip]")];
        const current = chips.indexOf(document.activeElement as HTMLButtonElement);
        if (event.key === "Escape") {
            (event.currentTarget.closest("article") as HTMLElement | null)?.focus();
            return;
        }
        if ((event.key === "b" || event.key === "B") && current >= 0) {
            chips[current].click();
            return;
        }
        if (current < 0) return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        chips[(current + direction + chips.length) % chips.length]?.focus();
    };

    return (
        <div className="relative min-inline-0">
            <div className="
              pointer-events-none absolute inset-y-0 inset-e-0 z-10 bg-linear-to-l from-surface
              to-transparent inline-8
            " aria-hidden />
            <div className="flex scrollbar-none items-center gap-2 overflow-x-auto pe-8" onKeyDown={onKeyDown}>
                {slots.map((slot) => <SlotChip key={slot.id} slot={slot} propertyName={propertyName} onBook={onBook} onOpenVisit={onOpenVisit} onOpenRequest={onRequest} />)}
                <button type="button" onClick={onRequest} className="
                  body-xs shrink-0 rounded-control border border-dashed border-brand/45
                  bg-brand-soft/35 px-3 font-bold text-brand-text min-block-11
                  hover:bg-brand-soft
                  focus-visible:ring-3 focus-visible:ring-brand/25
                ">+ Request another time</button>
            </div>
            <span className="sr-only">Slots for {formatInTimeZone(slots[0]?.startsAt ?? new Date(), VISITS_TIME_ZONE, "EEEE d MMMM")}</span>
        </div>
    );
}

