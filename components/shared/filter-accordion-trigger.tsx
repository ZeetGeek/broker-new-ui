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
              items-start gap-3 rounded-none border-0 px-0 py-4 text-ink
              hover:no-underline
              data-panel-open:text-ink
              **:data-[slot=accordion-trigger-icon]:ms-0
              sm:py-5
            "
        >
            {/* Title row matches the chevron face height so the chevron stays
                pinned beside the title, not centred across the description. */}
            <span className="flex flex-1 flex-col items-start gap-1 min-inline-0">
                <span
                    className="
                      flex items-center font-display text-base font-semibold tracking-tight
                      min-block-8
                      max-md:min-block-(--touch-target-min)
                      sm:text-lg
                    "
                >
                    {title}
                </span>
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
