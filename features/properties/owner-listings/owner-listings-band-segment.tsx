"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type OwnerListingsBandSegmentProps = {
    label: string;
    value: string;
    icon: LucideIcon;
    className?: string;
    onClick?: () => void;
    isOpen?: boolean;
};

export function OwnerListingsBandDivider({ className }: { className?: string }) {
    return (
        <div
            className={cn("my-auto block-7 w-px shrink-0 bg-border-warm/80", className)}
            aria-hidden
        />
    );
}

export function OwnerListingsBandSegment({
    label,
    value,
    icon: Icon,
    className,
    onClick,
    isOpen,
}: OwnerListingsBandSegmentProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                `
                  flex min-w-0 flex-1 items-center gap-2.5 rounded-inner px-3.5 py-2.5 text-start
                  transition-colors duration-160
                  hover:bg-surface-muted/70
                `,
                className,
            )}
            aria-expanded={isOpen}
        >
            <Icon
                aria-hidden
                className="block-4 inline-4 shrink-0 text-brand"
                strokeWidth={1.75}
            />
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <span className="eyebrow shrink-0 text-ink-muted">{label}</span>
                <span className="flex w-full min-w-0 items-center gap-1.5">
                    <span className="body-sm truncate font-medium text-ink">{value}</span>
                    <ChevronDown
                        aria-hidden
                        className={cn(
                            "block-3.5 inline-3.5 shrink-0 text-ink-subtle transition-transform duration-160",
                            isOpen && "rotate-180",
                        )}
                        strokeWidth={1.75}
                    />
                </span>
            </span>
        </button>
    );
}
