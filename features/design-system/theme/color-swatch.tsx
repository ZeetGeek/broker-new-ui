import { cn } from "@/lib/utils";

import type { ColorToken } from "@/features/design-system/theme/color-tokens";

export function ColorSwatch({ token }: { token: ColorToken }) {
    return (
        <div className="overflow-hidden rounded-card border border-border-warm bg-surface">
            <div
                className={cn("block-20 inline-full", token.className)}
                style={{ backgroundColor: token.hex }}
            />
            <div className="space-y-1 p-4">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="body font-medium text-ink">{token.name}</span>
                    <span className="body-sm tabular text-ink-subtle">{token.hex}</span>
                </div>
                <code className="body-sm block text-ink-muted">{token.variable}</code>
                <p className="body-sm pbs-1 text-ink-muted">{token.usage}</p>
            </div>
        </div>
    );
}
