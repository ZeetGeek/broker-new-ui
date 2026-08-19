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
        <div className="bg-canvas min-block-screen">
            <div className="mx-auto px-4 py-8 max-inline-[1280px] md:px-8 md:py-12">
                <p className="text-[11px] font-medium tracking-[0.08em] text-ink-subtle uppercase">
                    {eyebrow}
                </p>
                <h1
                    className="
                      mbs-2 font-display text-[28px] leading-[1.08] font-bold tracking-tight
                      text-ink
                      md:text-[40px]
                    "
                >
                    {title}
                </h1>
                <p
                    className="
                      mbs-2 text-[15px] leading-[1.55] text-ink-muted max-inline-[65ch]
                      md:text-base
                    "
                >
                    {description}
                </p>

                <div className="mbs-6">
                    <DesignSystemNav />
                </div>

                <div className="mbs-8 md:mbs-10">{children}</div>
            </div>
        </div>
    );
}
