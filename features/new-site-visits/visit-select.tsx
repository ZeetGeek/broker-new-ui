"use client";

import { type ComponentProps, useId } from "react";

import { cn } from "@/lib/utils";

import { filterChipClassName } from "@/components/shared/filter-chip";
import type { AppIcon } from "@/components/shared/icons";
import { ArrowDownUp, ChevronDown } from "@/components/shared/icons";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    toolbar = false,
    size = "default",
    startIcon,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    compact?: boolean;
    toolbar?: boolean;
    size?: ComponentProps<typeof SelectTrigger>["size"];
    startIcon?: AppIcon;
}) {
    const id = useId();
    if (toolbar) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <button
                            type="button"
                            aria-label={`${label}: ${options.find((option) => option.value === value)?.label ?? value}`}
                            className={cn(filterChipClassName(true), "gap-2")}
                        />
                    }
                >
                    <ArrowDownUp
                        aria-hidden
                        className="text-brand block-4 inline-4"
                        strokeWidth={1.75}
                    />
                    <span>{options.find((option) => option.value === value)?.label ?? value}</span>
                    <ChevronDown
                        aria-hidden
                        className="opacity-60 block-3.5 inline-3.5"
                        strokeWidth={1.75}
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-inline-44">
                    {options.map((option) => (
                        <DropdownMenuItem
                            key={option.value}
                            onClick={() => onChange(option.value)}
                            className={cn(value === option.value && "font-semibold text-brand")}
                        >
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }
    return (
        <div className={compact ? "min-inline-36" : "flex flex-col gap-2"}>
            {!compact && (
                <label className="text-sm font-semibold text-ink" htmlFor={id}>
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
                    size={compact ? "sm" : size}
                    startIcon={startIcon}
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
