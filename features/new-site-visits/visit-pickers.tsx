"use client";

import { AppDatePicker } from "@/components/shared/app-date-picker";

import styles from "./visits.module.css";

/** Scheduling constraints and errors around the same date picker used by Tasks. */
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
    return (
        <div>
            <AppDatePicker
                id={id}
                value={value || null}
                onChange={(date) => {
                    if (date) onChange(date);
                }}
                min={minDate}
                max={maxDate}
                allowPast
                required
                disabled={disabled}
                invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                placeholder="Select a date"
                className="border-2 text-sm block-control-lg"
            />
            {error && (
                <p id={`${id}-error`} role="alert" className={styles.fieldError}>
                    {error}
                </p>
            )}
        </div>
    );
}
