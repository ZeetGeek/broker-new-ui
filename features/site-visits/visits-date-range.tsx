"use client";

import { useState } from "react";

import { formatDateIso, formatDateShort } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { AppDateRangeFields } from "@/components/shared/app-date-range-fields";
import { CalendarRange } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** `YYYY-MM-DD` → Date, or undefined for "". */
function parseKey(key: string): Date | undefined {
    if (!key) return undefined;
    const [y, m, d] = key.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
}

/**
 * Whether the calendar picks one day or a window.
 *
 * Two separate questions a broker asks — "what is on Thursday" and "what
 * does next week look like" — and a range picker answers the first one
 * badly: it takes two clicks to say one day, and a mis-aimed second click
 * silently widens the answer.
 */
type PickMode = "single" | "range";

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
 * Deliberately not bounded to the week on screen: the strip covers that
 * already. This is how a broker answers "what does the rest of the month
 * look like", which is the question the strip cannot.
 *
 * Single-day choices update immediately. Ranges use separate start/end
 * inputs and apply only once both dates form a valid window.
 */
export function VisitsDateRange({ dateFrom, dateTo, onChange }: VisitsDateRangeProps) {
    const [open, setOpen] = useState(false);

    const from = parseKey(dateFrom);
    const to = parseKey(dateTo);
    const hasRange = Boolean(from || to);

    /** Whether the filter as it stands spans more than one day. */
    const isRangeFilter = Boolean(dateFrom && dateTo && dateFrom !== dateTo);

    const [mode, setMode] = useState<PickMode>(isRangeFilter ? "range" : "single");

    const [draftRange, setDraftRange] = useState({ from: dateFrom, to: dateTo });
    const validRange = !!(draftRange.from && draftRange.to && draftRange.from <= draftRange.to);

    /**
     * Switching mode keeps the day the user already picked.
     *
     * Going range → single collapses the window to its start rather than
     * clearing: the start is the day they chose first, and dropping the
     * filter entirely would make the toggle feel like a reset button.
     */
    const handleModeChange = (next: PickMode) => {
        setMode(next);
        if (next === "range") setDraftRange({ from: dateFrom, to: dateTo });
        if (next === "single" && dateFrom && dateFrom !== dateTo) {
            onChange({ dateFrom, dateTo: dateFrom });
        }
    };

    const handleSelectSingle = (day: Date | undefined) => {
        const key = day ? formatDateIso(day) : "";
        onChange({ dateFrom: key, dateTo: key });
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
            <Popover
                open={open}
                // Opening re-reads the filter so the calendar shows the
                // selection the way it was made. The filter also moves from
                // outside this component — the week strip writes the same two
                // fields — so the mode cannot be settled once at mount.
                onOpenChange={(next) => {
                    if (next) {
                        setMode(isRangeFilter ? "range" : "single");
                        setDraftRange({ from: dateFrom, to: dateTo });
                    }
                    setOpen(next);
                }}
            >
                <PopoverTrigger
                    render={
                        <button
                            type="button"
                            className={cn(
                                `
                                  body-sm flex shrink-0 items-center gap-2 rounded-control border
                                  px-3 py-1.5 transition-colors duration-160
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

                <PopoverContent
                    align="end"
                    className={cn(
                        "p-0 inline-auto",
                        mode === "range" && "inline-[min(32rem,calc(100vw-1.5rem))]",
                    )}
                >
                    <div
                        role="group"
                        aria-label="How to pick dates"
                        className="flex gap-1 border-be border-border-warm p-2"
                    >
                        <ModeButton
                            isActive={mode === "single"}
                            onClick={() => handleModeChange("single")}
                        >
                            Single date
                        </ModeButton>
                        <ModeButton
                            isActive={mode === "range"}
                            onClick={() => handleModeChange("range")}
                        >
                            Date range
                        </ModeButton>
                    </div>

                    {mode === "single" ? (
                        <Calendar
                            mode="single"
                            autoFocus
                            selected={from}
                            onSelect={handleSelectSingle}
                            defaultMonth={from ?? new Date()}
                            numberOfMonths={1}
                        />
                    ) : (
                        <AppDateRangeFields
                            className="p-3"
                            from={draftRange.from}
                            to={draftRange.to}
                            onChange={setDraftRange}
                        />
                    )}

                    {mode === "range" ? (
                        <div className="flex justify-end gap-2 border-bs border-border-warm p-2">
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => {
                                    setDraftRange({ from: "", to: "" });
                                    onChange({ dateFrom: "", dateTo: "" });
                                }}
                            >
                                Clear selection
                            </Button>
                            <Button
                                size="sm"
                                disabled={!validRange}
                                onClick={() => {
                                    if (!validRange) return;
                                    onChange({ dateFrom: draftRange.from, dateTo: draftRange.to });
                                    setOpen(false);
                                }}
                            >
                                Apply range
                            </Button>
                        </div>
                    ) : null}
                </PopoverContent>
            </Popover>
        </div>
    );
}

function ModeButton({
    isActive,
    onClick,
    children,
}: {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={isActive}
            onClick={onClick}
            className={cn(
                `
                  body-sm flex-1 rounded-md border px-3 py-1 font-medium transition-colors
                  duration-160
                `,
                isActive
                    ? "border-brand-ink bg-brand-ink text-white"
                    : "border-border-warm bg-surface text-ink hover:bg-surface-muted",
            )}
        >
            {children}
        </button>
    );
}
