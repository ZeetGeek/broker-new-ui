"use client";

import { useState } from "react";

import { formatVisitDate, istDateKey } from "@/lib/visits/time";

import { CalendarDays, ChevronDown } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import styles from "./visits.module.css";

/** IST date picker limited to `[minDate, maxDate]` (YYYY-MM-DD). */
export function VisitDatePicker({
    id,
    value,
    onChange,
    minDate,
    maxDate,
    error,
    disabled = false,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    minDate: string;
    maxDate: string;
    error?: string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const selected = value ? new Date(`${value}T12:00:00+05:30`) : undefined;
    return (
        <div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                    render={
                        <Button
                            id={id}
                            type="button"
                            disabled={disabled}
                            variant="outline"
                            size="lg"
                            className={`${styles.dateTrigger} shadow-none hover:border-ring/50 hover:bg-surface aria-expanded:border-ring aria-expanded:bg-surface aria-invalid:border-danger-mid aria-invalid:hover:border-danger-mid aria-invalid:focus-visible:ring-danger/20`}
                            aria-invalid={!!error}
                            aria-describedby={error ? `${id}-error` : undefined}
                        />
                    }
                >
                    <CalendarDays className="block-4.5 inline-4.5" aria-hidden />
                    <span>{selected ? formatVisitDate(selected) : "Select a date"}</span>
                    <ChevronDown className="block-4.5 inline-4.5" aria-hidden />
                </PopoverTrigger>
                <PopoverContent
                    aria-label="Choose visit date"
                    align="center"
                    className="p-0 inline-[min(21rem,calc(100vw-1.5rem))]"
                >
                    <Calendar
                        className="inline-full [&_table]:table-fixed [&_td]:min-inline-0"
                        mode="single"
                        weekStartsOn={1}
                        timeZone="Asia/Kolkata"
                        selected={selected}
                        defaultMonth={selected ?? new Date(`${minDate}T12:00:00+05:30`)}
                        onSelect={(date) => {
                            if (date) {
                                onChange(istDateKey(date));
                                setOpen(false);
                            }
                        }}
                        disabled={[
                            { before: new Date(`${minDate}T00:00:00+05:30`) },
                            { after: new Date(`${maxDate}T23:59:59+05:30`) },
                        ]}
                    />
                </PopoverContent>
            </Popover>
            {error && (
                <p id={`${id}-error`} role="alert" className={styles.fieldError}>
                    {error}
                </p>
            )}
        </div>
    );
}
