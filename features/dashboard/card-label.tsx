import type { ReactNode } from "react";

import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type CardLabelProps = {
    children: ReactNode;
    className?: string;
    /** Dark attention cards use a quieter mark so the label still reads. */
    tone?: "light" | "dark";
    /** Short description of what the card shows — renders an info icon with a tooltip. */
    info?: string;
};

/**
 * Section label for dashboard cards — eyebrow type with a brand mark.
 * Keeps the DESIGN.md eyebrow pattern; the mark gives it presence on cream.
 */
export function CardLabel({ children, className, tone = "light", info }: CardLabelProps) {
    const isDark = tone === "dark";

    return (
        <div
            className={cn(
                "eyebrow flex items-center gap-2",
                isDark ? "text-white/60" : "text-ink-muted",
                className,
            )}
        >
            <span
                className={cn(
                    "shrink-0 rounded-full block-1.5 inline-1.5",
                    isDark ? "bg-white/45" : "bg-brand",
                )}
                aria-hidden
            />
            <span className="min-inline-0">{children}</span>
            {info ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <button
                                type="button"
                                aria-label={`About ${typeof children === "string" ? children : "this card"}`}
                                className={cn(
                                    `
                                      inline-flex shrink-0 items-center justify-center rounded-full
                                      outline-none
                                      focus-visible:ring-2 focus-visible:ring-ring
                                    `,
                                    isDark
                                        ? "text-white/45 hover:text-white/70"
                                        : "text-ink-subtle hover:text-ink-muted",
                                )}
                            >
                                <Info aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                            </button>
                        }
                    />
                    <TooltipContent side="right" align="center" className="text-pretty">
                        {info}
                    </TooltipContent>
                </Tooltip>
            ) : null}
        </div>
    );
}
