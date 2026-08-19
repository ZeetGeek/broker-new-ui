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
                <p className="eyebrow">{eyebrow}</p>
                <h1 className="h1 mbs-2 text-ink">{title}</h1>
                <p className="body mbs-2 text-ink-muted max-inline-[65ch]">{description}</p>

                <div className="mbs-6">
                    <DesignSystemNav />
                </div>

                <div className="mbs-8 md:mbs-10">{children}</div>
            </div>
        </div>
    );
}
