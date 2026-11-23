"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { Matcher } from "react-day-picker";

import { startOfDay } from "date-fns";

import { cn } from "@/lib/utils";

import { DateInput } from "@/components/shared/date-input";
import { Check, ChevronDown, ChevronUpIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export type AppDateRange = {
    from: Date;
    to: Date;
};

export type AppDateRangePreset = {
    value: string;
    label: string;
    /** Fills the draft calendar when this preset is chosen (before Update). */
    resolve: () => AppDateRange;
};

export type AppDateRangePickerProps = {
    /**
     * Committed range. `from` may be null for open-ended periods (e.g. all time);
     * the draft then starts as today→today until a preset or pick sets bounds.
     */
    value: { from: Date | null; to: Date };
    /**
     * Optional trigger prefix — e.g. "Last 12 months". When omitted, the
     * trigger shows only the formatted dates (package default).
     */
    triggerLabel?: string;
    /** Fires on Update when the draft differs from the opened values. */
    onUpdate: (next: {
        range: AppDateRange;
        rangeCompare?: AppDateRange;
        /** Set when Update is pressed with a preset still selected. */
        preset?: string | null;
    }) => void;

    /**
     * Show the preset column. Ignored when `sidebar` is passed — a custom
     * sidebar always shows.
     */
    showSidebar?: boolean;
    presets?: ReadonlyArray<AppDateRangePreset>;
    /** Committed preset id — restores highlight when the popover opens. */
    activePreset?: string | null;
    /** Full preset-column replacement. */
    sidebar?: ReactNode;
    sidebarAriaLabel?: string;

    /** Compare toggle + second date row. Default false. */
    showCompare?: boolean;
    initialCompare?: AppDateRange | null;

    align?: "start" | "center" | "end";
    /** Display locale for the trigger. Default `en-IN`. */
    locale?: string;
    maxDate?: Date | null;
    minDate?: Date | null;
    disabledDates?: Matcher | Matcher[];
    className?: string;
    triggerClassName?: string;
};

function formatTriggerDate(date: Date, locale: string): string {
    return date.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function sameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function rangesEqual(a?: AppDateRange | null, b?: AppDateRange | null): boolean {
    if (!a || !b) return a === b;
    return sameDay(a.from, b.from) && sameDay(a.to, b.to);
}

/** Leftmost month shown for a dual (or single) month grid ending near `to`. */
function visibleMonthFor(range: AppDateRange, monthsShown: number): Date {
    return new Date(range.to.getFullYear(), range.to.getMonth() - (monthsShown - 1), 1);
}

/**
 * Shared shadcn-style date range picker (johnpolacek layout):
 * compare toggle + manual date fields, dual calendar, preset sidebar, Cancel / Update.
 *
 * Domain presets stay in the feature — pass them via `presets` / `sidebar`.
 */
export function AppDateRangePicker({
    value,
    triggerLabel,
    onUpdate,
    showSidebar = true,
    presets,
    activePreset = null,
    sidebar,
    sidebarAriaLabel = "Quick periods",
    showCompare = false,
    initialCompare = null,
    align = "end",
    locale = "en-IN",
    maxDate,
    minDate,
    disabledDates,
    className,
    triggerClassName,
}: AppDateRangePickerProps) {
    const compareId = useId();
    const today = startOfDay(new Date());
    const upperBound = maxDate === undefined ? today : maxDate;

    const committed: AppDateRange = {
        from: value.from ? startOfDay(value.from) : today,
        to: startOfDay(value.to),
    };

    const [open, setOpen] = useState(false);
    const [range, setRange] = useState<AppDateRange>(committed);
    const [rangeCompare, setRangeCompare] = useState<AppDateRange | undefined>(
        initialCompare ?? undefined,
    );
    const [selectedPreset, setSelectedPreset] = useState<string | undefined>(
        activePreset ?? undefined,
    );
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const monthsShown = isSmallScreen ? 1 : 2;
    const [month, setMonth] = useState<Date>(() => visibleMonthFor(committed, 2));

    const openedRangeRef = useRef<AppDateRange>(committed);
    const openedCompareRef = useRef<AppDateRange | undefined>(undefined);
    const openedPresetRef = useRef<string | undefined>(activePreset ?? undefined);

    const hasSidebar = Boolean(sidebar) || (showSidebar && (presets?.length ?? 0) > 0);

    useEffect(() => {
        const onResize = () => setIsSmallScreen(window.innerWidth < 960);
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    function syncFromCommitted() {
        const next = {
            from: value.from ? startOfDay(value.from) : today,
            to: startOfDay(value.to),
        };
        const shown = isSmallScreen ? 1 : 2;
        setRange(next);
        setRangeCompare(initialCompare ?? undefined);
        setSelectedPreset(activePreset ?? undefined);
        setMonth(visibleMonthFor(next, shown));
        openedRangeRef.current = next;
        openedCompareRef.current = initialCompare ?? undefined;
        openedPresetRef.current = activePreset ?? undefined;
    }

    function handleOpenChange(next: boolean) {
        if (next) {
            syncFromCommitted();
            setOpen(true);
            return;
        }
        syncFromCommitted();
        setOpen(false);
    }

    function applyPreset(presetValue: string) {
        const preset = presets?.find((p) => p.value === presetValue);
        if (!preset) return;
        const resolved = preset.resolve();
        const next = {
            from: startOfDay(resolved.from),
            to: startOfDay(resolved.to),
        };
        setRange(next);
        setSelectedPreset(presetValue);
        setMonth(visibleMonthFor(next, monthsShown));
        if (rangeCompare) {
            setRangeCompare({
                from: new Date(
                    next.from.getFullYear() - 1,
                    next.from.getMonth(),
                    next.from.getDate(),
                ),
                to: new Date(next.to.getFullYear() - 1, next.to.getMonth(), next.to.getDate()),
            });
        }
    }

    function setDraftRange(next: AppDateRange) {
        setRange(next);
        setSelectedPreset(undefined);
        setMonth(visibleMonthFor(next, monthsShown));
    }

    function handleCancel() {
        syncFromCommitted();
        setOpen(false);
    }

    function handleUpdate() {
        setOpen(false);
        const changed =
            !rangesEqual(range, openedRangeRef.current) ||
            !rangesEqual(rangeCompare, openedCompareRef.current) ||
            selectedPreset !== openedPresetRef.current;
        if (!changed) return;
        onUpdate({
            range,
            rangeCompare,
            preset: selectedPreset ?? null,
        });
    }

    const disabled: Matcher[] = [];
    if (upperBound) disabled.push({ after: upperBound });
    if (minDate) disabled.push({ before: minDate });
    if (disabledDates) {
        if (Array.isArray(disabledDates)) disabled.push(...disabledDates);
        else disabled.push(disabledDates);
    }

    const displayRange = open ? range : committed;
    const triggerDates = `${formatTriggerDate(displayRange.from, locale)}${
        displayRange.to ? ` - ${formatTriggerDate(displayRange.to, locale)}` : ""
    }`;

    const presetSelectItems = presets?.map((p) => ({ value: p.value, label: p.label })) ?? [];

    const presetList =
        hasSidebar && !sidebar && presets ? (
            <div
                role="listbox"
                aria-label={sidebarAriaLabel}
                className="
                  flex shrink-0 flex-col gap-1.5 self-start border-border-warm
                  max-md:border-bs max-md:p-3
                  md:border-s md:py-4 md:ps-2 md:pe-3 md:min-inline-40
                "
            >
                {presets.map((preset) => {
                    const selected = selectedPreset === preset.value;
                    return (
                        <Button
                            key={preset.value}
                            type="button"
                            variant="ghost"
                            size="sm"
                            role="option"
                            aria-selected={selected}
                            className={cn(
                                "justify-start gap-2 p-2.5 font-normal",
                                selected &&
                                    "bg-brand-soft font-medium text-brand-text hover:bg-brand-soft",
                            )}
                            onClick={() => applyPreset(preset.value)}
                        >
                            {selected ? (
                                <Check aria-hidden className="shrink-0 block-4 inline-4" />
                            ) : null}
                            <span className="truncate">{preset.label}</span>
                        </Button>
                    );
                })}
            </div>
        ) : null;

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger
                render={
                    <Button
                        type="button"
                        variant="outline"
                        size="md"
                        aria-expanded={open}
                        aria-label={
                            triggerLabel
                                ? `Period: ${triggerLabel}, ${triggerDates}. Change period`
                                : `Period: ${triggerDates}. Change period`
                        }
                        className={cn(
                            `
                              justify-between gap-2 rounded-control border border-border-warm bg-surface
                              px-3.5 font-normal text-ink shadow-none
                              hover:border-ink-subtle hover:bg-surface
                              aria-expanded:border-ring
                              max-sm:inline-full
                            `,
                            triggerClassName,
                        )}
                    >
                        <span className="flex flex-col items-start gap-0.5 text-start min-inline-0">
                            {triggerLabel ? (
                                <span className="flex items-center gap-2 min-inline-0">
                                    <span className="font-medium">{triggerLabel}</span>
                                    <span className="truncate font-semibold text-ink-muted max-sm:hidden">
                                        · {triggerDates}
                                    </span>
                                </span>
                            ) : (
                                <span className="font-semibold">{triggerDates}</span>
                            )}
                            {open && rangeCompare ? (
                                <span className="body-xs text-ink-muted">
                                    vs. {formatTriggerDate(rangeCompare.from, locale)}
                                    {rangeCompare.to
                                        ? ` - ${formatTriggerDate(rangeCompare.to, locale)}`
                                        : ""}
                                </span>
                            ) : null}
                        </span>
                        <span className="shrink-0 text-ink-muted">
                            {open ? (
                                <ChevronUpIcon aria-hidden className="block-4 inline-4" />
                            ) : (
                                <ChevronDown aria-hidden className="block-4 inline-4" />
                            )}
                        </span>
                    </Button>
                }
            />
            <PopoverContent
                align={align}
                sideOffset={8}
                className={cn(
                    // PopoverContent defaults to inline-72 — override so two months + presets fit.
                    `
                      gap-0 overflow-hidden rounded-card border border-border-warm
                      bg-surface p-0 shadow-lg ring-0
                      inline-auto max-block-[min(var(--available-height),calc(100dvh-2rem))] max-inline-[calc(100vw-1.5rem)]
                      max-sm:inline-[calc(100vw-1.5rem)]
                    `,
                    className,
                )}
            >
                <div className="flex flex-col overflow-auto overscroll-contain min-block-0 md:flex-row md:items-start">
                    <div className="flex flex-col min-inline-0 max-sm:inline-full">
                        <div
                            className={cn(
                                "flex flex-wrap items-center gap-3 px-3 pbs-4 pbe-3 sm:px-5",
                                showCompare ? "justify-between" : "justify-start",
                            )}
                        >
                            {showCompare ? (
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id={compareId}
                                        size="sm"
                                        checked={Boolean(rangeCompare)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setRangeCompare({
                                                    from: new Date(
                                                        range.from.getFullYear() - 1,
                                                        range.from.getMonth(),
                                                        range.from.getDate(),
                                                    ),
                                                    to: new Date(
                                                        range.to.getFullYear() - 1,
                                                        range.to.getMonth(),
                                                        range.to.getDate(),
                                                    ),
                                                });
                                            } else {
                                                setRangeCompare(undefined);
                                            }
                                        }}
                                    />
                                    <Label htmlFor={compareId} className="body-sm font-medium">
                                        Compare
                                    </Label>
                                </div>
                            ) : null}
                            <div className="flex flex-col gap-2.5 min-inline-0">
                                <div className="flex flex-col items-start gap-2.5 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center">
                                    <DateInput
                                        value={range.from}
                                        onChange={(date) => {
                                            const to =
                                                !range.to || date > range.to ? date : range.to;
                                            setDraftRange({ from: date, to });
                                        }}
                                    />
                                    <span className="body-sm text-ink-muted" aria-hidden>
                                        to
                                    </span>
                                    <DateInput
                                        value={range.to}
                                        onChange={(date) => {
                                            const from = date < range.from ? date : range.from;
                                            setDraftRange({ from, to: date });
                                        }}
                                    />
                                </div>
                                {rangeCompare ? (
                                    <div className="flex flex-col items-start gap-2.5 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center">
                                        <DateInput
                                            value={rangeCompare.from}
                                            onChange={(date) => {
                                                const to =
                                                    !rangeCompare.to || date > rangeCompare.to
                                                        ? date
                                                        : rangeCompare.to;
                                                setRangeCompare({ from: date, to });
                                            }}
                                        />
                                        <span className="body-sm text-ink-muted" aria-hidden>
                                            to
                                        </span>
                                        <DateInput
                                            value={rangeCompare.to}
                                            onChange={(date) => {
                                                const from =
                                                    date < rangeCompare.from
                                                        ? date
                                                        : rangeCompare.from;
                                                setRangeCompare({ from, to: date });
                                            }}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {hasSidebar && isSmallScreen && presets && !sidebar ? (
                            <div className="px-3 pbe-3 sm:px-5">
                                <Select
                                    items={presetSelectItems}
                                    value={selectedPreset ?? null}
                                    onValueChange={(next) => {
                                        if (next) applyPreset(next);
                                    }}
                                >
                                    <SelectTrigger
                                        className="inline-full"
                                        aria-label={sidebarAriaLabel}
                                    >
                                        <SelectValue placeholder="Select period…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {presets.map((preset) => (
                                            <SelectItem key={preset.value} value={preset.value}>
                                                {preset.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null}

                        <Calendar
                            mode="range"
                            selected={range}
                            onSelect={(next) => {
                                if (next?.from) {
                                    setDraftRange({
                                        from: next.from,
                                        to: next.to ?? next.from,
                                    });
                                }
                            }}
                            month={month}
                            onMonthChange={setMonth}
                            numberOfMonths={monthsShown}
                            disabled={disabled.length ? disabled : undefined}
                            endMonth={upperBound ?? undefined}
                            startMonth={minDate ?? undefined}
                            className="
                              bg-transparent px-3 pbs-1 pbe-3 [--cell-size:min(--spacing(11),calc((100vw-3rem)/7))]
                              inline-full
                              max-sm:**:data-[slot=button]:min-inline-0 sm:px-5
                              sm:[--cell-size:--spacing(12)]
                              sm:inline-fit [&_table]:flex
                              [&_table]:flex-col [&_tbody]:flex [&_tbody]:flex-col
                              [&_tbody]:gap-3 [&_tbody_tr]:flex [&_tbody_tr]:inline-full
                              [&_thead]:block [&_thead_tr]:flex
                              [&_thead_tr]:inline-full
                            "
                            classNames={{
                                months: "relative flex flex-col gap-6 sm:flex-row sm:gap-8",
                                month: "flex flex-col gap-3.5 inline-full sm:inline-fit",
                                month_caption:
                                    "flex items-center justify-center px-(--cell-size) block-10 inline-full",
                                caption_label: "text-[15px] font-semibold text-ink",
                                // RDP renders <table> > <tbody class=weeks> > <tr class=week>.
                                // Gap must sit on `weeks` (tbody) — table rows ignore margin.
                                month_grid: "flex w-full flex-col",
                                weeks: "flex flex-col gap-3",
                                weekdays: "mb-2 flex w-full",
                                weekday: `
                                  flex-1 rounded-(--cell-radius) text-xs font-medium
                                  text-ink-muted select-none
                                `,
                                week: "flex w-full",
                            }}
                        />
                    </div>

                    {hasSidebar && !isSmallScreen ? (
                        sidebar ? (
                            <div className="shrink-0 self-start border-border-warm p-3 max-md:border-bs md:border-s md:ps-2 md:pe-3">
                                {sidebar}
                            </div>
                        ) : (
                            presetList
                        )
                    ) : null}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 border-bs border-border-warm px-4 py-2.5">
                    <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button type="button" variant="accent" size="sm" onClick={handleUpdate}>
                        Update
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
