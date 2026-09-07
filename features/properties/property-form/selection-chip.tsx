"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SelectionChip({
    active,
    children,
    onClick,
    className,
    showCheck = true,
}: {
    active: boolean;
    children: ReactNode;
    onClick: () => void;
    className?: string;
    showCheck?: boolean;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                `
                  inline-flex items-center gap-1.5 rounded-control border px-3.5 py-2
                  body-sm font-semibold transition-[background-color,border-color,color,transform]
                  duration-160
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
                  focus-visible:ring-offset-2 focus-visible:ring-offset-surface
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
                <Check aria-hidden className="block-3.5 inline-3.5 shrink-0" strokeWidth={2.5} />
            ) : null}
            {children}
        </button>
    );
}
