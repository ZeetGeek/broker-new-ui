"use client";

import { cn } from "@/lib/utils";

const PILL_CLASS = `
  rounded-full border border-border-warm bg-surface px-3 py-2 text-xs font-medium text-ink
  tabular-nums min-inline-0
  sm:px-5 sm:py-2.5 sm:text-sm
`;

export function RangeValuePill({ value, className }: { value: string; className?: string }) {
    return <span className={cn(PILL_CLASS, className)}>{value}</span>;
}

export function EditableRangeValuePill({
    value,
    placeholder,
    ariaLabel,
    onValueChange,
    className,
}: {
    value: string;
    placeholder: string;
    ariaLabel: string;
    onValueChange: (value: string) => void;
    className?: string;
}) {
    return (
        <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-label={ariaLabel}
            value={value}
            placeholder={placeholder}
            onChange={(event) => onValueChange(event.target.value)}
            className={cn(
                PILL_CLASS,
                `
                  text-center transition-[border-color,box-shadow] duration-160 outline-none
                  placeholder:text-ink-subtle
                  focus:border-brand focus:ring-2 focus:ring-brand/20
                `,
                className,
            )}
        />
    );
}
