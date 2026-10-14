"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { DigitPopIn } from "./digit-pop-in";

export function MetricCell({
    label,
    value,
    hint,
    valueClassName,
}: {
    label: string;
    value: number;
    hint: string;
    valueClassName?: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <button
                        type="button"
                        aria-label={`${label}: ${value}. ${hint}`}
                        className="
                          flex flex-1 flex-col items-start gap-0.5 rounded-inner px-2 text-start
                          outline-none min-inline-0 sm:px-3
                          focus-visible:ring-2 focus-visible:ring-ring
                        "
                    >
                        <span className="body-xs font-medium text-ink-muted">{label}</span>
                        <span
                            className={cn("tabular h5 font-semibold", valueClassName ?? "text-ink")}
                        >
                            <DigitPopIn value={value} />
                        </span>
                    </button>
                }
            />
            <TooltipContent side="bottom" align="center" className="text-pretty max-inline-64">
                {hint}
            </TooltipContent>
        </Tooltip>
    );
}

export function MetricDivider() {
    return <div className="shrink-0 self-stretch bg-border inline-px" aria-hidden />;
}

export function MetricStrip({
    label,
    children,
    className,
}: {
    label: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "mbs-4 flex shrink-0 items-stretch rounded-inner bg-surface-muted px-2 py-3",
                className,
            )}
            role="group"
            aria-label={label}
        >
            {children}
        </div>
    );
}
