"use client";

import type { ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

import { IconButtonFace } from "@/components/shared/icon-button-face";
import { ChevronDown } from "@/components/shared/icons";

/** Reveal collapsed groups before focusing invalid fields or linked content. */
export function revealDrawerSections(container: ParentNode) {
    container
        .querySelectorAll<HTMLDetailsElement>("details[data-drawer-section]")
        .forEach((section) => {
            section.open = true;
        });
}

/** Shared, independently collapsible group for drawer forms and record details. */
export function DrawerSection({
    title,
    description,
    children,
    className,
    contentClassName,
    sectionRef,
    headingLevel = 2,
    tone = "default",
    defaultOpen = true,
}: {
    title: ReactNode;
    description?: string;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    sectionRef?: Ref<HTMLElement>;
    headingLevel?: 2 | 3;
    tone?: "default" | "private";
    defaultOpen?: boolean;
}) {
    return (
        <section
            ref={sectionRef}
            className={cn(
                "scroll-mbs-5 border-be border-border-warm py-6 first:pbs-0 last:border-be-0 last:pbe-0",
                tone === "private" && "text-brand-text",
                className,
            )}
            onInvalidCapture={(event) => {
                // Native form validation must never focus an input hidden in a closed group.
                if (event.target instanceof HTMLElement) {
                    let group = event.target.closest("details");
                    while (group) {
                        group.open = true;
                        group = group.parentElement?.closest("details") ?? null;
                    }
                }
            }}
        >
            <details open={defaultOpen} data-drawer-section className="group/drawer-section">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm outline-none [&::-webkit-details-marker]:hidden">
                    <span className="min-inline-0">
                        <span
                            role="heading"
                            aria-level={headingLevel}
                            className="block font-display text-lg font-semibold tracking-[-0.02em] text-ink"
                        >
                            {title}
                        </span>
                        {description ? (
                            <span className="mbs-0.5 block text-sm/6 text-ink-muted max-inline-2xl">
                                {description}
                            </span>
                        ) : null}
                    </span>
                    <IconButtonFace>
                        <ChevronDown
                            aria-hidden
                            className="block-4 inline-4 group-open/drawer-section:rotate-180"
                            strokeWidth={1.75}
                        />
                    </IconButtonFace>
                </summary>
                <div className={cn("pbs-5 min-inline-0", contentClassName)}>{children}</div>
            </details>
        </section>
    );
}
