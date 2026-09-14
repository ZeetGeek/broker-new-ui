"use client";

import { useState } from "react";

import { addDays, addMonths, subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarDays, ChevronLeft, ChevronRight, History } from "lucide-react";

import { cn } from "@/lib/utils";
import { VISITS_TIME_ZONE } from "@/lib/visits/constants";
import { istDateKey, istDayAsDate } from "@/lib/visits/time";

import { Button } from "@/components/ui/button";

export function DayRail({
    counts,
    activeDay,
    past,
    onSelect,
    onTogglePast,
}: {
    counts: Map<string, number>;
    activeDay: string;
    past: boolean;
    onSelect: (day: string) => void;
    onTogglePast: () => void;
}) {
    const [monthOffset, setMonthOffset] = useState(0);
    const today = istDayAsDate(new Date());
    const rangeStart = addMonths(today, monthOffset);
    const days = Array.from({ length: 14 }, (_, index) => past ? subDays(rangeStart, index) : addDays(rangeStart, index));

    return (
        <section aria-label="Choose visit date" className="rounded-card border border-border-warm bg-surface p-2 shadow-sm">
            <div className="flex items-center justify-between gap-2 px-1 pbe-2">
                <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon-md" aria-label="Previous month" onClick={() => setMonthOffset((value) => value - 1)}>
                        <ChevronLeft aria-hidden />
                    </Button>
                    <span className="body-sm flex items-center gap-2 font-semibold text-ink min-inline-24">
                        <CalendarDays aria-hidden className="text-brand block-4 inline-4" strokeWidth={1.75} />
                        {formatInTimeZone(days[0], VISITS_TIME_ZONE, "MMM yyyy")}
                    </span>
                    <Button type="button" variant="ghost" size="icon-md" aria-label="Next month" onClick={() => setMonthOffset((value) => value + 1)}>
                        <ChevronRight aria-hidden />
                    </Button>
                </div>
                <Button type="button" variant="ghost" size="md" onClick={onTogglePast}>
                    <History aria-hidden />
                    {past ? "Upcoming" : "Past visits"}
                </Button>
            </div>

            <div className="flex snap-x scrollbar-none gap-2 overflow-x-auto">
                {days.map((date, index) => {
                    const key = istDateKey(date);
                    const count = counts.get(key) ?? 0;
                    const selected = activeDay === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onSelect(key)}
                            aria-pressed={selected}
                            className={cn(
                                "flex snap-start flex-col items-start justify-center rounded-control border px-3 text-start transition-[background-color,border-color,color] duration-160 outline-none block-16 min-inline-20 focus-visible:ring-3 focus-visible:ring-brand/25",
                                selected
                                    ? "border-brand-ink bg-brand-ink text-surface"
                                    : "border-border-warm bg-surface text-ink hover:border-ink/25 hover:bg-surface-muted",
                                count === 0 && !selected && "text-ink-subtle",
                            )}
                        >
                            <span className="body-xs font-medium">{!past && index === 0 && monthOffset === 0 ? "Today" : formatInTimeZone(date, VISITS_TIME_ZONE, "EEE")}</span>
                            <span className="body-sm tabular-nums font-bold">{formatInTimeZone(date, VISITS_TIME_ZONE, "d MMM")}</span>
                            <span className={cn("body-xs tabular-nums", selected ? "text-surface/70" : "text-ink-muted")}>
                                {count === 0 ? "No visits" : `${count} ${count === 1 ? "visit" : "visits"}`}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
