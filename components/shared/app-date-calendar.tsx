"use client";

import { type ComponentProps, useEffect, useRef, useState } from "react";
import { type DayButton, type Matcher } from "react-day-picker";

import { tz, TZDate } from "@date-fns/tz";
import { addMonths, isValid, parseISO, startOfDay, startOfMonth } from "date-fns";

import { APP_TIME_ZONE } from "@/lib/datetime/timezone";
import { formatDateIso } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { IconButton } from "@/components/shared/icon-button";
import { ChevronLeftIcon, ChevronRightIcon, ChevronsUpDownIcon } from "@/components/shared/icons";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import styles from "./app-date-calendar.module.css";

const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
];
const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
});

export function parseCalendarDate(value?: string | null) {
    if (!value) return undefined;
    const date = parseISO(value, { in: tz(APP_TIME_ZONE) });
    return isValid(date) ? date : undefined;
}

function DateCalendarDay({
    day,
    modifiers,
    className,
    children,
    ...props
}: ComponentProps<typeof DayButton>) {
    const ref = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    return (
        <button
            {...props}
            ref={ref}
            type="button"
            className={cn(className, styles.dayButton)}
            data-day={formatDateIso(day.date)}
            data-today={modifiers.today || undefined}
            data-outside={modifiers.outside || undefined}
            data-selected={modifiers.selected || undefined}
            disabled={modifiers.disabled || props.disabled}
        >
            <span>{children}</span>
        </button>
    );
}

function CalendarCaption({
    month,
    startMonth,
    endMonth,
    onMonthChange,
    mobile,
}: {
    month: Date;
    startMonth: Date;
    endMonth: Date;
    onMonthChange: (date: Date) => void;
    mobile: boolean;
}) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstYear = startMonth.getFullYear();
    const years = Array.from(
        { length: endMonth.getFullYear() - firstYear + 1 },
        (_, index) => firstYear + index,
    );
    const clampMonth = (date: Date) =>
        date < startMonth ? startMonth : date > endMonth ? endMonth : date;

    return (
        <div className={styles.caption}>
            <IconButton
                size={mobile ? "lg" : "sm"}
                aria-label="Previous month"
                disabled={month <= startMonth}
                onClick={() => onMonthChange(addMonths(month, -1))}
                className="active:translate-y-0 active:scale-100"
            >
                <ChevronLeftIcon aria-hidden className="block-4 inline-4 rtl:rotate-180" />
            </IconButton>
            <div className={styles.period}>
                <Select
                    value={String(monthIndex)}
                    onValueChange={(next) => {
                        if (next !== null)
                            onMonthChange(
                                clampMonth(new TZDate(year, Number(next), 1, APP_TIME_ZONE)),
                            );
                    }}
                >
                    <SelectTrigger
                        size="xs"
                        aria-label="Month"
                        wrapperClassName="inline-auto"
                        className={styles.periodTrigger}
                    >
                        <SelectValue>{() => MONTHS[monthIndex]}</SelectValue>
                        <ChevronsUpDownIcon aria-hidden className={styles.periodIcon} />
                    </SelectTrigger>
                    <SelectContent align="center" className="inline-auto min-inline-28">
                        {MONTHS.map((label, index) => {
                            const date = new TZDate(year, index, 1, APP_TIME_ZONE);
                            return (
                                <SelectItem
                                    key={label}
                                    value={String(index)}
                                    disabled={date < startMonth || date > endMonth}
                                >
                                    {label}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                <Select
                    value={String(year)}
                    onValueChange={(next) => {
                        if (next !== null)
                            onMonthChange(
                                clampMonth(new TZDate(Number(next), monthIndex, 1, APP_TIME_ZONE)),
                            );
                    }}
                >
                    <SelectTrigger
                        size="xs"
                        aria-label="Year"
                        wrapperClassName="inline-auto"
                        className={styles.periodTrigger}
                    >
                        <SelectValue>{() => year}</SelectValue>
                        <ChevronsUpDownIcon aria-hidden className={styles.periodIcon} />
                    </SelectTrigger>
                    <SelectContent align="center" className="inline-auto min-inline-24">
                        {years.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <IconButton
                size={mobile ? "lg" : "sm"}
                aria-label="Next month"
                disabled={month >= endMonth}
                onClick={() => onMonthChange(addMonths(month, 1))}
                className="active:translate-y-0 active:scale-100"
            >
                <ChevronRightIcon aria-hidden className="block-4 inline-4 rtl:rotate-180" />
            </IconButton>
            <span className="sr-only" aria-live="polite">
                {monthLabel.format(month)}
            </span>
        </div>
    );
}

/** Shared single-date calendar for date fields, scheduling forms and filters. */
export function AppDateCalendar({
    value,
    onChange,
    allowPast = false,
    min,
    max,
    required = false,
    disabledDates,
    autoFocus,
    weekStartsOn,
}: {
    value?: string | null;
    onChange: (date: string | null) => void;
    allowPast?: boolean;
    min?: string;
    max?: string;
    required?: boolean;
    disabledDates?: Matcher | Matcher[];
    autoFocus?: boolean;
    weekStartsOn?: ComponentProps<typeof Calendar>["weekStartsOn"];
}) {
    const mobile = useMobileMenu();
    const today = startOfDay(TZDate.tz(APP_TIME_ZONE));
    const selected = parseCalendarDate(value);
    const minDay = parseCalendarDate(min);
    const maxDay = parseCalendarDate(max);
    const fallbackStart = allowPast
        ? new TZDate(today.getFullYear() - 10, 0, 1, APP_TIME_ZONE)
        : today;
    const firstMonth = startOfMonth(
        minDay ?? (allowPast && selected && selected < fallbackStart ? selected : fallbackStart),
    );
    const endMonth = startOfMonth(
        maxDay ?? new TZDate(today.getFullYear() + 20, 11, 1, APP_TIME_ZONE),
    );
    const startMonth = firstMonth > endMonth ? endMonth : firstMonth;

    const [page, setPage] = useState<{ value: typeof value; month: Date }>();
    const month =
        page && page.value === value ? page.month : startOfMonth(selected ?? minDay ?? today);
    const visibleMonth = month < startMonth ? startMonth : month > endMonth ? endMonth : month;
    const changeMonth = (next: Date) => setPage({ value, month: next });

    return (
        <div className={styles.calendar} data-mobile={mobile || undefined}>
            <CalendarCaption
                mobile={mobile}
                month={visibleMonth}
                startMonth={startMonth}
                endMonth={endMonth}
                onMonthChange={changeMonth}
            />
            <Calendar
                mode="single"
                required={required}
                timeZone={APP_TIME_ZONE}
                weekStartsOn={weekStartsOn}
                startMonth={startMonth}
                endMonth={endMonth}
                month={visibleMonth}
                onMonthChange={changeMonth}
                hideNavigation
                fixedWeeks={mobile}
                disabled={[
                    ...(!allowPast ? [{ before: today }] : []),
                    ...(minDay ? [{ before: minDay }] : []),
                    ...(maxDay ? [{ after: maxDay }] : []),
                    ...(Array.isArray(disabledDates)
                        ? disabledDates
                        : disabledDates
                          ? [disabledDates]
                          : []),
                ]}
                selected={selected}
                onSelect={(day: Date | undefined) => onChange(day ? formatDateIso(day) : null)}
                autoFocus={autoFocus}
                className="bg-transparent p-0 inline-full"
                classNames={{
                    months: "inline-full",
                    month: "inline-full",
                    month_caption: "sr-only",
                    month_grid: styles.grid,
                    weekdays: "",
                    weekday: styles.weekday,
                    week: "",
                    day: styles.day,
                    disabled: "",
                    hidden: "invisible",
                }}
                components={{ DayButton: DateCalendarDay }}
            />
        </div>
    );
}
