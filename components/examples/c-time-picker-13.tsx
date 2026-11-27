"use client";

import { useState } from "react";

import { formatWeekdayDate } from "@/lib/format/date";

import { TimePicker, TimePickerColumns, TimePickerPanel } from "@/components/reui/time-picker";
import { AppDateCalendar, parseCalendarDate } from "@/components/shared/app-date-calendar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const SUGGESTED_DAY = "2026-10-14";

export function Pattern() {
    const [date, setDate] = useState(SUGGESTED_DAY);
    const [time, setTime] = useState("09:00");
    const [scheduled, setScheduled] = useState<string | null>(null);

    const selected = parseCalendarDate(date);
    const summary = selected ? `${formatWeekdayDate(selected)} at ${time}` : "";
    /* Derived, so changing the day or the time after scheduling reads as a
     new, unsaved choice again. */
    const isScheduled = scheduled === summary;

    return (
        <Card className="mx-auto inline-fit max-inline-full">
            <CardHeader>
                <CardTitle>Schedule a post</CardTitle>
                <CardDescription>Pick the day and the time it goes live.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    {/* `required` keeps one day selected, so the summary always has
              a date to show. */}
                    <AppDateCalendar
                        value={date}
                        allowPast
                        required
                        onChange={(next) => {
                            if (next) setDate(next);
                        }}
                    />
                    <div className="flex justify-center self-stretch max-sm:border-bs max-sm:pbs-4 sm:border-s sm:ps-4">
                        <TimePicker
                            aria-label="Publish time"
                            value={time}
                            onValueChange={(next) => {
                                /* No footer means no Clear, so `next` is never null here. */
                                if (next) setTime(next);
                            }}
                            minuteStep={15}
                        >
                            <TimePickerPanel className="[--time-picker-rows:7]">
                                {/* No footer: Now would set the time but not the date. */}
                                <TimePickerColumns />
                            </TimePickerPanel>
                        </TimePicker>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <p role="status" className="me-3 flex-1 text-sm min-inline-0">
                    {isScheduled && <span className="text-muted-foreground">Scheduled for </span>}
                    <span className="font-medium tabular-nums">{summary}</span>
                </p>
                <Button onClick={() => setScheduled(summary)}>Schedule</Button>
            </CardFooter>
        </Card>
    );
}
