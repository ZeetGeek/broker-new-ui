import type { ReactNode } from "react";

import { DesignSystemNav } from "@/features/design-system/design-system-nav";

export function DesignSystemShell({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen bg-canvas">
            <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 md:py-12">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
                    {eyebrow}
                </p>
                <h1 className="mt-2 font-display text-[28px] font-bold leading-[1.08] tracking-tight text-ink md:text-[40px]">
                    {title}
                </h1>
                <p className="mt-2 max-w-[65ch] text-[15px] leading-[1.55] text-ink-muted md:text-base">
                    {description}
                </p>

                <div className="mt-6">
                    <DesignSystemNav />
                </div>

                <div className="mt-8 md:mt-10">{children}</div>
            </div>
        </div>
    );
}
