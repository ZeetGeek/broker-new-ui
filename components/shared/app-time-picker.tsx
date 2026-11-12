"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";
import { VISITS_TIME_ZONE } from "@/lib/visits/constants";

import {
    TimePicker,
    TimePickerContent,
    type TimePickerProps,
    TimePickerTrigger,
} from "@/components/reui/time-picker";

/** Compact field opening the time columns with Now, Clear and OK. Values stay HH:mm. */
export function AppTimePicker({
    id,
    value,
    onChange,
    error,
    className,
    onBlur,
    ...props
}: Omit<TimePickerProps, "children" | "onValueChange" | "className"> & {
    onChange: (value: string) => void;
    error?: string;
    className?: string;
    onBlur?: () => void;
}) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const describedBy =
        [props["aria-describedby"], error ? `${fieldId}-error` : null].filter(Boolean).join(" ") ||
        undefined;

    return (
        <div className={cn("min-inline-0", className)}>
            <TimePicker
                requireConfirm
                {...props}
                id={fieldId}
                timeZone={VISITS_TIME_ZONE}
                value={value || null}
                onValueChange={(next) => onChange(next ?? "")}
                invalid={props.invalid || !!error}
                aria-describedby={describedBy}
            >
                <TimePickerTrigger
                    size="lg"
                    onBlur={onBlur}
                    className="border-border-warm bg-surface font-normal text-ink shadow-none inline-full data-placeholder:text-ink-subtle"
                />
                <TimePickerContent />
            </TimePicker>
            {error && (
                <p id={`${fieldId}-error`} role="alert" className="body-xs mbs-1.5 text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
