"use client";

import { useState } from "react";

import { formatDateIso, formatTime24 } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { AppDatePicker } from "@/components/shared/app-date-picker";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    DAY_SLOT_TIMES,
    isExpiredSlot,
    label12,
} from "@/features/owner-visits/availability-helpers";

export function AddTimeDialog({
    open,
    onOpenChange,
    propertyLabel,
    selectedDate,
    onDateChange,
    openTimes,
    bookedTimes,
    togglingTime,
    onToggleTime,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    propertyLabel: string;
    selectedDate: string;
    onDateChange: (next: string) => void;
    openTimes: Set<string>;
    bookedTimes: Set<string>;
    togglingTime: string | null;
    onToggleTime: (time: string) => void;
}) {
    const todayIso = formatDateIso(new Date());
    const nowTime = formatTime24(new Date());
    const [draftDate, setDraftDate] = useState(selectedDate);
    const dateIso = selectedDate || draftDate || todayIso;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup className="max-inline-lg">
                <DialogHeader>
                    <DialogTitle>Add visiting times</DialogTitle>
                    <DialogDescription>
                        Pick a date, then tap times to open or close them for {propertyLabel}. Slots
                        run 8:00 AM–8:00 PM every 30 minutes.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <span className="body-sm font-semibold text-ink">Date</span>
                        <AppDatePicker
                            value={dateIso}
                            onChange={(next) => {
                                const value = next ?? todayIso;
                                setDraftDate(value);
                                onDateChange(value);
                            }}
                            size="lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="body-sm text-ink-muted">
                            Tap a time to open it. Tap again to remove. Booked times stay locked.
                        </p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {DAY_SLOT_TIMES.map((time) => {
                                const expired = isExpiredSlot(dateIso, time, todayIso, nowTime);
                                const booked = bookedTimes.has(time);
                                const openSlot = openTimes.has(time) || booked;
                                const busy = togglingTime === time;
                                return (
                                    <button
                                        key={time}
                                        type="button"
                                        disabled={expired || booked || busy}
                                        onClick={() => onToggleTime(time)}
                                        className={cn(
                                            `
                                              body-sm rounded-control border px-2 py-2.5 text-center
                                              font-semibold tabular-nums transition-colors
                                              duration-160
                                            `,
                                            expired
                                                ? `
                                                  cursor-not-allowed border-border-warm
                                                  bg-surface-muted text-ink-subtle
                                                `
                                                : booked
                                                  ? `
                                                    cursor-not-allowed border-ink/15
                                                    bg-surface-muted text-ink-muted
                                                  `
                                                  : openSlot
                                                    ? `
                                                      border-brand/40 bg-brand-soft text-brand-text
                                                    `
                                                    : `
                                                      border-border-warm bg-surface text-ink
                                                      hover:border-ink/25
                                                    `,
                                            busy && "opacity-60",
                                        )}
                                    >
                                        {label12(time)}
                                        {booked ? (
                                            <span className="body-xs mbs-0.5 block font-medium">
                                                Booked
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Done
                        </Button>
                    </div>
                </div>
            </DialogPopup>
        </Dialog>
    );
}
