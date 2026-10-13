"use client";

import { addDays, startOfWeek } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { VISITS_TIME_ZONE } from "@/lib/visits/constants";
import { istDateKey, istDayAsDate } from "@/lib/visits/time";

import { Button } from "@/components/ui/button";

export function WeekStrip({
    anchorDay,
    selectedDay,
    counts,
    onSelectDay,
    onShiftWeek,
    onToday,
}: {
    anchorDay: string;
    selectedDay: string;
    counts: Map<string, number>;
    onSelectDay: (day: string) => void;
    onShiftWeek: (delta: number) => void;
    onToday: () => void;
}) {
    const todayKey = istDateKey(new Date());
    // Monday-first — common for Indian business weeks.
    const weekStart = startOfWeek(istDayAsDate(anchorDay), { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    const monthLabel = formatInTimeZone(istDayAsDate(selectedDay), VISITS_TIME_ZONE, "MMMM yyyy");

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="body-sm font-semibold text-ink">{monthLabel}</p>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-md"
                        aria-label="Previous week"
                        onClick={() => onShiftWeek(-1)}
                    >
                        <ChevronLeft aria-hidden />
                    </Button>
                    <Button type="button" variant="surface" size="md" onClick={onToday}>
                        Today
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-md"
                        aria-label="Next week"
                        onClick={() => onShiftWeek(1)}
                    >
                        <ChevronRight aria-hidden />
                    </Button>
                </div>
            </div>

            <div
                role="listbox"
                aria-label="Jump to day"
                className="grid grid-cols-7 gap-1 rounded-card border border-border-warm bg-surface p-1.5"
            >
                {days.map((date) => {
                    const key = istDateKey(date);
                    const selected = selectedDay === key;
                    const isToday = key === todayKey;
                    const count = counts.get(key) ?? 0;
                    return (
                        <button
                            key={key}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => onSelectDay(key)}
                            className={cn(
                                "flex flex-col items-center gap-0.5 rounded-control px-1 py-2 transition-[background-color,color] duration-160 outline-none focus-visible:ring-3 focus-visible:ring-brand/25",
                                selected
                                    ? "bg-brand-ink text-surface"
                                    : isToday
                                      ? "text-brand-text hover:bg-brand-soft"
                                      : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                            )}
                        >
                            <span className="body-xs font-medium">
                                {formatInTimeZone(date, VISITS_TIME_ZONE, "EEE")}
                            </span>
                            <span className="body-sm tabular-nums font-bold">
                                {formatInTimeZone(date, VISITS_TIME_ZONE, "d")}
                            </span>
                            <span
                                className={cn(
                                    "rounded-full block-1 inline-1",
                                    count > 0
                                        ? selected
                                            ? "bg-highlight"
                                            : "bg-brand"
                                        : "bg-transparent",
                                )}
                                aria-hidden
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
