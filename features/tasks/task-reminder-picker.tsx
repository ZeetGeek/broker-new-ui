"use client";

import { ReminderPicker } from "@/components/shared/reminder-picker";

import { TASK_REMINDERS, taskReminderAt, taskReminderLabel } from "./model";

export function TaskReminderPicker({
    dueDate,
    dueTime,
    ...props
}: {
    reminders: number[];
    dueDate: string;
    dueTime: string;
    now: number;
    onChange: (reminders: number[]) => void;
    disabled?: boolean;
}) {
    return (
        <ReminderPicker
            {...props}
            getReminderAt={(minutes) => taskReminderAt({ dueDate, dueTime }, minutes)}
            getReminderLabel={taskReminderLabel}
            presets={TASK_REMINDERS}
            subjectLabel="task"
            scheduleLabel="due date"
            hint="In-app reminders while this app is open. All times are IST."
        />
    );
}
