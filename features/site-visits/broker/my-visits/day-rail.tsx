"use client";

import { addDays, subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    const today = istDayAsDate(new Date());
    const days = Array.from({ length: 14 }, (_, index) => past ? subDays(today, index) : addDays(today, index));

    return (
        <aside className="md:sticky md:inset-bs-4 md:self-start">
            <div className="mbe-2 hidden items-center justify-between md:flex">
                <Button type="button" variant="ghost" size="xs" aria-label="Previous month"><ChevronLeft aria-hidden /></Button>
                <span className="body-xs font-semibold text-ink">{formatInTimeZone(days[0], VISITS_TIME_ZONE, "MMM yyyy")}</span>
                <Button type="button" variant="ghost" size="xs" aria-label="Next month"><ChevronRight aria-hidden /></Button>
            </div>

            <div className="
              flex snap-x scrollbar-none gap-2 overflow-x-auto pbe-2
              md:flex-col md:gap-1 md:overflow-visible md:pbe-0
            ">
                {days.map((date, index) => {
                    const key = istDateKey(date);
                    const count = counts.get(key) ?? 0;
                    const selected = activeDay === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onSelect(key)}
                            className={cn(
                                `
                                  flex snap-start items-center justify-between gap-2 rounded-control
                                  px-3 py-2 text-start transition-colors outline-none min-block-14
                                  min-inline-[76px]
                                  focus-visible:ring-3 focus-visible:ring-brand/25
                                  md:inline-full md:min-inline-0
                                `,
                                selected ? "bg-brand-ink text-surface" : `
                                  bg-surface text-ink
                                  hover:bg-brand-soft
                                `,
                                count === 0 && !selected && "text-ink-subtle",
                            )}
                        >
                            <span>
                                <span className="block text-[11px] font-medium">{!past && index === 0 ? "Today" : formatInTimeZone(date, VISITS_TIME_ZONE, "EEE")}</span>
                                <span className="body-sm tabular block font-bold">{formatInTimeZone(date, VISITS_TIME_ZONE, "d MMM")}</span>
                            </span>
                            <span className={cn(`
                              tabular grid place-items-center rounded-full bg-surface-muted
                              text-[10px] text-ink-muted block-5 min-inline-5
                            `, selected && `bg-surface/15 text-surface`)}>{count}</span>
                        </button>
                    );
                })}
            </div>
            <button type="button" onClick={onTogglePast} className="
              body-xs mbs-2 hidden py-2 text-center font-semibold text-brand-text inline-full
              hover:underline
              md:block
            ">
                {past ? "Upcoming visits" : "Past visits"}
            </button>
        </aside>
    );
}

