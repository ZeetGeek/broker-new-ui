"use client";

import { type CSSProperties, type Ref, useId, useState } from "react";

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { cn } from "@/lib/utils";
import { VISITS_TIME_ZONE } from "@/lib/visits/constants";

import { TimePicker, TimePickerColumns, TimePickerPanel } from "@/components/reui/time-picker";
import { CalendarClock } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Compact field opening the calendar and time columns together. OK commits the choice. */
export function AppDateTimePicker({
    id,
    value,
    onChange,
    onBlur,
    ref,
    min,
    max,
    minuteStep = 1,
    timeOptional = false,
    clearable = false,
    disabled = false,
    invalid,
    error,
    className,
    "aria-label": label = "Date and time (IST)",
    "aria-describedby": describedBy,
}: {
    id?: string;
    /** yyyy-MM-ddTHH:mm in IST, without a UTC conversion at the field boundary. */
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    ref?: Ref<HTMLButtonElement>;
    min?: string;
    max?: string;
    minuteStep?: number;
    timeOptional?: boolean;
    clearable?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    error?: string;
    className?: string;
    "aria-label"?: string;
    "aria-describedby"?: string;
}) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(value);
    const changeOpen = (next: boolean) => {
        if (next) setDraft(value);
        else onBlur?.();
        setOpen(next);
    };
    const [date = "", time = ""] = draft.split("T");
    const [savedDate = "", savedTime = ""] = value.split("T");
    const savedDay = savedDate
        ? fromZonedTime(`${savedDate}T12:00:00`, VISITS_TIME_ZONE)
        : undefined;
    const summary =
        savedDay && !Number.isNaN(savedDay.getTime())
            ? `${formatInTimeZone(savedDay, VISITS_TIME_ZONE, "dd/MM/yyyy")}${savedTime ? ` at ${savedTime}` : ""}`
            : "";
    const selected = date ? fromZonedTime(`${date}T12:00:00`, VISITS_TIME_ZONE) : undefined;
    const validDate = selected && !Number.isNaN(selected.getTime()) ? selected : undefined;
    const minDate = min?.slice(0, 10);
    const maxDate = max?.slice(0, 10);
    const calendarDisabled = disabled
        ? true
        : [
              ...(minDate
                  ? [{ before: fromZonedTime(`${minDate}T00:00:00`, VISITS_TIME_ZONE) }]
                  : []),
              ...(maxDate
                  ? [{ after: fromZonedTime(`${maxDate}T23:59:59`, VISITS_TIME_ZONE) }]
                  : []),
          ];
    const description =
        [describedBy, error ? `${fieldId}-error` : null].filter(Boolean).join(" ") || undefined;
    const canConfirm =
        (!draft && clearable) ||
        !!(validDate && (time || timeOptional) && (!min || draft >= min) && (!max || draft <= max));

    return (
        <div className={cn("min-inline-0", className)}>
            <Popover open={open} onOpenChange={changeOpen}>
                <PopoverTrigger
                    render={
                        <Button
                            id={fieldId}
                            ref={ref}
                            type="button"
                            variant="outline"
                            size="lg"
                            disabled={disabled}
                            aria-label={summary ? `${label}: ${summary}` : label}
                            aria-describedby={description}
                            aria-invalid={invalid || !!error || undefined}
                            onBlur={onBlur}
                            className={cn(
                                "justify-between border-border-warm bg-surface font-normal text-ink shadow-none inline-full",
                                !summary && "text-ink-subtle",
                            )}
                        />
                    }
                >
                    <span className="truncate tabular-nums">
                        {summary ||
                            (timeOptional ? "Select due date and time" : "Select date and time")}
                    </span>
                    <CalendarClock
                        aria-hidden="true"
                        className="shrink-0 text-ink-muted block-4.5 inline-4.5"
                    />
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    role="dialog"
                    aria-label={label}
                    className="@container gap-0 overflow-y-auto p-0 inline-[min(34rem,calc(100vw-1.5rem))] max-block-[min(80dvh,var(--available-height))]"
                >
                    <div className="flex flex-col items-center gap-4 p-3 @[32rem]:flex-row @[32rem]:items-start">
                        <Calendar
                            key={date || "empty"}
                            mode="single"
                            required
                            weekStartsOn={1}
                            timeZone={VISITS_TIME_ZONE}
                            selected={validDate}
                            defaultMonth={validDate}
                            disabled={calendarDisabled}
                            onSelect={(next) => {
                                if (next) {
                                    const nextDate = formatInTimeZone(
                                        next,
                                        VISITS_TIME_ZONE,
                                        "yyyy-MM-dd",
                                    );
                                    const nextTime =
                                        time ||
                                        (timeOptional
                                            ? ""
                                            : nextDate === minDate
                                              ? min?.slice(11, 16) || "09:00"
                                              : "09:00");
                                    setDraft(`${nextDate}T${nextTime}`);
                                }
                            }}
                            className="bg-transparent p-0 inline-full max-inline-77 min-inline-0 [&_button]:aspect-auto [&_button]:min-inline-0! [&_table]:table-fixed [&_td]:min-inline-0"
                            style={
                                {
                                    "--cell-size":
                                        "clamp(1.75rem, calc((100cqi - 1.5rem) / 7), 2.75rem)",
                                } as CSSProperties
                            }
                        />
                        <div className="flex justify-center self-stretch border-bs border-border-warm pbs-3 @[32rem]:border-s @[32rem]:border-bs-0 @[32rem]:ps-3 @[32rem]:pbs-0">
                            <TimePicker
                                aria-label={`${label}: time`}
                                value={time || null}
                                onValueChange={(next) => {
                                    if (next) {
                                        const today = formatInTimeZone(
                                            new Date(),
                                            VISITS_TIME_ZONE,
                                            "yyyy-MM-dd",
                                        );
                                        const day =
                                            date ||
                                            (minDate && today < minDate
                                                ? minDate
                                                : maxDate && today > maxDate
                                                  ? maxDate
                                                  : today);
                                        setDraft(`${day}T${next}`);
                                    }
                                }}
                                minuteStep={minuteStep}
                                disabled={disabled}
                                min={date === minDate ? min?.slice(11, 16) : undefined}
                                max={date === maxDate ? max?.slice(11, 16) : undefined}
                            >
                                <TimePickerPanel className="[--time-picker-rows:5] @[32rem]:[--time-picker-rows:7]">
                                    <TimePickerColumns />
                                </TimePickerPanel>
                            </TimePicker>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-bs border-border-warm px-3 py-2">
                        <p role="status" className="body-sm flex-1 text-ink-muted min-inline-0">
                            {validDate
                                ? `${formatInTimeZone(validDate, VISITS_TIME_ZONE, "EEE, d MMM yyyy")}${time ? ` at ${time}` : timeOptional ? " · No time set" : " · Choose a time"}`
                                : "Choose a date and time"}
                        </p>
                        {timeOptional && time && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={disabled}
                                onClick={() => setDraft(`${date}T`)}
                            >
                                Remove time
                            </Button>
                        )}
                        {clearable && draft && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={disabled}
                                onClick={() => setDraft("")}
                            >
                                Clear
                            </Button>
                        )}
                        <Button
                            type="button"
                            size="sm"
                            disabled={disabled || !canConfirm}
                            onClick={() => {
                                onChange(draft);
                                changeOpen(false);
                            }}
                        >
                            OK
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            {error && (
                <p id={`${fieldId}-error`} role="alert" className="body-xs mbs-1.5 text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
