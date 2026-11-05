"use client";

import { useId } from "react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function VisitSelect({
    label,
    value,
    options,
    onChange,
    compact = false,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    compact?: boolean;
}) {
    const id = useId();
    return (
        <div className={compact ? "min-inline-36" : "flex flex-col gap-2"}>
            {!compact && (
                <label className="body-sm font-semibold text-ink" htmlFor={id}>
                    {label}
                </label>
            )}
            <Select
                items={options}
                value={value}
                onValueChange={(next) => {
                    if (next !== null) onChange(next);
                }}
            >
                <SelectTrigger
                    id={id}
                    aria-label={label}
                    size={compact ? "sm" : "default"}
                    className="inline-full"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value || "any"} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
