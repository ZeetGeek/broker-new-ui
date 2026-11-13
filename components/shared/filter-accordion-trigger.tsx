"use client";

import { AccordionTrigger } from "@/components/ui/accordion";

export function FilterAccordionTrigger({
    title,
    summary,
    description,
}: {
    title: string;
    summary?: string;
    description?: string;
}) {
    return (
        <AccordionTrigger
            className="
              items-center gap-3 rounded-none border-0 px-0 py-5 text-ink
              hover:no-underline
              focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
              focus-visible:ring-offset-surface
              data-panel-open:text-ink
            "
        >
            <span className="flex flex-1 flex-col items-start gap-1.5 min-inline-0">
                <span className="font-display text-lg font-semibold tracking-tight">{title}</span>
                {description ? (
                    <span
                        className="
                          hidden text-xs/relaxed font-normal text-ink/65
                          group-aria-expanded/accordion-trigger:block
                        "
                    >
                        {description}
                    </span>
                ) : null}
                {summary ? (
                    <span
                        className="
                          body-sm font-normal text-ink/65
                          group-aria-expanded/accordion-trigger:hidden
                        "
                    >
                        {summary}
                    </span>
                ) : null}
            </span>
        </AccordionTrigger>
    );
}
