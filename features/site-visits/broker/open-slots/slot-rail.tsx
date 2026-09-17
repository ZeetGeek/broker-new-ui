"use client";

import { type KeyboardEvent, useState } from "react";

import { formatInTimeZone } from "date-fns-tz";

import { VISITS_TIME_ZONE } from "@/lib/visits/constants";

import type { VisitSlot } from "@/features/site-visits/broker/model";
import { SlotChip } from "@/features/site-visits/broker/open-slots/slot-chip";

export function SlotRail({
    slots,
    propertyName,
    canBook,
    onBook,
    onOpenVisit,
    onRequest,
}: {
    slots: VisitSlot[];
    propertyName: string;
    canBook: (slot: VisitSlot) => boolean;
    onBook: (slot: VisitSlot) => void;
    onOpenVisit: (id: string) => void;
    onRequest: () => void;
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (!["ArrowLeft", "ArrowRight", "Escape", "b", "B"].includes(event.key)) return;
        const chips = [
            ...event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-slot-chip]"),
        ];
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
        const next = (current + direction + chips.length) % chips.length;
        setActiveIndex(next);
        chips[next]?.focus();
    };

    return (
        <div className="relative min-inline-0">
            <div
                className="flex scrollbar-none items-center gap-2 overflow-x-auto pe-4"
                onKeyDown={onKeyDown}
                onFocusCapture={(event) => {
                    const chips = [
                        ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
                            "[data-slot-chip]",
                        ),
                    ];
                    const index =
                        event.target instanceof HTMLButtonElement
                            ? chips.indexOf(event.target)
                            : -1;
                    if (index >= 0) setActiveIndex(index);
                }}
            >
                {slots.map((slot, index) => (
                    <SlotChip
                        key={slot.id}
                        slot={slot}
                        propertyName={propertyName}
                        canBook={canBook(slot)}
                        onBook={onBook}
                        onOpenVisit={onOpenVisit}
                        onOpenRequest={onRequest}
                        tabIndex={index === activeIndex ? 0 : -1}
                    />
                ))}
            </div>
            <span className="sr-only">
                Slots for{" "}
                {formatInTimeZone(
                    slots[0]?.startsAt ?? new Date(),
                    VISITS_TIME_ZONE,
                    "EEEE d MMMM",
                )}
            </span>
        </div>
    );
}
