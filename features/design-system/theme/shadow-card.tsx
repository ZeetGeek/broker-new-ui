import { cn } from "@/lib/utils";

import type { ShadowToken } from "@/features/design-system/theme/shadow-tokens";

export function ShadowCard({ token }: { token: ShadowToken }) {
    return (
        <div className="flex flex-col items-center gap-4 rounded-card bg-surface-muted p-8">
            <div
                className={cn(
                    "flex h-20 w-full items-center justify-center rounded-inner bg-surface",
                    token.className,
                )}
            >
                <span className="text-[13px] font-medium text-ink-muted">Aa</span>
            </div>
            <div className="w-full space-y-1 text-left">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-medium text-ink">{token.name}</span>
                    <code className="text-[13px] text-brand">{token.className}</code>
                </div>
                <code className="block text-[13px] text-ink-muted">{token.variable}</code>
                <p className="pt-1 text-[13px] leading-[1.45] text-ink-muted">{token.css}</p>
                <p className="pt-1 text-[13px] leading-[1.45] text-ink-subtle">{token.usage}</p>
            </div>
        </div>
    );
}
