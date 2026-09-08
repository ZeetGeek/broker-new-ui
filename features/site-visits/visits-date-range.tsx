"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { CalendarRange, X } from "lucide-react";

import { formatDateIso, formatDateShort } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Local midnight, so a picked day is compared as a calendar day. */
function startOfDay(date: Date): Date {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
}

function addDays(date: Date, days: number): Date {
    const next = startOfDay(date);
    next.setDate(next.getDate() + days);
    return next;
}

/** `YYYY-MM-DD` → Date, or undefined for "". */
function parseKey(key: string): Date | undefined {
    if (!key) return undefined;
    const [y, m, d] = key.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
}

type Preset = {
    label: string;
    /** Inclusive window, as local dates. */
    build: (now: Date) => { from: Date; to: Date };
};

/**
 * The windows a broker actually asks for. Offered as one tap each because
 * "this week" via two calendar clicks is four decisions instead of one.
 */
const PRESETS: Preset[] = [
    { label: "Today", build: (now) => ({ from: startOfDay(now), to: startOfDay(now) }) },
    { label: "Tomorrow", build: (now) => ({ from: addDays(now, 1), to: addDays(now, 1) }) },
    { label: "Next 7 days", build: (now) => ({ from: startOfDay(now), to: addDays(now, 6) }) },
    { label: "Next 30 days", build: (now) => ({ from: startOfDay(now), to: addDays(now, 29) }) },
];

type VisitsDateRangeProps = {
    dateFrom: string;
    dateTo: string;
    onChange: (next: { dateFrom: string; dateTo: string }) => void;
};

/**
 * The date window filter.
 *
 * Writes the same two fields the week strip does, so the strip and this
 * control can never disagree about what is on screen — picking a range here
 * retracts the strip's pill, and tapping a strip day collapses the range to
 * that one day.
 *
 * Deliberately not bounded to the next seven days: the strip covers that
 * already. This is how a broker answers "what does the rest of the month
 * look like", which is the question the strip cannot.
 */
export function VisitsDateRange({ dateFrom, dateTo, onChange }: VisitsDateRangeProps) {
    const [open, setOpen] = useState(false);

    const from = parseKey(dateFrom);
    const to = parseKey(dateTo);
    const hasRange = Boolean(from || to);

    const selected: DateRange | undefined = from || to ? { from, to } : undefined;

    const handleSelect = (range: DateRange | undefined) => {
        // react-day-picker reports the in-progress selection too, so the
        // first click arrives as `{ from }` with no `to`. Writing both ends
        // from `from` keeps the list showing that single day mid-pick rather
        // than everything, which is what the click looked like it did.
        const nextFrom = range?.from ? formatDateIso(range.from) : "";
        const nextTo = range?.to ? formatDateIso(range.to) : nextFrom;
        onChange({ dateFrom: nextFrom, dateTo: nextTo });

        // Close only once the window is complete, so the calendar stays open
        // for the second click.
        if (range?.from && range?.to) setOpen(false);
    };

    const label = (() => {
        if (!from && !to) return "Any date";
        if (from && to) {
            return formatDateIso(from) === formatDateIso(to)
                ? formatDateShort(from)
                : `${formatDateShort(from)} – ${formatDateShort(to)}`;
        }
        return formatDateShort((from ?? to) as Date);
    })();

    return (
        <div className="flex items-center gap-1">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                    render={
                        <button
                            type="button"
                            className={cn(
                                `
                                  body-sm flex shrink-0 items-center gap-2 rounded-full border px-3
                                  py-1.5 transition-colors duration-160
                                `,
                                hasRange
                                    ? "border-brand-ink bg-brand-ink text-white"
                                    : "border-border-warm bg-surface text-ink hover:border-ink/25",
                            )}
                        >
                            <CalendarRange className="block-4 inline-4" strokeWidth={1.75} />
                            {label}
                        </button>
                    }
                />

                <PopoverContent align="end" className="p-0 inline-auto">
                    <div className="flex flex-wrap gap-1 border-be border-border-warm p-2">
                        {PRESETS.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const { from: f, to: t } = preset.build(new Date());
                                    onChange({
                                        dateFrom: formatDateIso(f),
                                        dateTo: formatDateIso(t),
                                    });
                                    setOpen(false);
                                }}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>

                    <Calendar
                        mode="range"
                        autoFocus
                        selected={selected}
                        onSelect={handleSelect}
                        defaultMonth={from ?? new Date()}
                        numberOfMonths={1}
                    />
                </PopoverContent>
            </Popover>

            {/* Clearing is its own control rather than a third state on the
                chip — a broker who wants every date back should not have to
                guess that tapping the label again does it. */}
            {hasRange ? (
                <button
                    type="button"
                    aria-label="Clear the date filter"
                    onClick={() => onChange({ dateFrom: "", dateTo: "" })}
                    className="
                      flex shrink-0 items-center justify-center rounded-full text-ink-subtle
                      transition-colors duration-160 block-7 inline-7
                      hover:bg-surface-muted hover:text-ink
                    "
                >
                    <X className="block-4 inline-4" strokeWidth={1.75} />
                </button>
            ) : null}
        </div>
    );
}
