"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Separator } from "@/components/ui/separator";

export function FormSection({
    title,
    description,
    children,
    className,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                `
                  flex flex-col gap-4 rounded-card border border-border-warm/70 bg-canvas/50
                  p-4 sm:p-5
                `,
                className,
            )}
        >
            <div className="flex flex-col gap-1">
                <h3 className="h6 text-ink">{title}</h3>
                {description ? <p className="body-sm text-ink-muted">{description}</p> : null}
            </div>
            <Separator className="bg-border-warm/60" />
            {children}
        </section>
    );
}
