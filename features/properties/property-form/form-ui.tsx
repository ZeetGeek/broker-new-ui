"use client";

import { type ReactNode, useId, useState } from "react";

import { cn } from "@/lib/utils";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * One collapsible block of the property form. Sections start open; a section
 * that holds an invalid field re-opens itself on submit so the error is never
 * hidden inside a collapsed panel.
 */
export function FormSection({
    title,
    description,
    children,
    className,
    defaultOpen = true,
    hasError = false,
    summary,
    icon,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    defaultOpen?: boolean;
    hasError?: boolean;
    /** Short recap shown on the trigger while the section is collapsed. */
    summary?: string;
    /** Leading glyph for the section header. */
    icon?: ReactNode;
}) {
    const value = useId();
    const [openItems, setOpenItems] = useState<string[]>(defaultOpen ? [value] : []);
    const [prevHasError, setPrevHasError] = useState(hasError);

    // A section that just became invalid opens itself, so a failed submit never
    // hides its error inside a collapsed panel.
    if (hasError !== prevHasError) {
        setPrevHasError(hasError);
        if (hasError && !openItems.includes(value)) {
            setOpenItems([...openItems, value]);
        }
    }

    const isOpen = openItems.includes(value);

    return (
        <Accordion
            value={openItems}
            onValueChange={(next) => setOpenItems(next as string[])}
            className={cn(
                "overflow-hidden rounded-control border border-border-warm/80 bg-surface-muted/50",
                hasError && "border-danger/40",
                className,
            )}
        >
            <AccordionItem value={value} className="border-be-0 data-open:bg-transparent">
                <AccordionTrigger
                    className={`
                      items-center gap-4 p-4 no-underline
                      hover:no-underline
                      focus-visible:ring-3 focus-visible:ring-ring/30
                      **:data-[slot=accordion-trigger-icon]:text-ink-muted
                      sm:p-5
                    `}
                >
                    <span className="flex items-center gap-3 min-inline-0">
                        {icon ? (
                            <span
                                aria-hidden
                                className={cn(
                                    `
                                      flex shrink-0 items-center justify-center rounded-control
                                      border border-border-warm bg-surface text-ink-muted block-10
                                      inline-10
                                      [&_svg]:block-5 [&_svg]:inline-5
                                    `,
                                    hasError && "border-danger/40 text-danger",
                                )}
                            >
                                {icon}
                            </span>
                        ) : null}
                        <span className="flex flex-col gap-1 text-start min-inline-0">
                            <span className="h6 text-ink">{title}</span>
                            {!isOpen && summary ? (
                                <span className="body-sm truncate text-ink-muted">{summary}</span>
                            ) : description ? (
                                <span className="body-sm text-ink-muted">{description}</span>
                            ) : null}
                        </span>
                    </span>
                </AccordionTrigger>
                {/* -mx-4 cancels the vendored Panel's own px-4; the inner padding
                    then matches the trigger so fields line up with the heading. */}
                <AccordionContent className="-mx-4 pbs-0 pbe-0">
                    <div className="px-4 pbe-4 sm:px-5 sm:pbe-5">{children}</div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
