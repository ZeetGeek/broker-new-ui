import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CardLabelProps = {
    children: ReactNode;
    className?: string;
    /** Dark attention cards use a quieter mark so the label still reads. */
    tone?: "light" | "dark";
};

/**
 * Section label for dashboard cards — eyebrow type with a brand mark.
 * Keeps the DESIGN.md eyebrow pattern; the mark gives it presence on cream.
 */
export function CardLabel({ children, className, tone = "light" }: CardLabelProps) {
    const isDark = tone === "dark";

    return (
        <p
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
        </p>
    );
}
