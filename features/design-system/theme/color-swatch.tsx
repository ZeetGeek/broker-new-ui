import { cn } from "@/lib/utils";

import type { ColorToken } from "@/features/design-system/theme/color-tokens";

export function ColorSwatch({ token }: { token: ColorToken }) {
    return (
        <div className="overflow-hidden rounded-card border border-border-warm bg-surface">
            <div
                className={cn("h-20 w-full", token.className)}
                style={{ backgroundColor: token.hex }}
            />
            <div className="space-y-1 p-4">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-medium text-ink">{token.name}</span>
                    <span className="tabular text-[13px] text-ink-subtle">{token.hex}</span>
                </div>
                <code className="block text-[13px] text-ink-muted">{token.variable}</code>
                <p className="pt-1 text-[13px] leading-[1.45] text-ink-muted">{token.usage}</p>
            </div>
        </div>
    );
}
