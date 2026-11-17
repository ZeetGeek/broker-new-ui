import type { ReactNode } from "react";

import { formatCharacterCount } from "@/lib/format/character-count";
import { cn } from "@/lib/utils";

type CharacterCountProps = {
    /** Text being counted. Same UTF-16 length the textarea's `maxLength` uses. */
    value: string | null | undefined;
    maxChars: number;
    /** Helper copy on the left of the same row. */
    hint?: ReactNode;
    /** Put on the counter so the field can point `aria-describedby` at it. */
    id?: string;
    className?: string;
};

/**
 * "21 / 500 characters" under a text field, right-aligned, with optional
 * helper copy on the left. Turns red if the text is over the limit (only
 * possible when the field was pre-filled with older, longer text).
 *
 * Renders spans only, so it can sit inside a `<p>` hint slot.
 */
export function CharacterCount({ value, maxChars, hint, id, className }: CharacterCountProps) {
    const length = value?.length ?? 0;
    return (
        <span
            className={cn(
                "flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-xs/5 font-normal text-ink-muted",
                className,
            )}
        >
            {hint ? <span className="min-inline-0">{hint}</span> : null}
            <span
                id={id}
                className={cn("tabular ms-auto shrink-0", length > maxChars && "text-danger")}
            >
                {formatCharacterCount(length, maxChars)}
            </span>
        </span>
    );
}
