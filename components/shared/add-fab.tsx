"use client";

import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * The floating "add" action. Sits clear of the mobile bottom nav, pulses once
 * so it reads as the primary thing to do on an otherwise passive list screen.
 *
 * Shared rather than per-feature: Your listings and Contacts both use it, and
 * two copies would drift on position, size, or the safe-area inset.
 */
export function AddFab({
    onClick,
    label,
    hint,
    className,
}: {
    onClick: () => void;
    /** Accessible name, e.g. "Add buyer". Verb first, two words. */
    label: string;
    /** One line explaining what the button does, shown on hover. */
    hint: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                `
                  fixed inset-e-8 inset-be-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 block-14
                  inline-14
                  md:inset-e-10 md:inset-be-10
                `,
                className,
            )}
        >
            <span
                aria-hidden
                className="
                  pointer-events-none absolute inset-0 z-0 animate-fab-pulse rounded-full bg-brand
                  motion-reduce:hidden
                "
            />
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger
                        delay={200}
                        render={
                            <button
                                type="button"
                                onClick={onClick}
                                aria-label={label}
                                title={label}
                                className="
                                  relative z-10 flex items-center justify-center rounded-full
                                  bg-brand text-surface shadow-lg
                                  transition-[background-color,transform] duration-160 block-14
                                  inline-14
                                  hover:bg-brand/85
                                  focus-visible:ring-3 focus-visible:ring-ring/30
                                  focus-visible:outline-none
                                  active:scale-[0.97]
                                "
                            >
                                <Plus aria-hidden className="block-6 inline-6" strokeWidth={2} />
                            </button>
                        }
                    />
                    <TooltipContent side="left" sideOffset={12} className="body-sm font-medium">
                        {hint}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
