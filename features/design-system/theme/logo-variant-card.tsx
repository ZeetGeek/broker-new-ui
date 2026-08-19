import { cn } from "@/lib/utils";

import { LogoMark } from "@/components/shared/logo";

import type { LogoColorVariant } from "@/features/design-system/theme/logo-tokens";

export function LogoVariantCard({ variant }: { variant: LogoColorVariant }) {
    return (
        <div className="overflow-hidden rounded-card border border-border-warm bg-surface">
            <div
                className={cn(
                    "flex items-center justify-center px-6 block-36",
                    variant.surfaceClass,
                )}
            >
                <LogoMark size={128} className={variant.fillClass} decorative />
            </div>
            <div className="space-y-1 p-4">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-medium text-ink">{variant.name}</span>
                    <span className="tabular text-[13px] text-ink-subtle">{variant.hex}</span>
                </div>
                <code className="block text-[13px] text-ink-muted">{variant.token}</code>
                <p className="pbs-1 text-[13px] leading-[1.45] text-ink-muted">{variant.usage}</p>
            </div>
        </div>
    );
}
