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
            className={cn("my-auto shrink-0 bg-border-warm/80 block-7 inline-px", className)}
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
                  group flex flex-1 items-center gap-2.5 rounded-inner px-3.5 py-2.5 text-start
                  transition-colors duration-160 min-inline-0
                  hover:bg-surface-muted/70
                `,
                className,
            )}
            aria-expanded={isOpen}
        >
            <Icon aria-hidden className="shrink-0 text-brand block-4 inline-4" strokeWidth={1.75} />
            <span className="flex flex-1 flex-col items-start gap-1 min-inline-0">
                <span className="eyebrow shrink-0 text-ink-muted">{label}</span>
                <span className="flex items-center gap-1.5 inline-full min-inline-0">
                    <span className="body-sm truncate font-medium text-ink">{value}</span>
                    <ChevronDown
                        aria-hidden
                        className={cn(
                            `
                              shrink-0 text-ink-subtle transition-transform duration-160 block-3.5
                              inline-3.5
                              group-aria-expanded:rotate-180
                            `,
                            isOpen && "rotate-180",
                        )}
                        strokeWidth={1.75}
                    />
                </span>
            </span>
        </button>
    );
}
