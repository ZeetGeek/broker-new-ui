"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

import { AppDatePicker } from "@/components/shared/app-date-picker";

/** Date ranges always expose separately labelled start and end date inputs. */
export function AppDateRangeFields({
    from,
    to,
    onChange,
    disabled = false,
    className,
}: {
    from: string;
    to: string;
    onChange: (range: { from: string; to: string }) => void;
    disabled?: boolean;
    className?: string;
}) {
    const id = useId();
    const invalid = !!(from && to && from > to);
    return (
        <div className={cn("grid grid-cols-1 gap-4 min-inline-0 sm:grid-cols-2", className)}>
            <div className="flex flex-col gap-2 min-inline-0">
                <label htmlFor={`${id}-from`} className="body-sm font-semibold text-ink">
                    Start date
                </label>
                <AppDatePicker
                    id={`${id}-from`}
                    value={from || null}
                    onChange={(next) => onChange({ from: next ?? "", to })}
                    placeholder="Select start date"
                    allowPast
                    disabled={disabled}
                />
            </div>
            <div className="flex flex-col gap-2 min-inline-0">
                <label htmlFor={`${id}-to`} className="body-sm font-semibold text-ink">
                    End date
                </label>
                <AppDatePicker
                    id={`${id}-to`}
                    value={to || null}
                    onChange={(next) => onChange({ from, to: next ?? "" })}
                    placeholder="Select end date"
                    allowPast
                    min={from || undefined}
                    disabled={disabled}
                    invalid={invalid}
                    aria-describedby={invalid ? `${id}-error` : undefined}
                />
                {invalid && (
                    <p id={`${id}-error`} role="alert" className="body-xs text-danger">
                        End date must be on or after start date.
                    </p>
                )}
            </div>
        </div>
    );
}
