"use client";

import { inputValueToUtc } from "@/lib/visits/time";

import { ReminderPicker } from "@/components/shared/reminder-picker";

import { MAX_VISIT_REMINDERS, VISIT_REMINDERS, visitReminderAt, visitReminderLabel } from "./model";

export function VisitReminderPicker({
    reminders,
    date,
    startTime,
    now,
    disabled,
    compact,
    onChange,
}: {
    reminders: number[];
    date: string;
    startTime: string;
    now: number;
    disabled: boolean;
    compact?: boolean;
    onChange: (values: number[]) => void;
}) {
    const scheduledAt = () => inputValueToUtc(`${date}T${startTime}`);

    return (
        <ReminderPicker
            reminders={reminders}
            getReminderAt={(minutes) => {
                try {
                    return visitReminderAt(scheduledAt(), minutes);
                } catch {
                    return null;
                }
            }}
            getReminderLabel={visitReminderLabel}
            presets={VISIT_REMINDERS}
            subjectLabel="visit"
            scheduleLabel="visit date and time"
            hint="We’ll notify you before the visit."
            now={now}
            onChange={onChange}
            disabled={disabled}
            compact={compact}
            minReminders={1}
            maxReminders={MAX_VISIT_REMINDERS}
        />
    );
}
