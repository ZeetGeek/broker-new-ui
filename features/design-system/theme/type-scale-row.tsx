import { cn } from "@/lib/utils";

import type { TypeScaleStep } from "@/features/design-system/theme/type-scale";

export function TypeScaleRow({ step }: { step: TypeScaleStep }) {
    const isEyebrow = step.token === "eyebrow";
    const Tag = step.element;

    return (
        <div className="grid grid-cols-1 gap-3 border-b border-border-warm py-5 md:grid-cols-[140px_1fr] md:gap-6 last:border-b-0">
            <div>
                <p className="text-[13px] font-medium text-ink">{step.name}</p>
                <code className="text-[13px] text-brand">{step.token}</code>
                <p className="tabular text-[13px] text-ink-subtle">
                    {step.mobilePx}px / {step.desktopPx}px
                </p>
                <p className="text-[13px] text-ink-subtle">
                    weight {step.weight} · tracking {step.tracking}
                </p>
            </div>
            <Tag
                className={cn(
                    step.face === "display" ? "font-display" : "font-sans",
                    isEyebrow && "uppercase text-ink-subtle",
                )}
                style={{
                    fontSize: `clamp(${step.mobilePx}px, ${step.mobilePx}px + 1vw, ${step.desktopPx}px)`,
                    fontWeight: step.weight,
                    letterSpacing: step.tracking,
                    lineHeight: step.leading,
                    color: isEyebrow ? undefined : "var(--color-ink)",
                    margin: 0,
                }}
            >
                {step.sample}
            </Tag>
        </div>
    );
}
