"use client";
import * as React from "react";
import { useMemo, useState } from "react";
import { type DayButton, getDefaultClassNames, type Matcher } from "react-day-picker";

import { tz, TZDate } from "@date-fns/tz";
import { cva, type VariantProps } from "class-variance-authority";
import { addMonths, parseISO, startOfDay, startOfMonth } from "date-fns";

import { APP_TIME_ZONE } from "@/lib/datetime/timezone";
import { formatDateIn, formatDateIso } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { IconButton } from "@/components/shared/icon-button";
import {
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsUpDownIcon,
} from "@/components/shared/icons";
import { MobileActionDrawer } from "@/components/shared/mobile-action-drawer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const MONTH_OPTIONS = [
    { value: "0", label: "Jan" },
    { value: "1", label: "Feb" },
    { value: "2", label: "Mar" },
    { value: "3", label: "Apr" },
    { value: "4", label: "May" },
    { value: "5", label: "Jun" },
    { value: "6", label: "Jul" },
    { value: "7", label: "Aug" },
    { value: "8", label: "Sept" },
    { value: "9", label: "Oct" },
    { value: "10", label: "Nov" },
    { value: "11", label: "Dec" },
] as const;

const datePickerTriggerVariants = cva(
    `
      justify-between rounded-control border border-border-warm bg-surface text-control font-normal text-ink
      shadow-none transition-[border-color,box-shadow] inline-full
      hover:border-ink-subtle hover:bg-surface
      focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
      disabled:bg-surface-muted
      aria-expanded:border-ring
      aria-invalid:border-danger-mid
      aria-invalid:hover:border-danger-mid
      aria-invalid:focus-visible:ring-danger/20
    `,
    {
        variants: {
            size: {
                xs: "gap-1 px-2.5 block-control-xs",
                sm: "gap-1 px-3 block-control-sm",
                default: "gap-1.5 px-3.5 block-control-md",
                md: "gap-1.5 px-4 block-control-lg",
                lg: "gap-2 px-4 block-control-xl",
            },
        },
        defaultVariants: {
            size: "lg",
        },
    },
);

const datePickerIconVariants = cva("shrink-0 text-ink-muted", {
    variants: {
        size: {
            xs: "block-3 inline-3",
            sm: "block-3.5 inline-3.5",
            default: "block-4 inline-4",
            md: "block-4 inline-4",
            lg: "block-4.5 inline-4.5",
        },
    },
    defaultVariants: {
        size: "lg",
    },
});

const captionSelectTriggerClassName = `
  gap-1 border-0 bg-surface-muted px-2.5 text-sm font-medium text-ink shadow-none
  block-8 inline-auto min-inline-0
  hover:border-0 hover:bg-canvas
  focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-ring/30
  data-popup-open:border-0 data-popup-open:bg-canvas
  [&>span:last-child]:hidden
`;

function parseDay(value: string) {
    return parseISO(value, { in: tz(APP_TIME_ZONE) });
}

function calendarBounds(allowPast: boolean, min?: string, max?: string, value?: string | null) {
    const now = TZDate.tz(APP_TIME_ZONE);
    const fallbackStart = allowPast
        ? new TZDate(now.getFullYear() - 10, 0, 1, APP_TIME_ZONE)
        : startOfMonth(now);
    const selected = value ? parseDay(value) : undefined;
    const startMonth = startOfMonth(
        min
            ? parseDay(min)
            : allowPast && selected && selected < fallbackStart
              ? selected
              : fallbackStart,
    );
    const endMonth = startOfMonth(
        max ? parseDay(max) : new TZDate(now.getFullYear() + 20, 11, 1, APP_TIME_ZONE),
    );
    return {
        startYear: startMonth.getFullYear(),
        endYear: endMonth.getFullYear(),
        startMonth,
        endMonth,
    };
}

function DatePickerDayButton({
    className,
    day,
    modifiers,
    children,
    ...props
}: React.ComponentProps<typeof DayButton>) {
    const defaultClassNames = getDefaultClassNames();
    const ref = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    return (
        <Button
            ref={ref}
            variant="ghost"
            size="icon-xs"
            data-day={day.date.toLocaleDateString("en-IN")}
            data-selected-single={
                modifiers.selected &&
                !modifiers.range_start &&
                !modifiers.range_end &&
                !modifiers.range_middle
            }
            className={cn(
                `
                  relative isolate z-10 flex aspect-square items-center justify-center rounded-full
                  border-0 text-control leading-none font-normal text-ink shadow-none block-auto
                  inline-full min-inline-(--cell-size)
                  hover:bg-brand-soft hover:text-brand-text
                  focus-visible:ring-2 focus-visible:ring-ring/30
                  active:translate-y-0 active:scale-100
                  data-[selected-single=true]:bg-brand data-[selected-single=true]:font-medium
                  data-[selected-single=true]:text-surface
                  data-[selected-single=true]:hover:bg-brand
                  data-[selected-single=true]:hover:text-surface
                `,
                modifiers.today &&
                    !modifiers.selected &&
                    "bg-brand-soft font-medium text-brand-text",
                modifiers.outside && "text-ink-subtle/60 hover:text-ink-subtle",
                modifiers.disabled && "text-ink-muted hover:bg-transparent disabled:opacity-80",
                defaultClassNames.day,
                className,
            )}
            {...props}
            disabled={modifiers.disabled || props.disabled}
        >
            {children}
        </Button>
    );
}

function CalendarCaption({
    month,
    onMonthChange,
    startYear,
    endYear,
    startMonth,
    endMonth,
    mobile = false,
}: {
    month: Date;
    onMonthChange: (next: Date) => void;
    startYear: number;
    endYear: number;
    startMonth: Date;
    endMonth: Date;
    mobile?: boolean;
}) {
    const years = useMemo(
        () => Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i),
        [startYear, endYear],
    );

    const canGoPrev = month.getTime() > startMonth.getTime();
    const canGoNext = month.getTime() < endMonth.getTime();
    const clampMonth = (next: Date) =>
        next < startMonth ? startMonth : next > endMonth ? endMonth : next;

    if (mobile) {
        return (
            <div className="flex items-center justify-between gap-1">
                <IconButton
                    type="button"
                    size="sm"
                    disabled={!canGoPrev}
                    aria-label="Previous month"
                    onClick={() => onMonthChange(addMonths(month, -1))}
                >
                    <ChevronLeftIcon aria-hidden />
                </IconButton>
                <div className="flex items-center gap-1.5">
                    <select
                        aria-label="Month"
                        value={String(month.getMonth())}
                        className={captionSelectTriggerClassName}
                        onChange={(event) =>
                            onMonthChange(
                                clampMonth(
                                    new TZDate(
                                        month.getFullYear(),
                                        Number(event.target.value),
                                        1,
                                        APP_TIME_ZONE,
                                    ),
                                ),
                            )
                        }
                    >
                        {MONTH_OPTIONS.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={
                                    new TZDate(
                                        month.getFullYear(),
                                        Number(option.value),
                                        1,
                                        APP_TIME_ZONE,
                                    ) < startMonth ||
                                    new TZDate(
                                        month.getFullYear(),
                                        Number(option.value),
                                        1,
                                        APP_TIME_ZONE,
                                    ) > endMonth
                                }
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label="Year"
                        value={String(month.getFullYear())}
                        className={captionSelectTriggerClassName}
                        onChange={(event) =>
                            onMonthChange(
                                clampMonth(
                                    new TZDate(
                                        Number(event.target.value),
                                        month.getMonth(),
                                        1,
                                        APP_TIME_ZONE,
                                    ),
                                ),
                            )
                        }
                    >
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
                <IconButton
                    type="button"
                    size="sm"
                    disabled={!canGoNext}
                    aria-label="Next month"
                    onClick={() => onMonthChange(addMonths(month, 1))}
                >
                    <ChevronRightIcon aria-hidden />
                </IconButton>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-1">
            <IconButton
                type="button"
                size="sm"
                disabled={!canGoPrev}
                aria-label="Previous month"
                className="active:translate-y-0 active:scale-100"
                onClick={() => onMonthChange(addMonths(month, -1))}
            >
                <ChevronLeftIcon className="block-4 inline-4" />
            </IconButton>

            <div className="flex items-center gap-1.5">
                <Select
                    value={String(month.getMonth())}
                    onValueChange={(next) => {
                        if (next == null) return;
                        onMonthChange(
                            clampMonth(
                                new TZDate(month.getFullYear(), Number(next), 1, APP_TIME_ZONE),
                            ),
                        );
                    }}
                >
                    <SelectTrigger
                        size="xs"
                        aria-label="Month"
                        wrapperClassName="inline-auto"
                        className={captionSelectTriggerClassName}
                    >
                        <SelectValue>
                            {(selectedValue) =>
                                MONTH_OPTIONS.find((option) => option.value === selectedValue)
                                    ?.label ?? "Month"
                            }
                        </SelectValue>
                        <ChevronsUpDownIcon
                            aria-hidden
                            className="text-ink-muted block-3.5 inline-3.5"
                        />
                    </SelectTrigger>
                    <SelectContent align="center" className="inline-auto min-inline-28">
                        {MONTH_OPTIONS.map((option) => (
                            <SelectItem
                                key={option.value}
                                value={option.value}
                                disabled={
                                    new TZDate(
                                        month.getFullYear(),
                                        Number(option.value),
                                        1,
                                        APP_TIME_ZONE,
                                    ) < startMonth ||
                                    new TZDate(
                                        month.getFullYear(),
                                        Number(option.value),
                                        1,
                                        APP_TIME_ZONE,
                                    ) > endMonth
                                }
                            >
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={String(month.getFullYear())}
                    onValueChange={(next) => {
                        if (next == null) return;
                        onMonthChange(
                            clampMonth(
                                new TZDate(Number(next), month.getMonth(), 1, APP_TIME_ZONE),
                            ),
                        );
                    }}
                >
                    <SelectTrigger
                        size="xs"
                        aria-label="Year"
                        wrapperClassName="inline-auto"
                        className={captionSelectTriggerClassName}
                    >
                        <SelectValue />
                        <ChevronsUpDownIcon
                            aria-hidden
                            className="text-ink-muted block-3.5 inline-3.5"
                        />
                    </SelectTrigger>
                    <SelectContent
                        align="center"
                        className="inline-auto max-block-60 min-inline-24"
                    >
                        {years.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <IconButton
                type="button"
                size="sm"
                disabled={!canGoNext}
                aria-label="Next month"
                className="active:translate-y-0 active:scale-100"
                onClick={() => onMonthChange(addMonths(month, 1))}
            >
                <ChevronRightIcon className="block-4 inline-4" />
            </IconButton>
        </div>
    );
}

/**
 * Date field matching the shared control height. Value is a `yyyy-MM-dd`
 * calendar string; the trigger shows `dd/mm/yyyy` per the project date format.
 * Days before today are disabled unless `allowPast` is set (filters only).
 *
 * Compact light popover with Button nav + Select month/year. Do not re-compose
 * Popover + Button + Calendar at call sites.
 */
export function AppDatePicker({
    id,
    value,
    onChange,
    onBlur,
    placeholder = "Pick a date",
    disabled,
    invalid,
    allowPast = false,
    min,
    max,
    required = false,
    disabledDates,
    size = "lg",
    iconOnly = false,
    className,
    "aria-describedby": describedBy,
}: {
    id?: string;
    value: string | null;
    onChange: (next: string | null) => void;
    onBlur?: () => void;
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    allowPast?: boolean;
    /** Inclusive yyyy-MM-dd limits for range fields and constrained scheduling. */
    min?: string;
    max?: string;
    /** Keep a date selected when choosing the selected day again. */
    required?: boolean;
    disabledDates?: Matcher | Matcher[];
    className?: string;
    /** Compact calendar action for planner toolbars. */
    iconOnly?: boolean;
    "aria-describedby"?: string;
} & VariantProps<typeof datePickerTriggerVariants>) {
    const mobile = useMobileMenu();
    const [open, setOpen] = useState(false);
    const { startYear, endYear, startMonth, endMonth } = useMemo(
        () => calendarBounds(allowPast, min, max, value),
        [allowPast, min, max, value],
    );
    const today = startOfDay(TZDate.tz(APP_TIME_ZONE));

    const selected = value ? parseDay(value) : undefined;
    const hasValidDate = selected != null && !Number.isNaN(selected.getTime());

    const [month, setMonth] = useState<Date>(() =>
        startOfMonth(hasValidDate && selected ? selected : min ? parseDay(min) : today),
    );

    const [calendarInput, setCalendarInput] = useState({ value, open });
    if (calendarInput.value !== value || calendarInput.open !== open) {
        const shouldReset = calendarInput.value !== value || open;
        setCalendarInput({ value, open });
        if (shouldReset)
            setMonth(
                startOfMonth(hasValidDate && selected ? selected : min ? parseDay(min) : today),
            );
    }
    const visibleMonth = month < startMonth ? startMonth : month > endMonth ? endMonth : month;

    const TriggerButton = iconOnly ? IconButton : Button;
    if (mobile) {
        return (
            <MobileActionDrawer
                open={open}
                onOpenChange={setOpen}
                title="Choose date"
                trigger={
                    <TriggerButton
                        id={id}
                        type="button"
                        {...(iconOnly ? { size: "md" as const } : { variant: "outline" as const })}
                        aria-label={iconOnly ? "Jump to a date" : undefined}
                        disabled={disabled}
                        aria-invalid={invalid || undefined}
                        aria-describedby={describedBy}
                        aria-expanded={open}
                        onBlur={onBlur}
                        className={cn(
                            !iconOnly && datePickerTriggerVariants({ size }),
                            !iconOnly && !hasValidDate && "text-ink-subtle",
                            className,
                        )}
                    >
                        <span className={iconOnly ? "sr-only" : "truncate"}>
                            {hasValidDate ? formatDateIn(selected) : placeholder}
                        </span>
                        <CalendarIcon
                            aria-hidden
                            data-icon="inline-end"
                            className={datePickerIconVariants({ size })}
                        />
                    </TriggerButton>
                }
            >
                <div className="flex flex-col gap-3 p-1">
                    <CalendarCaption
                        month={visibleMonth}
                        onMonthChange={setMonth}
                        startYear={startYear}
                        endYear={endYear}
                        startMonth={startMonth}
                        endMonth={endMonth}
                        mobile
                    />
                    <Calendar
                        mode="single"
                        required={required}
                        timeZone={APP_TIME_ZONE}
                        startMonth={startMonth}
                        endMonth={endMonth}
                        month={visibleMonth}
                        onMonthChange={setMonth}
                        hideNavigation
                        disabled={[
                            ...(!allowPast ? [{ before: today }] : []),
                            ...(min ? [{ before: parseDay(min) }] : []),
                            ...(max ? [{ after: parseDay(max) }] : []),
                            ...(disabledDates
                                ? Array.isArray(disabledDates)
                                    ? disabledDates
                                    : [disabledDates]
                                : []),
                        ]}
                        selected={hasValidDate ? selected : undefined}
                        onSelect={(next: Date | undefined) => {
                            onChange(next ? formatDateIso(next) : null);
                            setOpen(false);
                        }}
                        className="bg-transparent p-0 [--cell-radius:9999px] [--cell-size:--spacing(8)]"
                        classNames={{
                            months: "relative flex flex-col",
                            month: "flex flex-col gap-3 inline-full",
                            month_caption: "hidden",
                            nav: "hidden",
                            weekdays: "flex inline-full",
                            weekday:
                                "flex-1 pb-1 text-center text-[0.7rem] font-normal text-ink-subtle select-none",
                            week: "mt-0.5 flex inline-full",
                            day: "group/day relative aspect-square p-0 text-center select-none",
                            today: "bg-transparent",
                            outside: "text-ink-subtle/60",
                            selected: "bg-transparent",
                        }}
                        components={{ DayButton: DatePickerDayButton }}
                    />
                </div>
            </MobileActionDrawer>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={
                    <TriggerButton
                        id={id}
                        type="button"
                        {...(iconOnly ? { size: "md" as const } : { variant: "outline" as const })}
                        aria-label={iconOnly ? "Jump to a date" : undefined}
                        disabled={disabled}
                        aria-invalid={invalid || undefined}
                        aria-describedby={describedBy}
                        aria-expanded={open}
                        onBlur={onBlur}
                        className={cn(
                            !iconOnly && datePickerTriggerVariants({ size }),
                            !iconOnly && !hasValidDate && "text-ink-subtle",
                            className,
                        )}
                    >
                        <span className={iconOnly ? "sr-only" : "truncate"}>
                            {hasValidDate ? formatDateIn(selected) : placeholder}
                        </span>
                        <CalendarIcon
                            aria-hidden
                            data-icon="inline-end"
                            className={datePickerIconVariants({ size })}
                        />
                    </TriggerButton>
                }
            />
            <PopoverContent
                align="start"
                sideOffset={8}
                className="
                  gap-0 overflow-visible rounded-card border border-border-warm bg-surface p-0
                  shadow-lg ring-0 inline-auto
                "
            >
                <div className="flex flex-col gap-3 p-3">
                    <CalendarCaption
                        month={visibleMonth}
                        onMonthChange={setMonth}
                        startYear={startYear}
                        endYear={endYear}
                        startMonth={startMonth}
                        endMonth={endMonth}
                    />
                    <Calendar
                        mode="single"
                        required={required}
                        timeZone={APP_TIME_ZONE}
                        startMonth={startMonth}
                        endMonth={endMonth}
                        month={visibleMonth}
                        onMonthChange={setMonth}
                        hideNavigation
                        disabled={[
                            ...(!allowPast ? [{ before: today }] : []),
                            ...(min ? [{ before: parseDay(min) }] : []),
                            ...(max ? [{ after: parseDay(max) }] : []),
                            ...(disabledDates
                                ? Array.isArray(disabledDates)
                                    ? disabledDates
                                    : [disabledDates]
                                : []),
                        ]}
                        selected={hasValidDate ? selected : undefined}
                        onSelect={(next: Date | undefined) => {
                            onChange(next ? formatDateIso(next) : null);
                            setOpen(false);
                        }}
                        autoFocus
                        className="
                          bg-transparent p-0 [--cell-radius:9999px] [--cell-size:--spacing(8)]
                        "
                        classNames={{
                            months: "relative flex flex-col",
                            month: "flex flex-col gap-3 inline-full",
                            month_caption: "hidden",
                            nav: "hidden",
                            weekdays: "flex inline-full",
                            weekday: `
                              flex-1 pb-1 text-center text-[0.7rem] font-normal text-ink-subtle
                              select-none
                            `,
                            week: "mt-0.5 flex inline-full",
                            day: "group/day relative aspect-square p-0 text-center select-none",
                            today: "bg-transparent",
                            outside: "text-ink-subtle/60",
                            selected: "bg-transparent",
                        }}
                        components={{
                            DayButton: DatePickerDayButton,
                        }}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}
