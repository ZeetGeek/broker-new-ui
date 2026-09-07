"use client";

import type { ReactNode } from "react";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function SelectionChip({
    active,
    children,
    onClick,
    className,
    showCheck = true,
    icon,
}: {
    active: boolean;
    children: ReactNode;
    onClick: () => void;
    className?: string;
    showCheck?: boolean;
    /** Leading glyph shown while inactive; the check replaces it when active. */
    icon?: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                `
                  body-sm inline-flex items-center gap-1.5 rounded-control border px-4 py-2.5
                  font-semibold transition-[background-color,border-color,color,transform]
                  duration-160
                  focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
                  focus-visible:ring-offset-surface focus-visible:outline-none
                  active:scale-[0.98]
                `,
                active
                    ? "border-brand bg-brand-soft text-brand-text"
                    : `
                      border-border-warm bg-surface text-ink-muted
                      hover:border-brand/40 hover:text-ink
                    `,
                className,
            )}
        >
            {active && showCheck ? (
                <Check aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={2.5} />
            ) : icon ? (
                <span aria-hidden className="shrink-0 [&_svg]:block-4 [&_svg]:inline-4">
                    {icon}
                </span>
            ) : null}
            {children}
        </button>
    );
}
