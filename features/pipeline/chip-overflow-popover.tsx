"use client";

import { cn } from "@/lib/utils";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Shared urgency ranking for anything shown in a deal card's chip row —
 * blocker facts outrank money facts, which outrank plain neutral facts.
 * `deal-card.tsx` sorts on this before slicing the top two.
 */
export type ChipTone = "danger" | "urgent" | "neutral";

export type OverflowChipItem = {
    key: string;
    label: string;
    tone: ChipTone;
};

const DOT_TONE_CLASS: Record<ChipTone, string> = {
    danger: "bg-danger",
    urgent: "bg-urgent",
    neutral: "bg-ink-subtle",
};

/**
 * The "+N" pill a deal card shows once more than two chips apply. Keeps the
 * card face to a hard two-chip limit while nothing the broker needs is lost
 * — it is one tap away instead of gone.
 */
export function ChipOverflowPopover({ items }: { items: OverflowChipItem[] }) {
    if (items.length === 0) return null;

    return (
        <Popover>
            <PopoverTrigger
                className="
                  body-xs rounded-sm bg-surface-muted px-2 py-0.5 font-semibold text-ink-muted
                  hover:bg-brand-soft hover:text-brand-text
                "
                onClick={(event) => event.stopPropagation()}
            >
                +{items.length}
            </PopoverTrigger>
            <PopoverContent align="start" className="gap-1.5 p-3 inline-56">
                <p className="body-xs font-semibold text-ink">More on this deal</p>
                <ul className="flex flex-col gap-1.5">
                    {items.map((item) => (
                        <li key={item.key} className="flex items-center gap-2">
                            <span
                                aria-hidden
                                className={cn(
                                    "shrink-0 rounded-full block-2 inline-2",
                                    DOT_TONE_CLASS[item.tone],
                                )}
                            />
                            <span className="body-sm text-ink">{item.label}</span>
                        </li>
                    ))}
                </ul>
            </PopoverContent>
        </Popover>
    );
}
