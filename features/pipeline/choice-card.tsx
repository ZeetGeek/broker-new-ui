"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { RadioGroupItem } from "@/components/ui/radio-group";

/**
 * One choice. The radio and its words are the label; anything passed as
 * `children` (an amount box, say) sits inside the same card but outside the
 * label, so tapping into the box never re-fires the radio.
 */
export function ChoiceCard({
    value,
    selected,
    disabled,
    title,
    detail,
    children,
}: {
    value: string;
    selected: boolean;
    disabled: boolean;
    title: string;
    detail?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div
            className={cn(
                "rounded-card border transition-[background-color,border-color] duration-160",
                selected
                    ? "border-brand bg-brand-soft/40"
                    : "border-border-warm bg-surface hover:border-ink/20",
                disabled && "opacity-60",
            )}
        >
            <label
                className={cn(
                    "flex items-start gap-3 px-4 py-3.5 min-block-12",
                    disabled ? "cursor-not-allowed" : "cursor-pointer",
                )}
            >
                <RadioGroupItem
                    value={value}
                    disabled={disabled}
                    // The shared radio rests as a grey dot that reads as
                    // disabled; an outlined ring reads as "pick me".
                    className="mbs-0.5 shrink-0 border-ink/30 bg-surface data-checked:border-transparent"
                />
                <span className="flex flex-1 flex-col gap-0.5 min-inline-0">
                    <span className="body-sm font-semibold text-ink">{title}</span>
                    {detail ? <span className="body-xs text-ink-muted">{detail}</span> : null}
                </span>
            </label>
            {children ? <div className="px-4 pbe-4">{children}</div> : null}
        </div>
    );
}
