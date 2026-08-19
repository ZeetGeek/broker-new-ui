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
                    <span className="body font-medium text-ink">{variant.name}</span>
                    <span className="body-sm tabular text-ink-subtle">{variant.hex}</span>
                </div>
                <code className="body-sm block text-ink-muted">{variant.token}</code>
                <p className="body-sm pbs-1 text-ink-muted">{variant.usage}</p>
            </div>
        </div>
    );
}
